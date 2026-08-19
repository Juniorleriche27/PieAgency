from __future__ import annotations

import logging

import httpx

from ..config import settings
from ..schemas import AuthUserProfile, CandidateAssistantChatRequest, CandidateAssistantChatResponse
from .assistant_context_service import build_assistant_context_snapshot
from .sso_service import SSOServiceError, issue_authorization_code

logger = logging.getLogger(__name__)


class AssistantBridgeError(RuntimeError):
    pass


def _assistant_chat_url() -> str:
    return f"{settings.assistant_api_origin}/api/v1/integrations/pieagency/chat"


def generate_candidate_assistant_response(
    request: CandidateAssistantChatRequest,
    current_user: AuthUserProfile,
    access_token: str | None,
) -> CandidateAssistantChatResponse:
    try:
        authorization_code = issue_authorization_code(
            client_id=settings.assistant_sso_client_id,
            redirect_uri=settings.assistant_sso_redirect_uri,
            user=current_user,
        )
    except SSOServiceError as exc:
        raise AssistantBridgeError("Impossible d'autoriser Assistant pour ce compte PieAgency.") from exc

    context = build_assistant_context_snapshot(request, current_user, access_token)
    payload: dict[str, object] = {
        "authorization_code": authorization_code,
        "message": request.message,
        "context": context.model_dump(mode="json", exclude_none=True),
    }
    if request.conversation_id:
        payload["conversation_id"] = request.conversation_id

    try:
        with httpx.Client(timeout=settings.assistant_api_timeout_seconds) as client:
            response = client.post(_assistant_chat_url(), json=payload)
    except httpx.HTTPError as exc:
        raise AssistantBridgeError("Assistant PieAgency est momentanément indisponible.") from exc

    if response.status_code != 200:
        logger.warning("Assistant bridge rejected request with status %s", response.status_code)
        raise AssistantBridgeError("Assistant PieAgency n'a pas pu traiter cette demande.")

    try:
        assistant_payload = response.json()
        answer = str(assistant_payload["content"]).strip()
        conversation_id = str(assistant_payload["conversation_id"]).strip()
    except (KeyError, TypeError, ValueError) as exc:
        raise AssistantBridgeError("Réponse Assistant invalide.") from exc

    citations = assistant_payload.get("citations") or []
    resources = [
        {
            "title": str(item.get("title") or item.get("source_title") or "Source utile"),
            "type": "source",
            "access": "free",
            "target_path": item.get("url") or item.get("source_url"),
            "summary": item.get("excerpt") or item.get("text"),
        }
        for item in citations
        if isinstance(item, dict) and (item.get("url") or item.get("source_url"))
    ]

    return CandidateAssistantChatResponse(
        answer=answer,
        conversation_id=conversation_id,
        used_prompt="assistant_pieagency",
        used_context={
            "candidate_profile": True,
            "progressive_path": context.current_step is not None,
            "recommendations": False,
            "resources": bool(resources),
        },
        rag={"used": bool(citations), "resources": resources},
    )
