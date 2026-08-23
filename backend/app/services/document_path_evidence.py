from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


CANONICAL_STATUSES = {"approved", "review", "missing", "rejected"}


@dataclass(frozen=True)
class DocumentPathItem:
    name: str
    category: str
    status: str
    note: str = ""


def _normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", text.casefold().replace("’", "'")).strip()


def normalize_document_status(value: str | None) -> str:
    normalized = _normalize_text(value or "")
    if normalized in {"approved", "done", "valid", "validated"}:
        return "approved"
    if normalized in {"review", "pending", "current", "to-review", "in-progress"}:
        return "review"
    if normalized == "rejected":
        return "rejected"
    return "missing"


def classify_document_name(name: str) -> str:
    value = _normalize_text(name)
    if re.search(r"(^|\b)cv($|\b)|curriculum vitae", value):
        return "cv"
    if "lettre" in value and "motivation" in value:
        return "motivation_letter"
    if "projet d'etudes" in value or "projet etudes" in value:
        return "study_project"
    if "projet professionnel" in value or "projet pro" in value:
        return "career_project"
    if any(term in value for term in ("passeport", "piece d'identite", "carte d'identite")):
        return "identity"
    if any(term in value for term in ("releve", "bulletin")):
        return "academic_record"
    if any(term in value for term in ("diplome", "attestation / diplome")):
        return "diploma"
    if any(term in value for term in ("niveau de langue", "tcf", "delf", "dalf", "toefl", "ielts")):
        return "language"
    if any(term in value for term in ("hebergement", "logement")):
        return "housing"
    if any(term in value for term in ("financement", "ressources financieres", "garant")):
        return "funding"
    if "visa" in value:
        return "visa"
    if any(term in value for term in ("inscription", "certificat de scolarite", "attestation de scolarite")):
        return "enrollment"
    if "photo" in value and "identite" in value:
        return "photo"
    return "other"


def normalize_documents(documents: list[dict]) -> list[DocumentPathItem]:
    return [
        DocumentPathItem(
            name=str(item.get("name") or "Document").strip() or "Document",
            category=classify_document_name(str(item.get("name") or "")),
            status=normalize_document_status(str(item.get("status") or "")),
            note=str(item.get("note") or "").strip(),
        )
        for item in documents
    ]


def category_status(items: list[DocumentPathItem], category: str) -> str:
    matches = [item.status for item in items if item.category == category]
    if not matches:
        return "missing"
    if "approved" in matches:
        return "approved"
    if "review" in matches:
        return "review"
    if "rejected" in matches:
        return "rejected"
    return "missing"


def build_document_evidence(documents: list[dict]) -> dict[str, bool]:
    items = normalize_documents(documents)
    approved = [item for item in items if item.status == "approved"]
    rejected = [item for item in items if item.status == "rejected"]

    evidence: dict[str, bool] = {
        "approved_document_present": bool(approved),
        "document_pack_has_no_rejected": not rejected,
    }
    for category in (
        "cv",
        "motivation_letter",
        "identity",
        "academic_record",
        "diploma",
        "language",
        "housing",
        "funding",
        "visa",
        "study_project",
        "career_project",
        "enrollment",
        "photo",
    ):
        status = category_status(items, category)
        evidence[f"{category}_approved"] = status == "approved"
        evidence[f"{category}_in_review"] = status == "review"
        evidence[f"{category}_rejected"] = status == "rejected"
        evidence[f"{category}_present"] = status != "missing"
    return evidence


def document_guidance_for_step(step_id: str, documents: list[dict]) -> dict[str, object]:
    items = normalize_documents(documents)
    category_by_step = {
        "prepare-cv": "cv",
        "prepare-motivation-letters": "motivation_letter",
        "prepare-study-project": "study_project",
        "prepare-career-project": "career_project",
        "prepare-visa-file": "visa",
    }
    category = category_by_step.get(step_id)

    blockers: list[str] = []
    action: str | None = None
    if category:
        status = category_status(items, category)
        label = {
            "cv": "CV",
            "motivation_letter": "lettre de motivation",
            "study_project": "projet d'études",
            "career_project": "projet professionnel",
            "visa": "documents visa",
        }[category]
        if status == "rejected":
            blockers.append(f"{label.capitalize()} rejeté : corrigez puis redéposez le document.")
            action = f"Corriger puis redéposer votre {label}."
        elif status == "review":
            blockers.append(f"{label.capitalize()} en cours de vérification par PieAgency.")
            action = f"Attendre la validation de votre {label} ou corriger le document si une note vous est adressée."
        elif status == "approved":
            if step_id in {"prepare-cv", "prepare-motivation-letters"}:
                action = f"Votre {label} est approuvé. Vous pouvez valider cette étape du parcours."
            elif step_id == "prepare-visa-file":
                action = "Les documents visa sont approuvés. Finalisez maintenant la checklist visa."
        elif status == "missing":
            action = f"Ajouter votre {label} dans les documents du dossier."

    if step_id == "prepare-documents":
        rejected = [item for item in items if item.status == "rejected"]
        review = [item for item in items if item.status == "review"]
        if rejected:
            names = ", ".join(item.name for item in rejected[:3])
            blockers.append(f"Document(s) rejeté(s) à corriger : {names}.")
            action = "Corriger en priorité les documents rejetés puis les redéposer."
        elif review:
            names = ", ".join(item.name for item in review[:3])
            blockers.append(f"Document(s) encore en vérification : {names}.")
            action = "Suivre la validation des documents en revue avant de finaliser la checklist."
        elif not items:
            action = "Ajouter les premières pièces du dossier documentaire."

    if step_id == "prepare-visa-file":
        critical_categories = ("identity", "housing", "funding")
        rejected_critical = [
            category for category in critical_categories
            if category_status(items, category) == "rejected"
        ]
        if rejected_critical:
            blockers.append("Un justificatif essentiel au dossier visa est rejeté.")
            action = "Corriger les justificatifs visa rejetés avant de confirmer la checklist visa."

    return {
        "blocking_reasons": blockers,
        "next_action": action,
    }
