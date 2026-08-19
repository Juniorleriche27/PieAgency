from types import SimpleNamespace

from backend.app.schemas import AuthUserProfile, CandidateAssistantChatRequest
from backend.app.services.assistant_context_service import build_assistant_context_snapshot


def test_context_snapshot_uses_server_owned_path_and_minimal_student_data(monkeypatch):
    path = SimpleNamespace(
        progress_percent=40,
        current_step=SimpleNamespace(
            id="prepare-project",
            title="Préparer mon projet d'études",
            order=4,
            status=SimpleNamespace(value="in_progress"),
            short_description="Structurer le projet d'études.",
        ),
        official_deposit=SimpleNamespace(
            has_declared=False,
            status=None,
        ),
    )
    dashboard = SimpleNamespace(
        case_reference="PA-2026-42",
        project_name="Campus France",
        status_label="Dossier en préparation",
        next_action="Finaliser le projet d'études",
        documents=[
            SimpleNamespace(status=SimpleNamespace(value="approved")),
            SimpleNamespace(status=SimpleNamespace(value="review")),
            SimpleNamespace(status=SimpleNamespace(value="review")),
        ],
    )
    monkeypatch.setattr(
        "backend.app.services.assistant_context_service.get_candidate_progressive_path",
        lambda *_: path,
    )
    monkeypatch.setattr(
        "backend.app.services.assistant_context_service.get_student_dashboard",
        lambda *_: dashboard,
    )

    snapshot = build_assistant_context_snapshot(
        CandidateAssistantChatRequest(
            message="Aide-moi",
            current_step_id="client-can-not-override-server-step",
            requested_action="assist_current_step",
        ),
        AuthUserProfile(
            user_id="user-1",
            email="student@example.com",
            full_name="Junior Test",
            country="Togo",
            is_active=True,
        ),
        "access-token",
    )

    assert snapshot.contract_version == "pieagency.context.v1"
    assert snapshot.student.full_name == "Junior Test"
    assert snapshot.student.country == "Togo"
    assert snapshot.current_step.id == "prepare-project"
    assert snapshot.current_step.id != "client-can-not-override-server-step"
    assert snapshot.current_step.progress_percent == 40
    assert snapshot.dossier.document_status_counts == {"approved": 1, "review": 2}
    assert "Préparer mon projet d'études" in snapshot.retrieval_hints
    assert snapshot.requested_action == "assist_current_step"
