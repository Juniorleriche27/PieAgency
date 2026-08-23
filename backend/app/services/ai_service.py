import json
import logging
from collections.abc import Iterator
from functools import lru_cache
from typing import Any

import httpx
import cohere

from ..config import settings
from ..knowledge_base import SITE_KNOWLEDGE, get_page_context
from .rag_service import retrieve_rag_context
from ..schemas import (
    AIChatRequest,
    AIChatResponse,
    AIPageInsightResponse,
    AuthUserProfile,
    CommunityAIReplyRequest,
    CommunityAIReplyResponse,
)
from .chat_store import ensure_chat_conversation, store_chat_message

logger = logging.getLogger(__name__)


def _extract_text_from_response(response: Any) -> str:
    message = getattr(response, "message", None)
    if message is None:
        return ""

    content = getattr(message, "content", None) or []
    chunks: list[str] = []

    for item in content:
        text = getattr(item, "text", None)
        if text:
            chunks.append(text)

    return "\n".join(chunks).strip()


@lru_cache(maxsize=1)
def _get_cohere_client() -> cohere.ClientV2 | None:
    if not settings.cohere_enabled:
        return None
    return cohere.ClientV2(api_key=settings.cohere_api_key)


def _chat_json(client: cohere.ClientV2, messages: list[dict[str, str]]) -> dict[str, Any]:
    response = client.chat(
        model=settings.cohere_model,
        messages=messages,
        response_format={"type": "json_object"},
    )
    return json.loads(_extract_text_from_response(response))




def _gateway_url() -> str:
    base = settings.ai_gateway_base_url.strip().rstrip("/")
    path = settings.ai_gateway_chat_path.strip() or "/v1/chat"
    if base.endswith("/chat/completions") or base.endswith("/responses"):
        return base
    return f"{base}/{path.lstrip('/')}"


def _gateway_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if settings.ai_gateway_api_key.strip():
        headers["Authorization"] = f"Bearer {settings.ai_gateway_api_key.strip()}"
    return headers


def _gateway_payload(messages: list[dict[str, str]], *, stream: bool = False, json_mode: bool = False) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "messages": messages,
        "temperature": 0.25,
        "stream": stream,
    }
    model = settings.ai_gateway_model.strip()
    if model:
        payload["model"] = model
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    return payload


def _extract_gateway_text(payload: dict[str, Any]) -> str:
    if isinstance(payload.get("answer"), str):
        return payload["answer"].strip()
    if isinstance(payload.get("text"), str):
        return payload["text"].strip()
    if isinstance(payload.get("response"), str):
        return payload["response"].strip()
    choices = payload.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0]
        if isinstance(first, dict):
            message = first.get("message")
            if isinstance(message, dict) and isinstance(message.get("content"), str):
                return message["content"].strip()
            if isinstance(first.get("text"), str):
                return first["text"].strip()
    output = payload.get("output")
    if isinstance(output, list):
        parts: list[str] = []
        for item in output:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if isinstance(content, list):
                for chunk in content:
                    if isinstance(chunk, dict) and isinstance(chunk.get("text"), str):
                        parts.append(chunk["text"])
        if parts:
            return "".join(parts).strip()
    return ""


