from backend.app.services.progressive_path_rules import (
    STEP_RULES,
    automatic_evidence_from_context,
    evaluate_step_rule,
)


EXPECTED_STEP_IDS = [
    "understand-profile",
    "read-diagnostic",
    "define-procedure-strategy",
    "choose-programs",
    "prepare-study-project",
    "prepare-career-project",
    "prepare-cv",
    "prepare-motivation-letters",
    "prepare-documents",
    "verify-before-official-filing",
    "mark-official-filing-done",
    "prepare-campus-france-interview",
    "prepare-visa-file",
    "track-after-official-filing",
    "prepare-departure",
]


def test_all_15_steps_have_business_rules():
    assert list(STEP_RULES) == EXPECTED_STEP_IDS
    for step_id, rule in STEP_RULES.items():
        assert rule.objective.strip(), step_id
        assert rule.next_action.strip(), step_id
        assert rule.completion_rule.strip(), step_id
        assert rule.requirements, step_id


def test_onboarding_automatic_evidence_requires_submitted_or_better():
    for status in ["submitted", "under_review", "validated"]:
        evidence = automatic_evidence_from_context(
            onboarding_status=status,
            documents=[],
            official_deposit_declared=False,
        )
        assert evidence["onboarding_submitted"] is True

    for status in [None, "", "not_started", "in_progress", "rejected"]:
        evidence = automatic_evidence_from_context(
            onboarding_status=status,
            documents=[],
            official_deposit_declared=False,
        )
        assert evidence["onboarding_submitted"] is False


def test_document_automatic_evidence_only_uses_approved_documents():
    evidence = automatic_evidence_from_context(
        onboarding_status="validated",
        documents=[
            {"name": "Mon CV.pdf", "status": "review"},
            {"name": "lettre motivation paris.pdf", "status": "approved"},
        ],
        official_deposit_declared=False,
    )
    assert evidence["cv_approved"] is False
    assert evidence["motivation_letter_approved"] is True
    assert evidence["approved_document_present"] is True


def test_cv_step_requires_previous_step_and_approved_cv():
    evaluation = evaluate_step_rule(
        "prepare-cv",
        automatic_evidence={"cv_approved": True},
        completed_step_ids={"prepare-career-project"},
    )
    assert evaluation["can_complete"] is True
    assert evaluation["blocking_reasons"] == []

    blocked = evaluate_step_rule(
        "prepare-cv",
        automatic_evidence={"cv_approved": False},
        completed_step_ids={"prepare-career-project"},
    )
    assert blocked["can_complete"] is False
    assert "CV déposé et approuvé" in blocked["blocking_reasons"]


def test_declared_steps_stay_blocked_until_explicit_evidence_is_supplied():
    blocked = evaluate_step_rule(
        "prepare-study-project",
        automatic_evidence={},
        declared_evidence=set(),
        completed_step_ids={"choose-programs"},
    )
    assert blocked["can_complete"] is False
    assert "Projet d'études prêt" in blocked["blocking_reasons"]

    ready = evaluate_step_rule(
        "prepare-study-project",
        automatic_evidence={},
        declared_evidence={"study_project_ready"},
        completed_step_ids={"choose-programs"},
    )
    assert ready["can_complete"] is True


def test_official_filing_step_is_automatically_proven_by_deposit_record():
    ready = evaluate_step_rule(
        "mark-official-filing-done",
        automatic_evidence={"official_deposit_declared": True},
        completed_step_ids={"verify-before-official-filing"},
    )
    assert ready["can_complete"] is True

    blocked = evaluate_step_rule(
        "mark-official-filing-done",
        automatic_evidence={"official_deposit_declared": False},
        completed_step_ids={"verify-before-official-filing"},
    )
    assert blocked["can_complete"] is False


def test_prerequisite_is_reported_as_blocker():
    evaluation = evaluate_step_rule(
        "prepare-departure",
        automatic_evidence={},
        declared_evidence={"departure_plan_ready"},
        completed_step_ids=set(),
    )
    assert evaluation["can_complete"] is False
    assert any("track-after-official-filing" in item for item in evaluation["blocking_reasons"])


def test_diagnostic_availability_is_automatic_but_review_is_explicit():
    evidence = automatic_evidence_from_context(
        onboarding_status="submitted",
        documents=[],
        official_deposit_declared=False,
        diagnostic_available=True,
    )
    blocked = evaluate_step_rule(
        "read-diagnostic",
        automatic_evidence=evidence,
        declared_evidence=set(),
        completed_step_ids={"understand-profile"},
    )
    assert blocked["can_complete"] is False
    assert "Diagnostic disponible" not in blocked["blocking_reasons"]
    assert "Diagnostic lu et compris" in blocked["blocking_reasons"]

    ready = evaluate_step_rule(
        "read-diagnostic",
        automatic_evidence=evidence,
        declared_evidence={"diagnostic_reviewed"},
        completed_step_ids={"understand-profile"},
    )
    assert ready["can_complete"] is True
