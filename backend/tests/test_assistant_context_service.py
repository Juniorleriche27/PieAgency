from types import SimpleNamespace

from backend.app.schemas import AuthUserProfile, CandidateAssistantChatRequest
from backend.app.services.assistant_context_service import build_assistant_context_snapshot


def test_context_snapshot_uses_server_owned_path_and_rich_copilot_state(monkeypatch):
    requirement_ready = SimpleNamespace(
        key="study_project_ready",
        label="Projet d'études prêt",
        source="declared",
        required=True,
        satisfied=False,
    )
    current = SimpleNamespace(
        id="prepare-study-project",
        title="Préparer mon projet d'études",
        order=5,
        status=SimpleNamespace(value="in_progress"),
        short_description="Structurer le projet d'études.",
        objective="Construire un projet d'études cohérent.",
        next_action="Finaliser puis confirmer le projet d'études.",
        completion_rule="Le projet d'études doit être confirmé prêt.",
        can_complete=False,
        requirements=[requirement_ready],
        evidence=[],
        blocking_reasons=["Projet d'études prêt"],
    )
    following = SimpleNamespace(
        id="prepare-career-project",
        title="Définir mon projet professionnel",
        order=6,
        status=SimpleNamespace(value="not_started"),
        short_description="Relier formation et objectif professionnel.",
        objective="Définir un objectif professionnel crédible.",
        next_action="Préparer le projet professionnel.",
        completion_rule="Le projet professionnel doit être confirmé prêt.",
        can_complete=False,
        requirements=[],
        evidence=[],
        blocking_reasons=["Étape préalable non terminée : prepare-study-project"],
    )
    path = SimpleNamespace(
        progress_percent=40,
        current_step=current,
        steps=[current, following],
        official_deposit=SimpleNamespace(has_declared=False, status=None),
        recommendations=SimpleNamespace(
            recommended_product=SimpleNamespace(
                title="Générateur projet d'études",
                description="Un outil guidé pour structurer le projet.",
                target_path="/espace-etudiant/produits/prod-003",
                reason_now="Option facultative utile pour ce blocage.",
                expected_outcome="Projet d'études prêt",
                addresses_blockers=["Projet d'études prêt"],
            )
        ),
    )
    dashboard = SimpleNamespace(
        case_reference="PA-2026-42",
        project_name="Campus France",
        status_label="Dossier en préparation",
        next_action="Finaliser le projet d'études",
        documents=[
            SimpleNamespace(id="doc-cv", name="CV", status=SimpleNamespace(value="approved"), note="Validé"),
            SimpleNamespace(id="doc-letter", name="Lettre de motivation", status=SimpleNamespace(value="review"), note="En revue"),
        ],
    )
    diagnostic = SimpleNamespace(
        current_priority="Clarifier le projet d'études",
        main_risk="Motivations trop générales",
        next_action="Finaliser le projet d'études avant les lettres.",
        adapted_checklist=["Clarifier les motivations", "Valider le projet"],
    )
    monkeypatch.setattr(
        "backend.app.services.assistant_context_service.get_candidate_progressive_path",
        lambda *_: path,
    )
    monkeypatch.setattr(
        "backend.app.services.assistant_context_service.get_student_dashboard",
        lambda *_: dashboard,
    )
    monkeypatch.setattr(
        "backend.app.services.assistant_context_service.get_private_diagnostic",
        lambda *_: diagnostic,
    )

    snapshot = build_assistant_context_snapshot(
        CandidateAssistantChatRequest(
            message="Aide-moi",
            current_step_id="client-can-not-override-server-step",
            requested_action="assist_current_step",
            page_path="/espace-etudiant/documents",
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
    assert snapshot.page_path == "/espace-etudiant/documents"
    assert snapshot.student.full_name == "Junior Test"
    assert snapshot.student.country == "Togo"
    assert snapshot.current_step.id == "prepare-study-project"
    assert snapshot.current_step.id != "client-can-not-override-server-step"
    assert snapshot.current_step.progress_percent == 40
    assert snapshot.current_step.objective == "Construire un projet d'études cohérent."
    assert snapshot.current_step.next_action == "Finaliser puis confirmer le projet d'études."
    assert snapshot.current_step.can_complete is False
    assert snapshot.current_step.requirements[0].key == "study_project_ready"
    assert snapshot.current_step.blocking_reasons == ["Projet d'études prêt"]
    assert snapshot.next_step is not None
    assert snapshot.next_step.id == "prepare-career-project"
    assert snapshot.dossier.document_status_counts == {"approved": 1, "review": 1}
    assert snapshot.dossier.document_summaries[0].name == "CV"
    assert snapshot.diagnostic is not None
    assert snapshot.diagnostic.main_risk == "Motivations trop générales"
    assert snapshot.product_promotion is not None
    assert snapshot.product_promotion.title == "Générateur projet d'études"
    assert snapshot.product_promotion.optional is True
    assert snapshot.product_promotion.addresses_blockers == ["Projet d'études prêt"]
    assert "Préparer mon projet d'études" in snapshot.retrieval_hints
    assert any("Projet d'études prêt" in item for item in snapshot.retrieval_hints)
    assert snapshot.requested_action == "assist_current_step"
