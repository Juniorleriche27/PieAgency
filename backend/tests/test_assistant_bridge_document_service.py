from unittest.mock import patch

from backend.app.schemas import (
    AssistantContextSnapshotV1,
    AssistantContextStudentV1,
    AuthUserProfile,
    CandidateAssistantChatRequest,
)
from backend.app.services.assistant_bridge_service import generate_candidate_assistant_response


class _Response:
    status_code = 200

    @staticmethod
    def json():
        return {
            "content": "Analyse du document",
            "conversation_id": "conv-doc",
            "citations": [],
        }


class _Client:
    last_url = None
    last_data = None
    last_files = None

    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def post(self, url, **kwargs):
        _Client.last_url = url
        _Client.last_data = kwargs.get("data")
        _Client.last_files = kwargs.get("files")
        return _Response()


def test_document_review_forwards_owned_file_transiently_to_assistant():
    request = CandidateAssistantChatRequest(
        message="Analyse mon CV",
        requested_action="document_review",
        document_id="doc-1",
        conversation_id="conv-doc",
    )
    user = AuthUserProfile(user_id="user-1", email="user@example.com", is_active=True)
    context = AssistantContextSnapshotV1(
        generated_at="2026-08-19T14:00:00+00:00",
        requested_action="document_review",
        student=AssistantContextStudentV1(country="Togo"),
        retrieval_hints=["CV"],
    )

    with patch(
        "backend.app.services.assistant_bridge_service.issue_authorization_code",
        return_value="one-time-code",
    ), patch(
        "backend.app.services.assistant_bridge_service.build_assistant_context_snapshot",
        return_value=context,
    ), patch(
        "backend.app.services.assistant_bridge_service._fetch_owned_document_for_analysis",
        return_value=("cv.pdf", "application/pdf", b"%PDF-content"),
    ), patch(
        "backend.app.services.assistant_bridge_service.httpx.Client",
        _Client,
    ):
        result = generate_candidate_assistant_response(request, user, "access-token")

    assert result.answer == "Analyse du document"
    assert _Client.last_url.endswith("/api/v1/integrations/pieagency/documents/analyze")
    assert _Client.last_data["document_id"] == "doc-1"
    assert _Client.last_data["conversation_id"] == "conv-doc"
    assert _Client.last_files["file"][0] == "cv.pdf"
    assert _Client.last_files["file"][1] == b"%PDF-content"
