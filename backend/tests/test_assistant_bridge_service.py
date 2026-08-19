from unittest.mock import patch

from backend.app.schemas import AuthUserProfile, CandidateAssistantChatRequest
from backend.app.services.assistant_bridge_service import generate_candidate_assistant_response


class _Response:
    status_code = 200

    @staticmethod
    def json():
        return {
            "content": "Réponse du moteur Assistant",
            "conversation_id": "conv-42",
            "citations": [
                {"source_title": "Campus France", "source_url": "https://example.test/source"}
            ],
        }


class _Client:
    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def post(self, *args, **kwargs):
        return _Response()


def test_private_candidate_assistant_uses_assistant_bridge_only():
    request = CandidateAssistantChatRequest(message="Comment créer mon compte ?")
    user = AuthUserProfile(user_id="user-1", email="user@example.com", is_active=True)

    with patch(
        "backend.app.services.assistant_bridge_service.issue_authorization_code",
        return_value="one-time-code",
    ), patch(
        "backend.app.services.assistant_bridge_service.httpx.Client",
        _Client,
    ):
        result = generate_candidate_assistant_response(request, user)

    assert result.answer == "Réponse du moteur Assistant"
    assert result.conversation_id == "conv-42"
    assert result.used_prompt == "assistant_pieagency"
    assert result.rag["used"] is True
