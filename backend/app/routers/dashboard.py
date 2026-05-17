from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from ..dependencies.auth import get_current_access_token, get_current_user, require_admin_user
from ..schemas import (
    AddDocumentRequest,
    AdminDocumentUpdateRequest,
    AdminCommentModerationResponse,
    AdminCandidatesResponse,
    AdminCommunityPostItem,
    AdminConversationDetailResponse,
    AdminDashboardResponse,
    AdminExportCatalogItem,
    AdminPageItem,
    AdminPageUpdateRequest,
    AuthUserProfile,
    CurrentSubscriptionResponse,
    PrivateSubscriptionListResponse,
    PrivateSubscriptionPlanItem,
    StudentDashboardResponse,
    StudentDocumentItem,
    StudentDocumentListResponse,
    SubscriptionPlanCreateRequest,
    SubscriptionPlanSelectRequest,
    SubscriptionPlanUpdateRequest,
)
from ..services.admin_service import (
    AdminDataUnavailableError,
    build_admin_export,
    delete_admin_community_comment,
    get_admin_conversation_detail,
    list_admin_export_catalog,
    list_admin_pages,
    set_admin_community_post_archived,
    update_admin_page,
)
from ..services.dashboard_service import get_admin_dashboard, get_student_dashboard
from ..services.dashboard_service import list_admin_candidates
from ..services.private_catalog_service import (
    add_candidate_document_admin,
    create_admin_subscription_plan,
    delete_candidate_document_admin,
    delete_admin_subscription_plan,
    get_current_subscription,
    list_candidate_documents_admin,
    list_admin_subscription_plans,
    set_current_subscription,
    update_admin_subscription_plan,
    update_candidate_document_admin,
)

router = APIRouter()


@router.get("/student-space", response_model=StudentDashboardResponse)
def student_space_dashboard(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> StudentDashboardResponse:
    return get_student_dashboard(current_user, access_token)


@router.get("/admin/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> AdminDashboardResponse:
    return get_admin_dashboard(current_user, access_token)


@router.get("/admin/candidates", response_model=AdminCandidatesResponse)
def admin_candidates(
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> AdminCandidatesResponse:
    return list_admin_candidates(access_token)


@router.get("/admin/subscription-plans", response_model=PrivateSubscriptionListResponse)
def admin_subscription_plans(
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> PrivateSubscriptionListResponse:
    return list_admin_subscription_plans(access_token)


@router.post("/admin/subscription-plans", response_model=PrivateSubscriptionPlanItem)
def admin_create_subscription_plan(
    payload: SubscriptionPlanCreateRequest,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> PrivateSubscriptionPlanItem:
    try:
        return create_admin_subscription_plan(payload, access_token)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.patch("/admin/subscription-plans/{plan_id}", response_model=PrivateSubscriptionPlanItem)
def admin_update_subscription_plan(
    plan_id: str,
    payload: SubscriptionPlanUpdateRequest,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> PrivateSubscriptionPlanItem:
    try:
        return update_admin_subscription_plan(plan_id, payload, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.delete("/admin/subscription-plans/{plan_id}")
def admin_delete_subscription_plan(
    plan_id: str,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> dict[str, bool]:
    try:
        return {"ok": delete_admin_subscription_plan(plan_id, access_token)}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.patch(
    "/admin/candidates/{user_id}/subscription",
    response_model=CurrentSubscriptionResponse,
)
def admin_update_candidate_subscription(
    user_id: str,
    payload: SubscriptionPlanSelectRequest,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> CurrentSubscriptionResponse:
    return set_current_subscription(user_id, payload.plan_id, access_token)


@router.get(
    "/admin/candidates/{user_id}/documents",
    response_model=StudentDocumentListResponse,
)
def admin_candidate_documents(
    user_id: str,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> StudentDocumentListResponse:
    return list_candidate_documents_admin(user_id, access_token)


@router.post(
    "/admin/candidates/{user_id}/documents",
    response_model=StudentDocumentItem,
)
def admin_add_candidate_document(
    user_id: str,
    payload: AddDocumentRequest,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> StudentDocumentItem:
    try:
        return add_candidate_document_admin(user_id, payload.name, access_token)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.patch(
    "/admin/candidates/{user_id}/documents/{doc_id}",
    response_model=StudentDocumentItem,
)
def admin_update_candidate_document(
    user_id: str,
    doc_id: str,
    payload: AdminDocumentUpdateRequest,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> StudentDocumentItem:
    try:
        return update_candidate_document_admin(
            user_id,
            doc_id,
            payload.status,
            payload.note,
            access_token,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.delete("/admin/candidates/{user_id}/documents/{doc_id}")
def admin_delete_candidate_document(
    user_id: str,
    doc_id: str,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> dict[str, bool]:
    try:
        return {
            "ok": delete_candidate_document_admin(user_id, doc_id, access_token)
        }
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/admin/pages", response_model=list[AdminPageItem])
def admin_pages(
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> list[AdminPageItem]:
    try:
        return list_admin_pages(access_token=access_token)
    except AdminDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.patch("/admin/pages/{page_id}", response_model=AdminPageItem)
def admin_page_update(
    page_id: str,
    payload: AdminPageUpdateRequest,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> AdminPageItem:
    try:
        return update_admin_page(page_id, payload, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/admin/conversations/{conversation_id}", response_model=AdminConversationDetailResponse)
def admin_conversation_detail(
    conversation_id: str,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> AdminConversationDetailResponse:
    try:
        return get_admin_conversation_detail(conversation_id, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/admin/exports/catalog", response_model=list[AdminExportCatalogItem])
def admin_export_catalog(
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> list[AdminExportCatalogItem]:
    try:
        return list_admin_export_catalog(access_token)
    except AdminDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/admin/exports/{dataset_key}")
def admin_export_dataset(
    dataset_key: str,
    format: Literal["json", "csv", "xlsx"] = Query(default="json"),
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> Response:
    try:
        content, media_type, filename = build_admin_export(dataset_key, format, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/admin/community/posts/{post_id}/archive", response_model=AdminCommunityPostItem)
def admin_archive_community_post(
    post_id: int,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> AdminCommunityPostItem:
    try:
        return set_admin_community_post_archived(post_id, True, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/admin/community/posts/{post_id}/restore", response_model=AdminCommunityPostItem)
def admin_restore_community_post(
    post_id: int,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> AdminCommunityPostItem:
    try:
        return set_admin_community_post_archived(post_id, False, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.delete(
    "/admin/community/comments/{comment_id}",
    response_model=AdminCommentModerationResponse,
)
def admin_delete_community_comment(
    comment_id: int,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> AdminCommentModerationResponse:
    try:
        return delete_admin_community_comment(comment_id, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
