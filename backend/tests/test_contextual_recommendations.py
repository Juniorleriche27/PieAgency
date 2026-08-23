from backend.app.schemas import (
    ProgressivePathRequirementItem,
    ProgressivePathStepItem,
    ProgressivePathStepStatus,
)
from backend.app.services.progressive_path_service import _build_recommendations


def _step(*, step_id: str, can_complete: bool, blockers: list[str]):
    return ProgressivePathStepItem(
        id=step_id,
        title="Étape test",
        order=5,
        status=ProgressivePathStepStatus.IN_PROGRESS,
        short_description="Description",
        is_current=True,
        is_locked=False,
        target_module="ressources",
        target_path="/espace-etudiant/ressources",
        objective="Atteindre l'objectif métier.",
        requirements=[
            ProgressivePathRequirementItem(
                key="requirement",
                label="Preuve attendue",
                source="declared",
                satisfied=can_complete,
            )
        ],
        evidence=[],
        blocking_reasons=blockers,
        completion_rule="La preuve doit être validée.",
        next_action="Faire l'action prioritaire.",
        can_complete=can_complete,
    )


def test_contextual_recommendation_explains_why_and_expected_outcome():
    recommendations = _build_recommendations(
        _step(
            step_id="prepare-study-project",
            can_complete=False,
            blockers=["Projet d'études prêt"],
        )
    )

    assert recommendations.free_action is not None
    assert "Étape test" in recommendations.free_action.reason_now
    assert recommendations.free_action.expected_outcome == "La preuve doit être validée."
    assert recommendations.free_action.addresses_blockers == ["Projet d'études prêt"]

    assert recommendations.recommended_product is not None
    assert "Option facultative" in recommendations.recommended_product.reason_now
    assert recommendations.recommended_product.addresses_blockers == ["Projet d'études prêt"]


def test_no_paid_product_is_promoted_when_step_is_already_ready():
    recommendations = _build_recommendations(
        _step(
            step_id="prepare-study-project",
            can_complete=True,
            blockers=[],
        )
    )

    assert recommendations.recommended_product is None
    assert recommendations.free_action is not None


def test_step_without_product_keeps_product_empty():
    recommendations = _build_recommendations(
        _step(
            step_id="track-after-official-filing",
            can_complete=False,
            blockers=["Suivi après dépôt démarré"],
        )
    )

    assert recommendations.recommended_product is None
    assert recommendations.free_action is not None
