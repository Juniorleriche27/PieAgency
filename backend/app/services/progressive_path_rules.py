from __future__ import annotations

from dataclasses import dataclass

from .document_path_evidence import build_document_evidence


@dataclass(frozen=True)
class RequirementRule:
    key: str
    label: str
    source: str  # automatic | declared
    required: bool = True


@dataclass(frozen=True)
class StepRule:
    objective: str
    next_action: str
    completion_rule: str
    requirements: tuple[RequirementRule, ...]
    prerequisite_step_ids: tuple[str, ...] = ()


def _req(key: str, label: str, source: str = "declared") -> RequirementRule:
    return RequirementRule(key=key, label=label, source=source)


STEP_RULES: dict[str, StepRule] = {
    "understand-profile": StepRule(
        objective="Disposer d'un profil étudiant suffisamment renseigné pour personnaliser toute la procédure.",
        next_action="Compléter puis soumettre l'embarquement étudiant.",
        completion_rule="L'onboarding doit avoir été soumis ou validé.",
        requirements=(
            _req("onboarding_submitted", "Profil d'embarquement soumis", "automatic"),
        ),
    ),
    "read-diagnostic": StepRule(
        objective="Comprendre les priorités, risques et points de vigilance propres au dossier.",
        next_action="Lire le diagnostic et confirmer que les priorités ont été comprises.",
        completion_rule="Le diagnostic doit être disponible puis confirmé comme lu.",
        requirements=(
            _req("diagnostic_available", "Diagnostic disponible", "automatic"),
            _req("diagnostic_reviewed", "Diagnostic lu et compris"),
        ),
        prerequisite_step_ids=("understand-profile",),
    ),
    "define-procedure-strategy": StepRule(
        objective="Fixer la procédure et l'ordre des démarches adaptés au profil de l'étudiant.",
        next_action="Choisir la stratégie de procédure à suivre et la confirmer.",
        completion_rule="Une stratégie de procédure doit être explicitement définie.",
        requirements=(
            _req("procedure_strategy_defined", "Stratégie de procédure définie"),
        ),
        prerequisite_step_ids=("read-diagnostic",),
    ),
    "choose-programs": StepRule(
        objective="Construire une sélection réaliste et cohérente de formations à candidater.",
        next_action="Finaliser une shortlist de formations suffisamment précise pour lancer le dossier.",
        completion_rule="Une shortlist de formations doit être explicitement confirmée comme prête.",
        requirements=(
            _req("program_shortlist_ready", "Shortlist de formations prête"),
        ),
        prerequisite_step_ids=("define-procedure-strategy",),
    ),
    "prepare-study-project": StepRule(
        objective="Formaliser un projet d'études cohérent avec le parcours et les formations visées.",
        next_action="Rédiger puis valider le projet d'études de référence.",
        completion_rule="Le projet d'études doit être explicitement confirmé comme prêt.",
        requirements=(
            _req("study_project_ready", "Projet d'études prêt"),
        ),
        prerequisite_step_ids=("choose-programs",),
    ),
    "prepare-career-project": StepRule(
        objective="Relier le parcours académique, la formation cible et un objectif professionnel crédible.",
        next_action="Rédiger puis valider le projet professionnel de référence.",
        completion_rule="Le projet professionnel doit être explicitement confirmé comme prêt.",
        requirements=(
            _req("career_project_ready", "Projet professionnel prêt"),
        ),
        prerequisite_step_ids=("prepare-study-project",),
    ),
    "prepare-cv": StepRule(
        objective="Disposer d'un CV exploitable dans les candidatures et procédures officielles.",
        next_action="Déposer le CV et obtenir son statut approuvé dans les documents du dossier.",
        completion_rule="Au moins un document identifié comme CV doit être approuvé.",
        requirements=(
            _req("cv_approved", "CV déposé et approuvé", "automatic"),
        ),
        prerequisite_step_ids=("prepare-career-project",),
    ),
    "prepare-motivation-letters": StepRule(
        objective="Disposer de lettres adaptées aux formations réellement visées.",
        next_action="Déposer au moins une lettre de motivation finalisée et approuvée.",
        completion_rule="Au moins une lettre de motivation doit être approuvée.",
        requirements=(
            _req("motivation_letter_approved", "Lettre de motivation approuvée", "automatic"),
        ),
        prerequisite_step_ids=("prepare-cv",),
    ),
    "prepare-documents": StepRule(
        objective="Rassembler les pièces nécessaires et vérifier que le dossier documentaire est exploitable.",
        next_action="Finaliser la checklist documentaire et résoudre les pièces manquantes ou rejetées.",
        completion_rule="Le dossier doit contenir des documents approuvés et la checklist documentaire doit être confirmée prête.",
        requirements=(
            _req("approved_document_present", "Au moins un document approuvé", "automatic"),
            _req("document_pack_has_no_rejected", "Aucun document rejeté ne reste à corriger", "automatic"),
            _req("document_pack_ready", "Checklist documentaire confirmée prête"),
        ),
        prerequisite_step_ids=("prepare-motivation-letters",),
    ),
    "verify-before-official-filing": StepRule(
        objective="Effectuer un contrôle final de cohérence avant toute soumission officielle.",
        next_action="Faire la revue pré-dépôt puis confirmer qu'aucun point bloquant ne reste.",
        completion_rule="La revue pré-dépôt doit être explicitement confirmée.",
        requirements=(
            _req("pre_filing_review_confirmed", "Revue pré-dépôt confirmée"),
        ),
        prerequisite_step_ids=("prepare-documents",),
    ),
    "mark-official-filing-done": StepRule(
        objective="Tracer le dépôt réel effectué sur la plateforme officielle concernée.",
        next_action="Déclarer la plateforme, la date et le statut du dépôt officiel.",
        completion_rule="Un dépôt officiel doit exister dans le dossier.",
        requirements=(
            _req("official_deposit_declared", "Dépôt officiel déclaré", "automatic"),
        ),
        prerequisite_step_ids=("verify-before-official-filing",),
    ),
    "prepare-campus-france-interview": StepRule(
        objective="Être prêt à expliquer de manière cohérente le parcours, les choix de formation et le projet professionnel.",
        next_action="Terminer la préparation et confirmer que l'entretien peut être simulé sans point bloquant.",
        completion_rule="La préparation d'entretien doit être explicitement confirmée.",
        requirements=(
            _req("campus_france_interview_ready", "Préparation entretien confirmée"),
        ),
        prerequisite_step_ids=("mark-official-filing-done",),
    ),
    "prepare-visa-file": StepRule(
        objective="Constituer un dossier visa complet et cohérent avec la situation de l'étudiant.",
        next_action="Vérifier les justificatifs visa et confirmer que le dossier est prêt.",
        completion_rule="La checklist visa doit être explicitement confirmée prête.",
        requirements=(
            _req("visa_file_ready", "Dossier visa confirmé prêt"),
        ),
        prerequisite_step_ids=("prepare-campus-france-interview",),
    ),
    "track-after-official-filing": StepRule(
        objective="Suivre les retours officiels et ne manquer aucune action après le dépôt.",
        next_action="Mettre en place le suivi du dépôt et confirmer qu'il est actif.",
        completion_rule="Un dépôt officiel doit exister et son suivi doit être explicitement lancé.",
        requirements=(
            _req("official_deposit_declared", "Dépôt officiel déclaré", "automatic"),
            _req("official_follow_up_started", "Suivi après dépôt démarré"),
        ),
        prerequisite_step_ids=("prepare-visa-file",),
    ),
    "prepare-departure": StepRule(
        objective="Anticiper les démarches pratiques nécessaires avant le départ et l'arrivée.",
        next_action="Finaliser la checklist départ et confirmer que les préparatifs essentiels sont couverts.",
        completion_rule="La checklist de départ doit être explicitement confirmée prête.",
        requirements=(
            _req("departure_plan_ready", "Checklist de départ confirmée prête"),
        ),
        prerequisite_step_ids=("track-after-official-filing",),
    ),
}


