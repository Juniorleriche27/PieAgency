from fastapi import APIRouter, Depends, HTTPException

from ..dependencies.auth import (
    get_current_access_token,
    get_current_user,
    get_optional_access_token,
    get_optional_current_user,
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
    CommunityCommentCreateRequest,
    CommunityEventAttendanceResponse,
    CommunityEventCalendarItem,
    CommunityEventCreateRequest,
    CommunityGroupCreateRequest,
    CommunityGroupItem,
    CommunityGroupMembershipResponse,
    CommunityMutationResponse,
    CommunityNotificationsResponse,
    CommunityPollVoteRequest,
    CommunityPostCreateRequest,
)
from ..services.community_service import (
    CommunityDataUnavailableError,
    create_community_ad,
    create_community_comment,
    create_community_event,
    create_community_group,
    create_community_post,
    get_community_ads,
    get_community_assistant_thread,
    get_community_bootstrap,
    get_community_events_calendar,
    get_community_groups,
    get_community_notifications,
    mark_community_notification_read,
    rewrite_community_text,
    send_community_assistant_message,
    toggle_community_event_attendance,
    toggle_community_group_membership,
    toggle_community_post_reaction,
    vote_community_poll,
)

router = APIRouter()


@router.get("/community/bootstrap", response_model=CommunityBootstrapResponse)
def community_bootstrap(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_access_token),
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


@router.get("/community/groups", response_model=list[CommunityGroupItem])
def community_get_groups(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_access_token),
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


@router.get("/community/events-calendar", response_model=list[CommunityEventCalendarItem])
def community_get_events_calendar(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_access_token),
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


@router.get("/community/ads", response_model=CommunityAdsResponse)
def community_get_ads(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
    access_token: str | None = Depends(get_optional_access_token),
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
