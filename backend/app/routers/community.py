from fastapi import APIRouter, Depends, HTTPException

from ..dependencies.auth import (
    get_current_access_token,
    get_current_user,
    get_optional_access_token,
    get_optional_current_user,
)
from ..schemas import (
    AuthUserProfile,
    CommunityAssistantMessageRequest,
    CommunityAssistantThreadResponse,
    CommunityBootstrapResponse,
    CommunityCommentCreateRequest,
    CommunityMutationResponse,
    CommunityPollVoteRequest,
    CommunityPostCreateRequest,
)
from ..services.community_service import (
    CommunityDataUnavailableError,
    create_community_comment,
    create_community_post,
    get_community_assistant_thread,
    get_community_bootstrap,
    send_community_assistant_message,
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
