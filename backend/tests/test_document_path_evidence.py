from backend.app.services.document_path_evidence import (
    build_document_evidence,
    classify_document_name,
    document_guidance_for_step,
    normalize_document_status,
)
from backend.app.services.progressive_path_rules import evaluate_step_rule


def test_document_status_normalization_matches_private_api_contract():
    assert normalize_document_status("approved") == "approved"
    assert normalize_document_status("validated") == "approved"
    assert normalize_document_status("review") == "review"
    assert normalize_document_status("in-progress") == "review"
    assert normalize_document_status("rejected") == "rejected"
    assert normalize_document_status("missing") == "missing"


def test_document_name_classification_covers_real_pieagency_templates():
    expected = {
        "CV": "cv",
        "Lettre de motivation": "motivation_letter",
        "Pièce d'identité ou passeport": "identity",
        "Diplôme de Licence": "diploma",
        "Relevé de notes officiel": "academic_record",
        "Bulletin L1 — Semestre 1": "academic_record",
        "Justificatif de niveau de langue": "language",
        "Justificatif d'hébergement": "housing",
        "Justificatif de financement": "funding",
        "Documents visa": "visa",
        "Projet d'études": "study_project",
        "Projet professionnel": "career_project",
        "Attestation d'inscription ou certificat de scolarité": "enrollment",
        "Photo d'identité": "photo",
    }
    for name, category in expected.items():
        assert classify_document_name(name) == category, name


def test_cv_approved_is_automatic_evidence_for_cv_step():
    evidence = build_document_evidence([
        {"name": "CV", "status": "approved", "note": "Validé"},
    ])
    evaluation = evaluate_step_rule(
        "prepare-cv",
        automatic_evidence=evidence,
        completed_step_ids={"prepare-career-project"},
    )
    assert evidence["cv_approved"] is True
    assert evaluation["can_complete"] is True


def test_cv_review_and_rejected_produce_actionable_guidance():
    review = document_guidance_for_step(
        "prepare-cv",
        [{"name": "CV", "status": "review", "note": "En contrôle"}],
    )
    assert any("vérification" in item for item in review["blocking_reasons"])
    assert "Attendre" in str(review["next_action"])

    rejected = document_guidance_for_step(
        "prepare-cv",
        [{"name": "CV", "status": "rejected", "note": "À corriger"}],
    )
    assert any("rejeté" in item for item in rejected["blocking_reasons"])
    assert "redéposer" in str(rejected["next_action"])


def test_motivation_letter_approved_satisfies_letter_step():
    evidence = build_document_evidence([
        {"name": "Lettre de motivation", "status": "approved"},
    ])
    evaluation = evaluate_step_rule(
        "prepare-motivation-letters",
        automatic_evidence=evidence,
        completed_step_ids={"prepare-cv"},
    )
    assert evidence["motivation_letter_approved"] is True
    assert evaluation["can_complete"] is True


def test_prepare_documents_is_blocked_by_any_rejected_document():
    evidence = build_document_evidence([
        {"name": "CV", "status": "approved"},
        {"name": "Passeport", "status": "rejected", "note": "Scan illisible"},
    ])
    evaluation = evaluate_step_rule(
        "prepare-documents",
        automatic_evidence=evidence,
        declared_evidence={"document_pack_ready"},
        completed_step_ids={"prepare-motivation-letters"},
    )
    guidance = document_guidance_for_step(
        "prepare-documents",
        [
            {"name": "CV", "status": "approved"},
            {"name": "Passeport", "status": "rejected", "note": "Scan illisible"},
        ],
    )
    assert evidence["document_pack_has_no_rejected"] is False
    assert evaluation["can_complete"] is False
    assert any("rejeté" in item for item in guidance["blocking_reasons"])


def test_prepare_documents_review_state_gives_waiting_guidance():
    guidance = document_guidance_for_step(
        "prepare-documents",
        [
            {"name": "CV", "status": "approved"},
            {"name": "Passeport", "status": "review"},
        ],
    )
    assert any("vérification" in item for item in guidance["blocking_reasons"])
    assert "validation" in str(guidance["next_action"])


def test_visa_rejected_critical_document_blocks_visa_guidance():
    guidance = document_guidance_for_step(
        "prepare-visa-file",
        [
            {"name": "Passeport", "status": "rejected"},
            {"name": "Justificatif d'hébergement", "status": "approved"},
            {"name": "Justificatif de financement", "status": "approved"},
        ],
    )
    assert any("visa" in item.casefold() for item in guidance["blocking_reasons"])
    assert "Corriger" in str(guidance["next_action"])
