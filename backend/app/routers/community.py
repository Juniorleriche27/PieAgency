from fastapi import APIRouter, Depends, File as FastAPIFile, HTTPException, UploadFile

from ..dependencies.auth import (
    get_current_access_token,
    get_current_user,
    get_optional_authenticated_access_token,
    get_optional_current_user,
    require_admin_user,
)
from ..schemas import (
    AuthUserProfile,
    CommunityAdCreateRequest,
    CommunityAdItem,
    CommunityAdsResponse,
    CommunityAIRewriteRequest,
    CommunityAIRewriteResponse,
    CommunityAssistantMessageRequest,
    CommunityAssistantThreadResponse,
    CommunityBootstrapResponse,
    CommunityDirectMessageCreateRequest,
    CommunityDirectThreadListResponse,
    CommunityDirectThreadResponse,
    CommunityCommentCreateRequest,
    CommunityCommentUpdateRequest,
    CommunityEventAttendanceResponse,
    CommunityEventCalendarItem,
    CommunityEventCreateRequest,
    CommunityFollowResponse,
    CommunityGroupCreateRequest,
    CommunityGroupItem,
    CommunityGroupMemberItem,
    CommunityGroupMemberRoleRequest,
    CommunityGroupMembershipResponse,
    CommunityBlockResponse,
    CommunityBlockListResponse,
    CommunityMutationResponse,
    CommunityNotificationsResponse,
    CommunityModerationQueueResponse,
    CommunityModerationResolveRequest,
    CommunityReportCreateRequest,
    CommunityReportItem,
    CommunityReportResponse,
    CommunityPollVoteRequest,
    CommunityPostCreateRequest,
    CommunityPostItem,
    CommunityPostUpdateRequest,
    CommunityAssetItem,
    CommunityStoryCreateRequest,
    CommunityStoryItem,
)
from ..services.community_service import (
    CommunityDataUnavailableError,
    create_community_ad,
    create_community_comment,
    create_community_story,
    create_community_event,
    create_community_group,
    create_community_report,
    get_community_moderation_queue,
    resolve_community_report,
    create_community_post,
    delete_community_comment,
    delete_community_post,
    delete_community_story,
    get_community_ads,
    get_community_assistant_thread,
    get_community_bootstrap,
    get_community_direct_thread,
    get_community_direct_threads,
    get_community_events_calendar,
    get_community_groups,
    get_community_group_members,
    get_community_user_blocks,
    get_community_notifications,
    get_community_stories,
    get_group_posts,
    mark_community_notification_read,
    mark_all_community_notifications_read,
    remove_community_group_member,
    rewrite_community_text,
    send_community_assistant_message,
    send_community_direct_message,
    toggle_community_event_attendance,
    toggle_community_group_membership,
    toggle_community_user_block,
    update_community_group_member_role,
    toggle_community_post_reaction,
    toggle_community_comment_reaction,
    toggle_community_profile_follow,
    vote_community_poll,
    register_community_post_share,
    update_community_comment,
    update_community_post,
    upload_community_asset,
)

router = APIRouter()