def _parse_json_text(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


def _gateway_chat_text(messages: list[dict[str, str]], *, json_mode: bool = False) -> str:
    if not settings.ai_gateway_enabled:
        raise RuntimeError("AI Gateway is not configured")
    with httpx.Client(timeout=settings.ai_gateway_request_timeout_seconds) as client:
        response = client.post(
            _gateway_url(),
            headers=_gateway_headers(),
            json=_gateway_payload(messages, stream=False, json_mode=json_mode),
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise RuntimeError("Invalid AI Gateway response")
        text = _extract_gateway_text(payload)
        if not text:
            raise RuntimeError("Empty AI Gateway response")
        return text


def rewrite_community_draft(text: str, context: str = "") -> tuple[str, str]:
    cleaned = text.strip()
    if not cleaned:
        return "", "fallback"

    fallback = cleaned if cleaned.endswith((".", "!", "?")) else f"{cleaned}."
    messages = [
        {
            "role": "system",
            "content": (
                "Tu es uniquement un éditeur de texte dans le bouton 'Reformuler avec l’IA' de PieHUB. "
                "Ta mission est de reformuler le brouillon de l’utilisateur, pas d’y répondre. "
                "Ne donne aucun conseil, ne fais aucune analyse, ne joue pas le rôle d’un agent commercial, "
                "ne promets rien et n’ajoute pas d’informations nouvelles. "
                "Conserve l’intention, la personne grammaticale et le sens. "
                "Retourne uniquement le texte final prêt à publier, sans guillemets, sans préface, sans liste."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Contexte interface: {context or 'publication communautaire PieHUB'}.\n"
                f"Brouillon à reformuler: {cleaned}\n\n"
                "Réécris ce brouillon en français clair, naturel et respectueux. "
                "Ne réponds pas à la demande; reformule seulement la phrase de l’utilisateur."
            ),
        },
    ]
    try:
        rewritten = _gateway_chat_text(messages).strip()
        if not rewritten:
            raise ValueError("Empty rewrite")
        # Guardrail: the rewrite button must not answer like the assistant.
        forbidden_starts = (
            "voici",
            "bien sûr",
            "bien sur",
            "pour",
            "je vous conseille",
            "je peux",
            "nous pouvons",
            "pieagency peut",
        )
        if cleaned.endswith("?") and rewritten.lower().startswith(forbidden_starts):
            return fallback, "fallback"
        return rewritten, "ai_gateway"
    except Exception:
        return fallback, "fallback"


def _gateway_chat_json(messages: list[dict[str, str]]) -> dict[str, Any]:
    return _parse_json_text(_gateway_chat_text(messages, json_mode=True))


def _gateway_chat_stream(messages: list[dict[str, str]]) -> Iterator[str]:
    if not settings.ai_gateway_enabled:
        raise RuntimeError("AI Gateway is not configured")

    with httpx.stream(
        "POST",
        _gateway_url(),
        headers=_gateway_headers(),
        json=_gateway_payload(messages, stream=True),
        timeout=settings.ai_gateway_request_timeout_seconds,
    ) as response:
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if "text/event-stream" not in content_type:
            data = response.read()
            payload = json.loads(data.decode("utf-8"))
            text = _extract_gateway_text(payload if isinstance(payload, dict) else {})
            if text:
                yield text
            return

        for line in response.iter_lines():
            if not line:
                continue
            if line.startswith("data:"):
                data = line[5:].strip()
            else:
                continue
            if data == "[DONE]":
                break
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                continue
            choices = payload.get("choices")
            if isinstance(choices, list) and choices:
                delta = choices[0].get("delta") if isinstance(choices[0], dict) else None
                if isinstance(delta, dict) and isinstance(delta.get("content"), str):
                    yield delta["content"]
                    continue
                text = choices[0].get("text") if isinstance(choices[0], dict) else None
                if isinstance(text, str):
                    yield text
                    continue
            if isinstance(payload.get("text"), str):
                yield payload["text"]

def _format_sse(event: str, payload: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _page_fallback(path: str) -> AIPageInsightResponse:
    page = get_page_context(path)
    return AIPageInsightResponse(
        title=str(page["title"]),
        summary=str(page["summary"]),
        bullets=[str(item) for item in page["bullets"]],
        cta_label=str(page["cta_label"]),
        cta_href=str(page["cta_href"]),
        source="fallback",
    )


def _get_last_user_message(request: AIChatRequest) -> str:
    return next(
        (message.content for message in reversed(request.messages) if message.role == "user"),
        "",
    )


def _chat_fallback(request: AIChatRequest) -> AIChatResponse:
    page = get_page_context(request.page_path)
    return AIChatResponse(
        answer=(
            "L'assistant IA est indisponible pour le moment : la configuration IA du backend production "
            "n'est pas active. Ce message n'est pas une réponse automatique au dossier ; il signale "
            "un problème technique à corriger côté serveur."
        ),
        suggested_actions=[
            "Réessayer plus tard",
            str(page["cta_label"]),
            "Contacter PieAgency",
        ],
        escalation_recommended=True,
        source="fallback",
    )


def _community_reply_fallback(request: CommunityAIReplyRequest) -> CommunityAIReplyResponse:
    message = request.message.lower()
    if "comment" in message and "marche" in message:
        reply = (
            "PieAgency commence par comprendre votre profil, votre projet d'etudes et votre destination, "
            "puis l'equipe vous oriente vers l'accompagnement adapte pour le dossier, les lettres, le visa "
            "ou la preparation de l'entretien. Le plus simple maintenant est de passer par le formulaire "
            "ou le formulaire de contact sur pieagency.fr/contact pour qu'on analyse votre situation concretement."
        )
    elif "visa" in message:
        reply = (
            "Pour le visa, PieAgency aide surtout a structurer les pieces, les lettres et les justificatifs "
            "avant le depot. Si vous voulez, laissez-nous votre situation exacte ici ou passez par le "
            "formulaire afin qu'on vous dise quoi renforcer en priorite."
        )
    else:
        reply = (
            "On peut vous aider a clarifier le processus, choisir le bon accompagnement et avancer avec une "
            "vraie methode. Si vous voulez un retour precis sur votre cas, le plus efficace est de nous ecrire "
            "de remplir le formulaire de contact sur pieagency.fr/contact pour qu'on vous oriente rapidement."
        )

    return CommunityAIReplyResponse(reply=reply, source="fallback")


def should_generate_community_reply(
    message: str,
    thread_context: list[str] | None = None,
) -> tuple[bool, str]:
    normalized = " ".join((message or "").strip().lower().split())
    if not normalized:
        return False, "empty"

    if len(normalized) < 8 and "?" not in normalized:
        return False, "too_short"

    low_signal_messages = {
        "merci",
        "merci beaucoup",
        "top",
        "super",
        "ok",
        "d'accord",
        "cool",
        "parfait",
        "bravo",
    }
    if normalized in low_signal_messages:
        return False, "low_signal"

    if normalized.replace("!", "").replace(".", "") in {"bonjour", "salut", "hello", "cc"}:
        return False, "greeting_only"

    trigger_keywords = (
        "comment",
        "campus france",
        "visa",
        "belgique",
        "parcoursup",
        "paris-saclay",
        "ecoles privees",
        "écoles privées",
        "ecoles privées",
        "prix",
        "tarif",
        "coût",
        "cout",
        "dossier",
        "lettre",
        "entretien",
        "accompagnement",
        "aide",
        "formulaire",
        "contact",
        "chat",
        "orientation",
        "procedure",
        "procédure",
        "logement",
        "comment ça marche",
        "comment ca marche",
        "commencer",
    )

    if "?" in normalized:
        return True, "question_mark"

    if any(keyword in normalized for keyword in trigger_keywords):
        return True, "keyword_match"

    recent_context = " ".join((thread_context or [])[-2:]).lower()
    if recent_context and any(keyword in recent_context for keyword in trigger_keywords):
        return True, "thread_context_match"

    return False, "no_actionable_intent"


def _prepare_conversation(
    request: AIChatRequest,
    current_user: AuthUserProfile | None,
    access_token: str | None,
) -> str | None:
    last_user_message = _get_last_user_message(request)
    if not last_user_message:
        return request.conversation_id

    try:
        conversation_id = ensure_chat_conversation(
            page_path=request.page_path,
            first_user_message=last_user_message,
            conversation_id=request.conversation_id,
            current_user=current_user,
            access_token=access_token,
        )
    except Exception as exc:
        logger.warning("Chat persistence unavailable: %s", exc)
        return request.conversation_id

    try:
        store_chat_message(
            conversation_id=conversation_id,
            sender_role="user",
            body=last_user_message,
            current_user=current_user,
            metadata={"page_path": request.page_path},
            access_token=access_token,
        )
    except Exception as exc:
        logger.warning("Chat persistence unavailable: %s", exc)
    return conversation_id


def _build_chat_context(request: AIChatRequest) -> tuple[dict[str, str | list[str]], list[dict[str, str]]]:
    page = get_page_context(request.page_path)
    history = [
        {"role": message.role, "content": message.content}
        for message in request.messages[-8:]
    ]
    return page, history


PUBLIC_CHAT_PRIVATE_PATTERNS = (
    "mon dossier", "ma candidature", "mes documents", "mon document", "ma lettre",
    "mon cv", "mon projet d'études", "mon projet professionnel", "mon entretien",
    "mon visa", "mon compte campus france", "je suis bloqué", "je suis bloque",
    "que dois-je faire maintenant", "que dois je faire maintenant", "analyse ma",
    "analyse mon", "corrige ma", "corrige mon", "prépare mon", "prepare mon",
    "est-ce que mon", "est ce que mon", "dans mon cas", "pour mon cas",
)

PUBLIC_CHAT_ALLOWED_PATTERNS = (
    "pieagency", "service", "services", "offre", "offres", "prix", "tarif", "tarifs",
    "accompagnement", "comment ça marche", "comment ca marche", "contact", "rendez-vous",
    "rendez vous", "rdv", "paiement", "abonnement", "produit", "produits", "ressource",
    "ressources", "communauté", "communaute", "qui êtes-vous", "qui etes-vous",
    "que faites-vous", "que faites vous", "où êtes-vous", "ou etes-vous",
)


def _public_chat_requires_private_space(request: AIChatRequest) -> bool:
    message = _get_last_user_message(request).casefold().strip()
    return bool(message) and any(pattern in message for pattern in PUBLIC_CHAT_PRIVATE_PATTERNS)


def _public_chat_redirect_response(request: AIChatRequest, conversation_id: str | None = None) -> AIChatResponse:
    return AIChatResponse(
        answer=(
            "Pour une analyse personnalisée de votre dossier, de vos documents ou de votre procédure, "
            "utilisez votre espace étudiant PieAgency et Assistant.genie. Le chatbot du site public est limité "
            "aux informations sur PieAgency, ses services, ses offres et son fonctionnement."
        ),
        conversation_id=conversation_id,
        suggested_actions=["Ouvrir mon espace étudiant", "Voir les services", "Parler a un conseiller"],
        escalation_recommended=False,
        source="fallback",
    )


def _public_chat_marketing_scope_hint(request: AIChatRequest) -> str:
    message = _get_last_user_message(request).casefold().strip()
    if any(pattern in message for pattern in PUBLIC_CHAT_ALLOWED_PATTERNS):
        return "Question compatible avec le périmètre marketing et renseignements PieAgency."
    return (
        "Si la question sort des renseignements généraux sur PieAgency ou demande une réponse personnalisée "
        "sur une procédure étudiante, redirige immédiatement vers l'espace privé sans répondre au fond."
    )


def _build_json_chat_system_prompt(request: AIChatRequest) -> str:
    page, _ = _build_chat_context(request)
    scope_hint = _public_chat_marketing_scope_hint(request)
    return f"""
Tu es le chatbot PUBLIC de PieAgency sur le site web.

Contexte global marketing PieAgency:
{SITE_KNOWLEDGE}

Contexte page:
- Path: {request.page_path}
- Page: {page["title"]}
- Resume: {page["summary"]}

Périmètre strict:
- renseigner sur PieAgency, ses services, ses offres, ses produits, ses ressources, ses modalités de contact, de rendez-vous et de paiement;
- expliquer à haut niveau comment fonctionne l'accompagnement PieAgency;
- NE PAS analyser un dossier, une lettre, un CV ou un document personnel;
- NE PAS donner de stratégie personnalisée Campus France, visa, admission, entretien ou procédure;
- NE PAS exploiter de mémoire étudiant, profil privé, documents privés ou RAG communautaire;
- pour toute demande personnalisée, rediriger vers l'espace étudiant PieAgency et Assistant.genie.

Signal de périmètre:
{scope_hint}

Retourne uniquement un JSON valide:
{{
  "answer": "string",
  "suggested_actions": ["string", "string"],
  "escalation_recommended": true
}}

Contraintes:
- réponse en français;
- concise, commerciale et informative;
- maximum 180 mots;
- ne jamais inventer de prix, garantie, délai officiel ou résultat;
- suggested_actions: 2 ou 3 actions concrètes liées à PieAgency;
- si l'utilisateur demande un conseil personnalisé, ne réponds pas au fond et oriente vers l'espace privé.
""".strip()

def _build_stream_chat_system_prompt(request: AIChatRequest) -> str:
    page, _ = _build_chat_context(request)
    scope_hint = _public_chat_marketing_scope_hint(request)
    return f"""
Tu es le chatbot PUBLIC de PieAgency sur le site web.

Contexte global marketing PieAgency:
{SITE_KNOWLEDGE}

Contexte page:
- Path: {request.page_path}
- Page: {page["title"]}
- Resume: {page["summary"]}

Périmètre strict:
- renseigner uniquement sur PieAgency, ses services, offres, produits, ressources, contact, rendez-vous et paiement;
- expliquer le fonctionnement de l'accompagnement à haut niveau;
- ne jamais analyser un dossier ou document personnel;
- ne jamais donner une stratégie personnalisée de procédure, visa, admission ou entretien;
- ne jamais utiliser de contexte privé ou RAG communautaire;
- toute demande personnalisée doit être redirigée vers l'espace étudiant et Assistant.genie.

Signal de périmètre:
{scope_hint}

Contraintes:
- réponse en français;
- concise, marketing et informative;
- maximum 180 mots;
- pas de markdown ni URL brute;
- ne jamais inventer prix, garantie, délai officiel ou résultat.
""".strip()

def _extract_stream_delta_text(event: Any) -> str:
    if getattr(event, "type", None) != "content-delta":
        return ""

    delta = getattr(event, "delta", None)
    if delta is None:
        return ""

    message = getattr(delta, "message", None)
    if message is None:
        return ""

    content = getattr(message, "content", None)
    if content is None:
        return ""

    return getattr(content, "text", "") or ""


def _iter_text_chunks(text: str, size: int = 8) -> Iterator[str]:
    for index in range(0, len(text), size):
        yield text[index : index + size]


def generate_page_insight(path: str) -> AIPageInsightResponse:
    fallback = _page_fallback(path)
    if not settings.ai_gateway_enabled:
        return fallback

    page = get_page_context(path)
    system_prompt = f"""
Tu travailles pour PieAgency. Tu rediges un bloc web "Assistant IA" pour une page du site.

Contexte global:
{SITE_KNOWLEDGE}

Contraintes permanentes:
- Langue: francais.
- Ton: premium, clair, concret, rassurant.
- Resume court, utile, sans promesse d'admission ni de visa.
- Exactement 3 bullets.
- Conserver le CTA si possible.
- Retourner uniquement un objet JSON valide.
""".strip()

    user_prompt = f"""
Genere un JSON pour la page suivante:
- Path: {path}
- Titre: {page["title"]}
- Resume: {page["summary"]}
- Priorites: {", ".join(page["bullets"])}
- CTA prefere: {page["cta_label"]} -> {page["cta_href"]}

Structure JSON attendue:
{{
  "title": "string",
  "summary": "string",
  "bullets": ["string", "string", "string"],
  "cta_label": "string",
  "cta_href": "string"
}}
""".strip()

    try:
        payload = _gateway_chat_json(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        )
        return AIPageInsightResponse(
            title=str(payload["title"]),
            summary=str(payload["summary"]),
            bullets=[str(item) for item in payload["bullets"]][:3],
            cta_label=str(payload["cta_label"]),
            cta_href=str(payload["cta_href"]),
            source="ai_gateway",
        )
    except Exception:
        logger.exception("Unable to generate AI Gateway page insight")
        return fallback


def generate_community_reply(request: CommunityAIReplyRequest) -> CommunityAIReplyResponse:
    fallback = _community_reply_fallback(request)
    if not settings.ai_gateway_enabled:
        return fallback

    context_lines = request.thread_context[:4]
    thread_context = "\n".join(f"- {item}" for item in context_lines) or "- Aucun contexte supplementaire"

    system_prompt = f"""
Tu es Guide PieHUB, le profil officiel de la communaute PieAgency.

Contexte global:
{SITE_KNOWLEDGE}

Ta mission:
- repondre comme un profil officiel utile, humain et clair dans une discussion communautaire;
- expliquer concretement comment PieAgency aide;
- detecter le sujet principal: Campus France, visa, logement, Belgique, documents, entretien ou orientation;
- proposer une prochaine action concrete et prudente;
- mentionner une ressource ou une verification utile quand c'est pertinent;
- orienter vers le formulaire PieAgency quand la situation demande un accompagnement personnalise;
- ne jamais inventer de prix, delais officiels, garanties ou promesses d'admission.

Retourne uniquement un JSON valide: {{"reply": "string"}}
Contraintes: francais, naturel, 60 a 130 mots, pas de listes longues.
""".strip()

    user_prompt = f"""
Message utilisateur:
{request.message}

Contexte de discussion:
{thread_context}
""".strip()

    try:
        payload = _gateway_chat_json(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        )
        return CommunityAIReplyResponse(reply=str(payload["reply"]).strip(), source="ai_gateway")
    except Exception:
        logger.exception("Unable to generate AI Gateway community reply")
        return fallback


def generate_chat_response(
    request: AIChatRequest,
    current_user: AuthUserProfile | None = None,
    access_token: str | None = None,
) -> AIChatResponse:
    fallback = _chat_fallback(request)
    # The public site chatbot must never consume private student context.
    current_user = None
    access_token = None
    conversation_id = _prepare_conversation(request, None, None)
    if _public_chat_requires_private_space(request):
        return _public_chat_redirect_response(request, conversation_id)
    if not settings.ai_gateway_enabled:
        fallback.conversation_id = conversation_id
        return fallback

    _, history = _build_chat_context(request)

    try:
        payload = _gateway_chat_json(
            [
                {"role": "system", "content": _build_json_chat_system_prompt(request)},
                *history,
            ]
        )
        response = AIChatResponse(
            answer=str(payload["answer"]),
            conversation_id=conversation_id,
            suggested_actions=[str(item) for item in payload.get("suggested_actions", [])][:3],
            escalation_recommended=bool(payload.get("escalation_recommended", False)),
            source="ai_gateway",
        )
        try:
            store_chat_message(
                conversation_id=conversation_id,
                sender_role="assistant",
                body=response.answer,
                current_user=current_user,
                model_source=response.source,
                metadata={"page_path": request.page_path},
                access_token=access_token,
            )
        except Exception as exc:
            logger.warning("Chat persistence unavailable: %s", exc)
        return response
    except Exception:
        logger.exception("Unable to generate AI Gateway chat response")
        fallback.conversation_id = conversation_id
        return fallback


def stream_chat_response(
    request: AIChatRequest,
    current_user: AuthUserProfile | None = None,
    access_token: str | None = None,
) -> Iterator[str]:
    fallback = _chat_fallback(request)
    # The public site chatbot must never consume private student context.
    current_user = None
    access_token = None
    conversation_id = _prepare_conversation(request, None, None)
    if _public_chat_requires_private_space(request):
        redirect = _public_chat_redirect_response(request, conversation_id)
        yield _format_sse("start", {"source": "fallback", "conversation_id": conversation_id})
        for chunk in _iter_text_chunks(redirect.answer, size=10):
            yield _format_sse("chunk", {"text": chunk})
        yield _format_sse("done", {
            "conversation_id": conversation_id,
            "suggested_actions": redirect.suggested_actions,
            "escalation_recommended": False,
            "source": "fallback",
        })
        return
    fallback_done_payload = {
        "conversation_id": conversation_id,
        "suggested_actions": fallback.suggested_actions,
        "escalation_recommended": fallback.escalation_recommended,
        "source": fallback.source,
    }

    if not settings.ai_gateway_enabled:
        yield _format_sse("start", {"source": "fallback", "conversation_id": conversation_id})
        for chunk in _iter_text_chunks(fallback.answer, size=8):
            yield _format_sse("chunk", {"text": chunk})
        yield _format_sse("done", fallback_done_payload)
        return

    _, history = _build_chat_context(request)
    try:
        chunks: list[str] = []
        yield _format_sse("start", {"source": "ai_gateway", "conversation_id": conversation_id})
        for text in _gateway_chat_stream(
            [
                {"role": "system", "content": _build_stream_chat_system_prompt(request)},
                *history,
            ]
        ):
            if not text:
                continue
            chunks.append(text)
            yield _format_sse("chunk", {"text": text})

        assistant_answer = "".join(chunks).strip()
        if not assistant_answer:
            raise RuntimeError("Empty AI Gateway stream")
        try:
            store_chat_message(
                conversation_id=conversation_id,
                sender_role="assistant",
                body=assistant_answer,
                current_user=current_user,
                model_source="ai_gateway",
                metadata={"page_path": request.page_path},
                access_token=access_token,
            )
        except Exception as exc:
            logger.warning("Chat persistence unavailable: %s", exc)
        yield _format_sse(
            "done",
            {
                "conversation_id": conversation_id,
                "suggested_actions": ["Commencer mon dossier", "Voir les services", "Parler a un conseiller"],
                "escalation_recommended": False,
                "source": "ai_gateway",
            },
        )
    except Exception:
        logger.exception("Unable to stream AI Gateway chat response")
        yield _format_sse("start", {"source": "fallback", "conversation_id": conversation_id})
        for chunk in _iter_text_chunks(fallback.answer, size=8):
            yield _format_sse("chunk", {"text": chunk})
        yield _format_sse("done", fallback_done_payload)
