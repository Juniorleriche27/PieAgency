from unittest.mock import patch

from backend.app.schemas import (
    AssistantContextDiagnosticV1,
    AssistantContextDocumentSummaryV1,
    AssistantContextDossierV1,
    AssistantContextSnapshotV1,
    AssistantContextStepV1,
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
            "content": "Réponse du moteur Assistant",
            "conversation_id": "conv-42",
            "citations": [
                {"source_title": "Campus France", "source_url": "https://example.test/source"}
            ],
        }


class _Client:
    last_payload = None

    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def post(self, *args, **kwargs):
        _Client.last_payload = kwargs.get("json")
        return _Response()


def test_private_candidate_assistant_uses_unified_engine_with_versioned_context():
    request = CandidateAssistantChatRequest(
        message="Comment créer mon compte ?",
        requested_action="assist_current_step",
    )
    user = AuthUserProfile(user_id="user-1", email="user@example.com", is_active=True)
    context = AssistantContextSnapshotV1(
        generated_at="2026-08-19T13:20:00+00:00",
        requested_action="assist_current_step",
        page_path="/espace-etudiant",
        student=AssistantContextStudentV1(country="Togo", project_name="Campus France"),
        current_step=AssistantContextStepV1(
            id="prepare-cv",
            title="Préparer mon CV",
            order=7,
            status="in_progress",
            objective="Préparer un CV exploitable.",
            next_action="Déposer le CV.",
            blocking_reasons=["CV déposé et approuvé"],
        ),
        dossier=AssistantContextDossierV1(
            project_name="Campus France",
            document_summaries=[
                AssistantContextDocumentSummaryV1(
                    document_id="doc-cv",
                    name="CV",
                    status="review",
                    note="En contrôle",
                )
            ],
        ),
        diagnostic=AssistantContextDiagnosticV1(
            current_priority="Finaliser le CV",
            main_risk="CV non encore validé",
            next_action="Attendre ou corriger le CV.",
        ),
        retrieval_hints=["Créer un compte Campus France"],
    )

    with patch(
        "backend.app.services.assistant_bridge_service.issue_authorization_code",
        return_value="one-time-code",
    ), patch(
        "backend.app.services.assistant_bridge_service.build_assistant_context_snapshot",
        return_value=context,
    ), patch(
        "backend.app.services.assistant_bridge_service.httpx.Client",
        _Client,
    ):
        result = generate_candidate_assistant_response(request, user, "access-token")

    assert result.answer == "Réponse du moteur Assistant"
    assert result.conversation_id == "conv-42"
    assert result.used_prompt == "assistant_pieagency"
    assert result.rag["used"] is True
    assert result.used_context["progressive_path"] is True
    assert result.used_context["recommendations"] is True
    assert result.used_context["documents"] is True
    assert result.used_context["diagnostic"] is True
    assert _Client.last_payload["context"]["contract_version"] == "pieagency.context.v1"
    assert _Client.last_payload["context"]["requested_action"] == "assist_current_step"
    assert _Client.last_payload["context"]["page_path"] == "/espace-etudiant"
    assert _Client.last_payload["context"]["current_step"]["blocking_reasons"] == ["CV déposé et approuvé"]
    assert _Client.last_payload["context"]["dossier"]["document_summaries"][0]["status"] == "review"
    assert _Client.last_payload["context"]["retrieval_hints"] == ["Créer un compte Campus France"]