@router.get("/community/bootstrap", response_model=CommunityBootstrapResponse)
def community_bootstrap(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_authenticated_access_token),
) -> CommunityBootstrapResponse:
    try:
        return get_community_bootstrap(current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/posts", response_model=CommunityMutationResponse)
def community_create_post(
    payload: CommunityPostCreateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return create_community_post(payload, current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.patch("/community/posts/{post_id}", response_model=CommunityMutationResponse)
def community_update_post(
    post_id: int,
    payload: CommunityPostUpdateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return update_community_post(post_id, payload, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/community/posts/{post_id}")
def community_delete_post(
    post_id: int,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> dict[str, bool]:
    try:
        return {"ok": delete_community_post(post_id, current_user, access_token)}
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/community/posts/{post_id}/shares", response_model=CommunityMutationResponse)
def community_register_share(
    post_id: int,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return register_community_post_share(post_id, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/community/posts/{post_id}/comments", response_model=CommunityMutationResponse)
def community_create_comment(
    post_id: int,
    payload: CommunityCommentCreateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return create_community_comment(post_id, payload, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.patch("/community/comments/{comment_id}", response_model=CommunityMutationResponse)
def community_update_comment(
    comment_id: int,
    payload: CommunityCommentUpdateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return update_community_comment(comment_id, payload, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.delete("/community/comments/{comment_id}", response_model=CommunityMutationResponse)
def community_delete_comment(
    comment_id: int,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return delete_community_comment(comment_id, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/community/comments/{comment_id}/reaction", response_model=CommunityMutationResponse)
def community_toggle_comment_reaction(
    comment_id: int,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return toggle_community_comment_reaction(comment_id, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/community/assets/upload", response_model=CommunityAssetItem)
async def community_upload_asset(
    file: UploadFile = FastAPIFile(...),
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityAssetItem:
    try:
        content = await file.read()
        return upload_community_asset(
            content,
            file.filename or "fichier",
            file.content_type or "application/octet-stream",
            current_user,
            access_token,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/community/stories", response_model=list[CommunityStoryItem])
def community_stories(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_authenticated_access_token),
) -> list[CommunityStoryItem]:
    return get_community_stories(current_user, access_token)


@router.post("/community/stories", response_model=CommunityStoryItem)
def community_create_story(
    payload: CommunityStoryCreateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityStoryItem:
    try:
        return create_community_story(payload, current_user, access_token)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/community/stories/{story_id}")
def community_delete_story(
    story_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> dict[str, bool]:
    try:
        return {"ok": delete_community_story(story_id, current_user, access_token)}
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/community/posts/{post_id}/reactions/{reaction_kind}", response_model=CommunityMutationResponse)
def community_toggle_reaction(
    post_id: int,
    reaction_kind: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return toggle_community_post_reaction(post_id, reaction_kind, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/posts/{post_id}/poll-votes", response_model=CommunityMutationResponse)
def community_vote_poll(
    post_id: int,
    payload: CommunityPollVoteRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityMutationResponse:
    try:
        return vote_community_poll(post_id, payload, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/profiles/{profile_id}/follow", response_model=CommunityFollowResponse)
def community_toggle_profile_follow(
    profile_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityFollowResponse:
    try:
        return toggle_community_profile_follow(profile_id, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/reports", response_model=CommunityReportResponse)
def community_create_report(
    payload: CommunityReportCreateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityReportResponse:
    try:
        return create_community_report(payload, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/community/moderation/queue", response_model=CommunityModerationQueueResponse)
def community_moderation_queue(
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityModerationQueueResponse:
    return get_community_moderation_queue(current_user, access_token)


@router.post("/community/moderation/reports/{report_id}/resolve", response_model=CommunityReportItem)
def community_resolve_report(
    report_id: str,
    payload: CommunityModerationResolveRequest,
    current_user: AuthUserProfile = Depends(require_admin_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityReportItem:
    try:
        return resolve_community_report(report_id, payload, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/community/assistant/thread", response_model=CommunityAssistantThreadResponse)
def community_assistant_thread(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityAssistantThreadResponse:
    try:
        return get_community_assistant_thread(current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/assistant/messages", response_model=CommunityAssistantThreadResponse)
def community_assistant_message(
    payload: CommunityAssistantMessageRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityAssistantThreadResponse:
    try:
        return send_community_assistant_message(payload, current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/community/direct-messages", response_model=CommunityDirectThreadListResponse)
def community_direct_threads(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityDirectThreadListResponse:
    try:
        return get_community_direct_threads(current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/community/direct-messages/{target_profile_id}", response_model=CommunityDirectThreadResponse)
def community_direct_thread(
    target_profile_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityDirectThreadResponse:
    try:
        return get_community_direct_thread(target_profile_id, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/direct-messages", response_model=CommunityDirectThreadResponse)
def community_direct_message(
    payload: CommunityDirectMessageCreateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityDirectThreadResponse:
    try:
        return send_community_direct_message(payload, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/community/groups", response_model=list[CommunityGroupItem])
def community_get_groups(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_authenticated_access_token),
):
    return get_community_groups(current_user, access_token)


@router.post("/community/groups", response_model=CommunityGroupMembershipResponse)
def community_create_group(
    payload: CommunityGroupCreateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
):
    try:
        return create_community_group(payload, current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/groups/{group_id}/membership", response_model=CommunityGroupMembershipResponse)
def community_toggle_group_membership(
    group_id: int,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
):
    try:
        return toggle_community_group_membership(group_id, current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/community/groups/{group_id}/members", response_model=list[CommunityGroupMemberItem])
def community_get_group_members(group_id: int, current_user: AuthUserProfile = Depends(get_current_user), access_token: str = Depends(get_current_access_token)):
    try:
        return get_community_group_members(group_id, current_user, access_token)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.patch("/community/groups/{group_id}/members/{profile_id}", response_model=list[CommunityGroupMemberItem])
def community_update_group_member(group_id: int, profile_id: str, payload: CommunityGroupMemberRoleRequest, current_user: AuthUserProfile = Depends(get_current_user), access_token: str = Depends(get_current_access_token)):
    try:
        return update_community_group_member_role(group_id, profile_id, payload, current_user, access_token)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.delete("/community/groups/{group_id}/members/{profile_id}", response_model=list[CommunityGroupMemberItem])
def community_remove_group_member(group_id: int, profile_id: str, current_user: AuthUserProfile = Depends(get_current_user), access_token: str = Depends(get_current_access_token)):
    try:
        return remove_community_group_member(group_id, profile_id, current_user, access_token)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/community/events-calendar", response_model=list[CommunityEventCalendarItem])
def community_get_events_calendar(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_authenticated_access_token),
):
    return get_community_events_calendar(current_user, access_token)


@router.post("/community/events-calendar", response_model=CommunityEventAttendanceResponse)
def community_create_event(
    payload: CommunityEventCreateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
):
    try:
        return create_community_event(payload, current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/events-calendar/{event_id}/attendance", response_model=CommunityEventAttendanceResponse)
def community_toggle_event_attendance(
    event_id: int,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
):
    try:
        return toggle_community_event_attendance(event_id, current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/community/notifications", response_model=CommunityNotificationsResponse)
def community_get_notifications(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
):
    return get_community_notifications(current_user, access_token)


@router.post("/community/notifications/{notification_id}/read", response_model=CommunityNotificationsResponse)
def community_mark_notification_read(
    notification_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
):
    return mark_community_notification_read(notification_id, current_user, access_token)


@router.post("/community/notifications/read-all", response_model=CommunityNotificationsResponse)
def community_mark_all_notifications_read(current_user: AuthUserProfile = Depends(get_current_user), access_token: str = Depends(get_current_access_token)):
    return mark_all_community_notifications_read(current_user, access_token)


@router.post("/community/profiles/{profile_id}/block", response_model=CommunityBlockResponse)
def community_toggle_user_block(profile_id: str, current_user: AuthUserProfile = Depends(get_current_user), access_token: str = Depends(get_current_access_token)):
    try:
        return toggle_community_user_block(profile_id, current_user, access_token)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/community/blocks", response_model=CommunityBlockListResponse)
def community_get_user_blocks(current_user: AuthUserProfile = Depends(get_current_user), access_token: str = Depends(get_current_access_token)):
    return get_community_user_blocks(current_user, access_token)


@router.get("/community/ads", response_model=CommunityAdsResponse)
def community_get_ads(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_authenticated_access_token),
) -> CommunityAdsResponse:
    return get_community_ads(current_user, access_token)


@router.post("/community/ads", response_model=CommunityAdItem)
def community_create_ad(
    payload: CommunityAdCreateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CommunityAdItem:
    try:
        return create_community_ad(payload, current_user, access_token)
    except CommunityDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/community/ai-rewrite", response_model=CommunityAIRewriteResponse)
def community_ai_rewrite(
    payload: CommunityAIRewriteRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
) -> CommunityAIRewriteResponse:
    return rewrite_community_text(payload)


@router.get("/community/groups/{group_id}/posts", response_model=list[CommunityPostItem])
async def community_get_group_posts(
    group_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
):
    return get_group_posts(group_id, current_user, access_token)
