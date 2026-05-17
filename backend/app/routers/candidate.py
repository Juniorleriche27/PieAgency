from fastapi import APIRouter, Depends, HTTPException

from ..dependencies.auth import get_current_access_token, get_current_user
from ..schemas import AuthUserProfile, OfficialDepositRequest, ProgressivePathResponse
from ..services.progressive_path_service import (
    complete_candidate_progressive_path_step,
    declare_candidate_official_deposit,
    get_candidate_progressive_path,
    reopen_candidate_progressive_path_step,
    start_candidate_progressive_path_step,
)

router = APIRouter()


@router.get("/candidate/progressive-path", response_model=ProgressivePathResponse)
def candidate_progressive_path(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> ProgressivePathResponse:
    return get_candidate_progressive_path(current_user.user_id, access_token)


@router.post(
    "/candidate/progressive-path/steps/{step_id}/start",
    response_model=ProgressivePathResponse,
)
def start_candidate_progressive_step(
    step_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> ProgressivePathResponse:
    try:
        return start_candidate_progressive_path_step(
            current_user.user_id,
            step_id,
            access_token,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post(
    "/candidate/progressive-path/steps/{step_id}/complete",
    response_model=ProgressivePathResponse,
)
def complete_candidate_progressive_step(
    step_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> ProgressivePathResponse:
    try:
        return complete_candidate_progressive_path_step(
            current_user.user_id,
            step_id,
            access_token,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/candidate/progressive-path/steps/{step_id}/reopen",
    response_model=ProgressivePathResponse,
)
def reopen_candidate_progressive_step(
    step_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> ProgressivePathResponse:
    try:
        return reopen_candidate_progressive_path_step(
            current_user.user_id,
            step_id,
            access_token,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/candidate/progressive-path/official-deposit",
    response_model=ProgressivePathResponse,
)
def declare_official_deposit(
    body: OfficialDepositRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> ProgressivePathResponse:
    return declare_candidate_official_deposit(
        current_user.user_id,
        body,
        access_token,
    )