def get_step_rule(step_id: str) -> StepRule | None:
    return STEP_RULES.get(step_id)


def automatic_evidence_from_context(
    *,
    onboarding_status: str | None,
    documents: list[dict],
    official_deposit_declared: bool,
    diagnostic_available: bool = False,
) -> dict[str, bool]:
    normalized_status = str(onboarding_status or "").strip().lower()
    onboarding_submitted = normalized_status in {"submitted", "under_review", "validated"}

    document_evidence = build_document_evidence(documents)
    return {
        "onboarding_submitted": onboarding_submitted,
        "diagnostic_available": bool(diagnostic_available),
        "official_deposit_declared": bool(official_deposit_declared),
        **document_evidence,
    }


def evaluate_step_rule(
    step_id: str,
    *,
    automatic_evidence: dict[str, bool],
    declared_evidence: set[str] | None = None,
    completed_step_ids: set[str] | None = None,
) -> dict:
    rule = get_step_rule(step_id)
    if rule is None:
        return {
            "objective": "",
            "next_action": "",
            "completion_rule": "",
            "prerequisites": [],
            "requirements": [],
            "evidence": [],
            "blocking_reasons": [],
            "can_complete": True,
        }

    declared = declared_evidence or set()
    completed = completed_step_ids or set()

    prerequisites = [
        {
            "step_id": prerequisite_id,
            "satisfied": prerequisite_id in completed,
        }
        for prerequisite_id in rule.prerequisite_step_ids
    ]

    requirements = []
    evidence = []
    blockers: list[str] = []
    for requirement in rule.requirements:
        satisfied = (
            bool(automatic_evidence.get(requirement.key))
            if requirement.source == "automatic"
            else requirement.key in declared
        )
        item = {
            "key": requirement.key,
            "label": requirement.label,
            "source": requirement.source,
            "required": requirement.required,
            "satisfied": satisfied,
        }
        requirements.append(item)
        if satisfied:
            evidence.append(item)
        elif requirement.required:
            blockers.append(requirement.label)

    for prerequisite in prerequisites:
        if not prerequisite["satisfied"]:
            blockers.append(f"Étape préalable non terminée : {prerequisite['step_id']}")

    return {
        "objective": rule.objective,
        "next_action": rule.next_action,
        "completion_rule": rule.completion_rule,
        "prerequisites": prerequisites,
        "requirements": requirements,
        "evidence": evidence,
        "blocking_reasons": blockers,
        "can_complete": not blockers,
    }
