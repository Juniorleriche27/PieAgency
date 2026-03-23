import json
import logging
from collections.abc import Iterator
from functools import lru_cache
from typing import Any

import cohere

from ..config import settings
from ..knowledge_base import SITE_KNOWLEDGE, get_page_context
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
    last_user_message = _get_last_user_message(request)
    answer = (
        "Je peux vous aider a comprendre les accompagnements PieAgency, "
        "les etapes Campus France, la procedure visa, la Belgique, "
        "Parcoursup, Paris-Saclay ou les ecoles privees. "
        "Pour votre demande actuelle, le plus efficace est de parler avec un conseiller "
        "si vous voulez une analyse personnalisee de votre dossier."
    )
    if "visa" in last_user_message.lower():
        answer = (
            "PieAgency peut vous aider a structurer le dossier visa, "
            "notamment les lettres, l'hebergement et les justificatifs financiers. "
            "Le depot final reste toutefois effectue par l'etudiant."
        )
    return AIChatResponse(
        answer=answer,
        suggested_actions=[
            str(page["cta_label"]),
            "Ouvrir WhatsApp Togo",
            "Remplir le formulaire de contact",
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
            "ou WhatsApp pour qu'on analyse votre situation concretement."
        )
    elif "visa" in message:
        reply = (
            "Pour le visa, PieAgency aide surtout a structurer les pieces, les lettres et les justificatifs "
            "avant le depot. Si vous voulez, laissez-nous votre situation exacte ici ou contactez-nous sur "
            "WhatsApp afin qu'on vous dise quoi renforcer en priorite."
        )
    else:
        reply = (
            "On peut vous aider a clarifier le processus, choisir le bon accompagnement et avancer avec une "
            "vraie methode. Si vous voulez un retour precis sur votre cas, le plus efficace est de nous ecrire "
            "sur WhatsApp ou de remplir le formulaire de contact pour qu'on vous oriente rapidement."
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
        "whatsapp",
        "contact",
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
    return f"""
Tu es l'assistant IA public de PieAgency sur le site web.

Contexte global:
{SITE_KNOWLEDGE}

Contexte page:
- Path: {request.page_path}
- Page: {page["title"]}
- Resume: {page["summary"]}

Ta mission:
- repondre uniquement sur PieAgency, ses services, son fonctionnement, le parcours etudiant,
  et l'orientation vers le bon accompagnement;
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
- maximum 220 mots;
- suggested_actions: 2 ou 3 actions concretes;
- si l'utilisateur veut demarrer, mentionner le formulaire ou WhatsApp.
""".strip()


def _build_stream_chat_system_prompt(request: AIChatRequest) -> str:
    page, _ = _build_chat_context(request)
    return f"""
Tu es l'assistant IA public de PieAgency sur le site web.

Contexte global:
{SITE_KNOWLEDGE}

Contexte page:
- Path: {request.page_path}
- Page: {page["title"]}
- Resume: {page["summary"]}

Ta mission:
- repondre uniquement sur PieAgency, ses services, son fonctionnement, le parcours etudiant,
  et l'orientation vers le bon accompagnement;
- si la question demande une verification humaine, recommander un conseiller;
- ne jamais inventer de prix, delais officiels ou garanties;
- ne pas utiliser de JSON, de balises ou de listes artificielles;
- renvoyer uniquement le texte final de la reponse en francais.

Contraintes:
- concise mais utile;
- maximum 220 mots;
- si l'utilisateur veut demarrer, mentionner le formulaire ou WhatsApp.
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
    client = _get_cohere_client()
    if client is None:
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
        payload = _chat_json(
            client,
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return AIPageInsightResponse(
            title=str(payload["title"]),
            summary=str(payload["summary"]),
            bullets=[str(item) for item in payload["bullets"]][:3],
            cta_label=str(payload["cta_label"]),
            cta_href=str(payload["cta_href"]),
            source="cohere",
        )
    except Exception:
        logger.exception("Unable to generate Cohere page insight")
        return fallback


def generate_community_reply(request: CommunityAIReplyRequest) -> CommunityAIReplyResponse:
    fallback = _community_reply_fallback(request)
    client = _get_cohere_client()
    if client is None:
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
- orienter intelligemment vers le formulaire, WhatsApp, le contact direct ou la communaute si pertinent;
- ne jamais inventer de prix, delais officiels, garanties ou promesses d'admission.

Retourne uniquement un JSON valide:
{{
  "reply": "string"
}}

Contraintes:
- reponse en francais;
- ton naturel, pas robotique;
- 50 a 120 mots maximum;
- pas de listes a puces;
- si l'utilisateur demande "comment ca marche", explique le diagnostic, l'orientation et la suite concrete;
- termine idealement par une orientation simple vers l'action.
""".strip()

    user_prompt = f"""
Message utilisateur:
{request.message}

Contexte de discussion:
{thread_context}
""".strip()

    try:
        payload = _chat_json(
            client,
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return CommunityAIReplyResponse(
            reply=str(payload["reply"]).strip(),
            source="cohere",
        )
    except Exception:
        logger.exception("Unable to generate Cohere community reply")
        return fallback


def generate_chat_response(
    request: AIChatRequest,
    current_user: AuthUserProfile | None = None,
    access_token: str | None = None,
) -> AIChatResponse:
    fallback = _chat_fallback(request)
    conversation_id = _prepare_conversation(request, current_user, access_token)
    client = _get_cohere_client()
    if client is None:
        try:
            store_chat_message(
                conversation_id=conversation_id,
                sender_role="assistant",
                body=fallback.answer,
                current_user=current_user,
                model_source=fallback.source,
                metadata={"page_path": request.page_path},
                access_token=access_token,
            )
        except Exception:
            logger.warning("Unable to persist fallback assistant response")
        fallback.conversation_id = conversation_id
        return fallback

    _, history = _build_chat_context(request)

    try:
        payload = _chat_json(
            client,
            [
                {"role": "system", "content": _build_json_chat_system_prompt(request)},
                *history,
            ],
        )
        response = AIChatResponse(
            answer=str(payload["answer"]),
            conversation_id=conversation_id,
            suggested_actions=[str(item) for item in payload["suggested_actions"]][:3],
            escalation_recommended=bool(payload["escalation_recommended"]),
            source="cohere",
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
        logger.exception("Unable to generate Cohere chat response")
        try:
            store_chat_message(
                conversation_id=conversation_id,
                sender_role="assistant",
                body=fallback.answer,
                current_user=current_user,
                model_source=fallback.source,
                metadata={"page_path": request.page_path},
                access_token=access_token,
            )
        except Exception:
            logger.warning("Unable to persist fallback assistant response")
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

    client = _get_cohere_client()
    if client is None:
        yield _format_sse("start", {"source": "fallback", "conversation_id": conversation_id})
        for chunk in _iter_text_chunks(fallback.answer, size=1):
            yield _format_sse("chunk", {"text": chunk})
        try:
            store_chat_message(
                conversation_id=conversation_id,
                sender_role="assistant",
                body=fallback.answer,
                current_user=current_user,
                model_source=fallback.source,
                metadata={"page_path": request.page_path},
                access_token=access_token,
            )
        except Exception:
            logger.warning("Unable to persist fallback assistant stream")
        yield _format_sse("done", fallback_done_payload)
        return

    _, history = _build_chat_context(request)

    try:
        yielded_content = False
        chunks: list[str] = []
        yield _format_sse("start", {"source": "cohere", "conversation_id": conversation_id})

        response = client.chat_stream(
            model=settings.cohere_model,
            messages=[
                {"role": "system", "content": _build_stream_chat_system_prompt(request)},
                *history,
            ],
        )

        for event in response:
            text = _extract_stream_delta_text(event)
            if not text:
                continue

            yielded_content = True
            # Track the full response so it can be stored once the stream ends.
            chunks.append(text)
            yield _format_sse("chunk", {"text": text})

        if not yielded_content:
            for chunk in _iter_text_chunks(fallback.answer, size=1):
                yield _format_sse("chunk", {"text": chunk})
            try:
                store_chat_message(
                    conversation_id=conversation_id,
                    sender_role="assistant",
                    body=fallback.answer,
                    current_user=current_user,
                    model_source=fallback.source,
                    metadata={"page_path": request.page_path},
                    access_token=access_token,
                )
            except Exception:
                logger.warning("Unable to persist empty Cohere fallback stream")
            yield _format_sse("done", fallback_done_payload)
            return

        assistant_answer = "".join(chunks).strip()
        try:
            store_chat_message(
                conversation_id=conversation_id,
                sender_role="assistant",
                body=assistant_answer,
                current_user=current_user,
                model_source="cohere",
                metadata={"page_path": request.page_path},
                access_token=access_token,
            )
        except Exception as exc:
            logger.warning("Chat persistence unavailable: %s", exc)
        yield _format_sse(
            "done",
            {
                "conversation_id": conversation_id,
                "suggested_actions": fallback.suggested_actions,
                "escalation_recommended": False,
                "source": "cohere",
            },
        )
    except Exception:
        logger.exception("Unable to stream Cohere chat response")
        yield _format_sse("start", {"source": "fallback", "conversation_id": conversation_id})
        for chunk in _iter_text_chunks(fallback.answer, size=1):
            yield _format_sse("chunk", {"text": chunk})
        try:
            store_chat_message(
                conversation_id=conversation_id,
                sender_role="assistant",
                body=fallback.answer,
                current_user=current_user,
                model_source=fallback.source,
                metadata={"page_path": request.page_path},
                access_token=access_token,
            )
        except Exception:
            logger.warning("Unable to persist fallback assistant stream after error")
        yield _format_sse("done", fallback_done_payload)
