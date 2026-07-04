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
    CandidateAssistantChatRequest,
    CandidateAssistantChatResponse,
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


def _build_json_chat_system_prompt(request: AIChatRequest) -> str:
    page, _ = _build_chat_context(request)
    last_user_message = _get_last_user_message(request)
    rag_context = retrieve_rag_context(last_user_message) if last_user_message else ""
    rag_section = f"\nContexte RAG (extraits reels de la communaute Campus France):\n{rag_context}\n" if rag_context else ""
    return f"""
Tu es l'assistant IA public de PieAgency sur le site web.

Contexte global:
{SITE_KNOWLEDGE}

Contexte page:
- Path: {request.page_path}
- Page: {page["title"]}
- Resume: {page["summary"]}
{rag_section}
Ta mission:
- repondre uniquement sur PieAgency, ses services, son fonctionnement, le parcours etudiant,
  et l'orientation vers le bon accompagnement;
- si un contexte RAG est fourni, l'utiliser pour donner une reponse plus precise et concrete;
- si la question demande une verification humaine, recommander un conseiller;
- ne jamais inventer de prix, delais officiels ou garanties.

Retourne uniquement un JSON valide:
{{
  "answer": "string",
  "suggested_actions": ["string", "string"],
  "escalation_recommended": true
}}

Contraintes:
- reponse en francais;
- concise mais utile;
- réponse courte et directe : 80 à 120 mots maximum;
- texte propre uniquement, sans markdown, sans **, sans listes markdown;
- ne pas afficher d'URL brute dans la reponse;
- suggested_actions: 2 ou 3 actions concretes;
- si l'utilisateur veut demarrer, mentionner le formulaire de contact (pieagency.fr/contact) ou la prise de rendez-vous.
""".strip()


def _build_stream_chat_system_prompt(request: AIChatRequest) -> str:
    page, _ = _build_chat_context(request)
    last_user_message = _get_last_user_message(request)
    rag_context = retrieve_rag_context(last_user_message) if last_user_message else ""
    rag_section = f"\nContexte RAG (extraits reels de la communaute Campus France):\n{rag_context}\n" if rag_context else ""
    return f"""
Tu es l'assistant IA public de PieAgency sur le site web.

Contexte global:
{SITE_KNOWLEDGE}

Contexte page:
- Path: {request.page_path}
- Page: {page["title"]}
- Resume: {page["summary"]}
{rag_section}
Ta mission:
- repondre uniquement sur PieAgency, ses services, son fonctionnement, le parcours etudiant,
  et l'orientation vers le bon accompagnement;
- si un contexte RAG est fourni, l'utiliser pour donner une reponse plus precise et concrete;
- si la question demande une verification humaine, recommander un conseiller;
- ne jamais inventer de prix, delais officiels ou garanties;
- ne pas utiliser de JSON, de balises ou de listes artificielles;
- renvoyer uniquement le texte final de la reponse en francais.

Contraintes:
- concise mais utile;
- réponse courte et directe : 80 à 120 mots maximum;
- texte propre uniquement, sans markdown, sans **, sans listes markdown;
- ne pas afficher d'URL brute dans la reponse;
- si l'utilisateur veut demarrer, mentionner le formulaire de contact (pieagency.fr/contact) ou la prise de rendez-vous.
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
- orienter intelligemment vers le formulaire de contact ou la communaute si pertinent;
- ne jamais inventer de prix, delais officiels, garanties ou promesses d'admission.

Retourne uniquement un JSON valide: {{"reply": "string"}}
Contraintes: francais, naturel, 50 a 120 mots, pas de listes.
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
    conversation_id = _prepare_conversation(request, current_user, access_token)
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
    conversation_id = _prepare_conversation(request, current_user, access_token)
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


def generate_candidate_assistant_response(
    request: CandidateAssistantChatRequest,
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> CandidateAssistantChatResponse:
    if not settings.ai_gateway_enabled:
        return CandidateAssistantChatResponse(
            answer=(
                "L'assistant dossier est indisponible pour le moment : l'AI Gateway du backend "
                "n'est pas configurée ou joignable."
            ),
            used_prompt="fallback_unconfigured_gateway",
            used_context={"candidate_profile": False, "progressive_path": False, "recommendations": False, "resources": False},
            rag={"used": False, "resources": []},
        )

    rag_context = retrieve_rag_context(request.message) if request.message else ""
    system_prompt = f"""
Tu es l'assistant dossier privé de PieAgency.
Tu aides un candidat connecté à comprendre sa procédure, structurer son dossier, ses motivations, son entretien, ses documents et son visa.
Tu réponds en français, de manière concrète, utile et directe.
Tu n'inventes pas de garantie d'admission ou de visa.
Tu peux proposer les ressources PieAgency pertinentes si utile.

Contexte global PieAgency:
{SITE_KNOWLEDGE}

Contexte RAG éventuel:
{rag_context or 'Aucun extrait RAG disponible.'}
""".strip()
    user_prompt = f"""
Utilisateur: {current_user.full_name or current_user.email or current_user.user_id}
Contexte source: {request.context_source or 'progressive_path'}
Etape actuelle: {request.current_step_id or 'non précisée'}
Question: {request.message}

Retourne une réponse claire et actionnable. Pas de JSON.
""".strip()

    try:
        answer = _gateway_chat_text(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        )
        return CandidateAssistantChatResponse(
            answer=answer,
            used_prompt="ai_gateway_candidate_assistant",
            used_context={"candidate_profile": True, "progressive_path": bool(request.current_step_id), "recommendations": True, "resources": bool(rag_context)},
            rag={"used": bool(rag_context), "resources": []},
        )
    except Exception:
        logger.exception("Unable to generate candidate assistant response through AI Gateway")
        return CandidateAssistantChatResponse(
            answer="L'assistant dossier est momentanément indisponible : l'AI Gateway n'a pas répondu correctement.",
            used_prompt="fallback_gateway_error",
            used_context={"candidate_profile": False, "progressive_path": False, "recommendations": False, "resources": False},
            rag={"used": False, "resources": []},
        )
