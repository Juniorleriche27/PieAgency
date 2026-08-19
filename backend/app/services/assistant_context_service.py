from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

from ..schemas import (
    AssistantContextDossierV1,
    AssistantContextSnapshotV1,
    AssistantContextStepV1,
    AssistantContextStudentV1,
    AuthUserProfile,
    CandidateAssistantChatRequest,
)
from .dashboard_service import get_student_dashboard
from .progressive_path_service import get_candidate_progressive_path


def build_assistant_context_snapshot(
    request: CandidateAssistantChatRequest,
    current_user: AuthUserProfile,
    access_token: str | None,
) -> AssistantContextSnapshotV1:
    path = get_candidate_progressive_path(current_user.user_id, access_token)
    dashboard = get_student_dashboard(current_user, access_token)

    current_step = path.current_step
    step_context = None
    if current_step is not None:
        step_context = AssistantContextStepV1(
            id=current_step.id,
            title=current_step.title,
            order=current_step.order,
            status=current_step.status.value,
            short_description=current_step.short_description,
            progress_percent=path.progress_percent,
        )

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
        official_deposit_declared=path.official_deposit.has_declared,
        official_deposit_status=official_status.value if official_status is not None else None,
    )

    hints: list[str] = []
    if current_step is not None:
        hints.extend([current_step.title, current_step.short_description])
    if dashboard.project_name and dashboard.project_name != "Aucun dossier actif":
        hints.append(dashboard.project_name)
    if current_user.country:
        hints.append(current_user.country)

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
        generated_at=datetime.now(timezone.utc).isoformat(),
        student=AssistantContextStudentV1(
            full_name=current_user.full_name,
            country=current_user.country,
            project_name=dossier_context.project_name,
            status_label=dossier_context.status_label,
        ),
        current_step=step_context,
        dossier=dossier_context,
        retrieval_hints=deduped_hints[:8],
    )
