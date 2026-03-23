from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from ..dependencies.auth import get_current_access_token, get_current_user, require_admin_user
from ..schemas import (
    AdminCommentModerationResponse,
    AdminCommunityPostItem,
    AdminConversationDetailResponse,
    AdminDashboardResponse,
    AdminExportCatalogItem,
    AdminPageItem,
    AdminPageUpdateRequest,
    AuthUserProfile,
    StudentDashboardResponse,
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
