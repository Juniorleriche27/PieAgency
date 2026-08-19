from __future__ import annotations

import json
import logging
from pathlib import Path
from urllib.parse import unquote, urlsplit

import httpx

from ..config import settings
from ..schemas import AuthUserProfile, CandidateAssistantChatRequest, CandidateAssistantChatResponse
from .assistant_context_service import build_assistant_context_snapshot
from .private_catalog_service import _client_or_none, _get_candidate_document, get_student_document_download_url
from .sso_service import SSOServiceError, issue_authorization_code

logger = logging.getLogger(__name__)


class AssistantBridgeError(RuntimeError):
    pass


def _assistant_chat_url() -> str:
    return f"{settings.assistant_api_origin}/api/v1/integrations/pieagency/chat"


def _assistant_document_analyze_url() -> str:
    return f"{settings.assistant_api_origin}/api/v1/integrations/pieagency/documents/analyze"


def _fetch_owned_document_for_analysis(
    *,
    user_id: str,
    document_id: str,
    access_token: str | None,
) -> tuple[str, str, bytes]:
    client = _client_or_none(access_token)
    if client is None:
        raise AssistantBridgeError("Stockage PieAgency indisponible.")
    document = _get_candidate_document(client, user_id, document_id)
    signed_url = get_student_document_download_url(user_id, document_id, access_token)
    try:
        with httpx.Client(timeout=20.0, follow_redirects=True) as fetch_client:
            response = fetch_client.get(signed_url)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise AssistantBridgeError("Impossible de lire ce document PieAgency pour analyse.") from exc

    content = response.content
    if not content or len(content) > 10 * 1024 * 1024:
        raise AssistantBridgeError("Document vide ou trop volumineux pour analyse.")

    filename = unquote(Path(urlsplit(signed_url).path).name) or document.name or "document"
    suffix = Path(filename).suffix.lower()
    content_type = (response.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
    if suffix == ".pdf":
        content_type = "application/pdf"
    elif suffix == ".docx":
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if content_type not in {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }:
        raise AssistantBridgeError("L’analyse Agent prend actuellement en charge les fichiers PDF et DOCX.")
    return filename, content_type, content


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
            if request.document_id:
                filename, content_type, content = _fetch_owned_document_for_analysis(
                    user_id=current_user.user_id,
                    document_id=request.document_id,
                    access_token=access_token,
                )
                form_data = {
                    "authorization_code": authorization_code,
                    "message": request.message,
                    "context_json": json.dumps(context.model_dump(mode="json", exclude_none=True), ensure_ascii=False),
                    "document_id": request.document_id,
                }
                if request.conversation_id:
                    form_data["conversation_id"] = request.conversation_id
                response = client.post(
                    _assistant_document_analyze_url(),
                    data=form_data,
                    files={"file": (filename, content, content_type)},
                )
            else:
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
