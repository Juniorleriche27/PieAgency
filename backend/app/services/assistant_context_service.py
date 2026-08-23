from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

from ..schemas import (
    AssistantContextDiagnosticV1,
    AssistantContextDocumentSummaryV1,
    AssistantContextDossierV1,
    AssistantContextProductPromotionV1,
    AssistantContextRequirementV1,
    AssistantContextSnapshotV1,
    AssistantContextStepV1,
    AssistantContextStudentV1,
    AuthUserProfile,
    CandidateAssistantChatRequest,
)
from .dashboard_service import get_student_dashboard
from .private_catalog_service import get_private_diagnostic
from .progressive_path_service import get_candidate_progressive_path


def _requirement_context(item) -> AssistantContextRequirementV1:
    return AssistantContextRequirementV1(
        key=item.key,
        label=item.label,
        source=item.source,
        required=item.required,
        satisfied=item.satisfied,
    )


def _step_context(step, progress_percent: int) -> AssistantContextStepV1:
    return AssistantContextStepV1(
        id=step.id,
        title=step.title,
        order=step.order,
        status=step.status.value,
        short_description=step.short_description,
        progress_percent=progress_percent,
        objective=step.objective or None,
        next_action=step.next_action or None,
        completion_rule=step.completion_rule or None,
        can_complete=step.can_complete,
        requirements=[_requirement_context(item) for item in step.requirements[:20]],
        evidence=[_requirement_context(item) for item in step.evidence[:20]],
        blocking_reasons=[str(item)[:400] for item in step.blocking_reasons[:20]],
    )


def _next_step(path):
    current = path.current_step
    if current is None:
        return None
    candidates = [
        step for step in path.steps
        if step.order > current.order and step.status.value != "completed"
    ]
    return min(candidates, key=lambda item: item.order) if candidates else None


def build_assistant_context_snapshot(
    request: CandidateAssistantChatRequest,
    current_user: AuthUserProfile,
    access_token: str | None,
) -> AssistantContextSnapshotV1:
    path = get_candidate_progressive_path(current_user.user_id, access_token)
    dashboard = get_student_dashboard(current_user, access_token)

    current_step = path.current_step
    step_context = (
        _step_context(current_step, path.progress_percent)
        if current_step is not None
        else None
    )
    following_step = _next_step(path)
    next_step_context = (
        _step_context(following_step, path.progress_percent)
        if following_step is not None
        else None
    )

    try:
        diagnostic = get_private_diagnostic(current_user.user_id, access_token)
        diagnostic_context = AssistantContextDiagnosticV1(
            current_priority=diagnostic.current_priority or None,
            main_risk=diagnostic.main_risk or None,
            next_action=diagnostic.next_action or None,
            adapted_checklist=[str(item)[:300] for item in diagnostic.adapted_checklist[:12]],
        )
    except Exception:
        diagnostic_context = None

    document_status_counts = Counter(document.status.value for document in dashboard.documents)
    official_status = path.official_deposit.status
    dossier_context = AssistantContextDossierV1(
        case_reference=(
            dashboard.case_reference
            if dashboard.case_reference and dashboard.case_reference != "En qualification"
            else None
        ),
        project_name=(
            dashboard.project_name
            if dashboard.project_name and dashboard.project_name != "Aucun dossier actif"
            else None
        ),
        status_label=dashboard.status_label or None,
        next_action=dashboard.next_action or None,
        document_status_counts=dict(document_status_counts),
        document_summaries=[
            AssistantContextDocumentSummaryV1(
                document_id=getattr(document, "id", None),
                name=document.name,
                status=document.status.value,
                note=document.note or None,
            )
            for document in dashboard.documents[:12]
        ],
        official_deposit_declared=path.official_deposit.has_declared,
        official_deposit_status=official_status.value if official_status is not None else None,
    )

    product_recommendation = path.recommendations.recommended_product
    product_promotion = (
        AssistantContextProductPromotionV1(
            title=product_recommendation.title,
            description=product_recommendation.description or None,
            target_path=product_recommendation.target_path,
            reason_now=product_recommendation.reason_now or None,
            expected_outcome=product_recommendation.expected_outcome or None,
            addresses_blockers=[
                str(item)[:300] for item in product_recommendation.addresses_blockers[:5]
            ],
            optional=True,
        )
        if product_recommendation is not None
        else None
    )

    hints: list[str] = []
    if current_step is not None:
        hints.extend([
            current_step.title,
            current_step.short_description,
            current_step.objective,
            current_step.next_action,
            *current_step.blocking_reasons[:3],
        ])
    if following_step is not None:
        hints.append(f"Étape suivante : {following_step.title}")
    if diagnostic_context is not None:
        hints.extend([
            diagnostic_context.current_priority,
            diagnostic_context.main_risk,
            diagnostic_context.next_action,
        ])
    if dashboard.project_name and dashboard.project_name != "Aucun dossier actif":
        hints.append(dashboard.project_name)
    if current_user.country:
        hints.append(current_user.country)
    if request.page_path:
        hints.append(f"Écran actuel : {request.page_path}")
    if product_promotion is not None:
        hints.append(f"Produit facultatif utile maintenant : {product_promotion.title}")

    deduped_hints: list[str] = []
    seen: set[str] = set()
    for hint in hints:
        normalized = " ".join(str(hint or "").split()).strip()
        key = normalized.casefold()
        if not normalized or key in seen:
            continue
        seen.add(key)
        deduped_hints.append(normalized[:240])

    return AssistantContextSnapshotV1(
        requested_action=request.requested_action,
        page_path=request.page_path,
        generated_at=datetime.now(timezone.utc).isoformat(),
        student=AssistantContextStudentV1(
            full_name=current_user.full_name,
            country=current_user.country,
            project_name=dossier_context.project_name,
            status_label=dossier_context.status_label,
        ),
        current_step=step_context,
        next_step=next_step_context,
        dossier=dossier_context,
        diagnostic=diagnostic_context,
        product_promotion=product_promotion,
        retrieval_hints=deduped_hints[:8],
    )
