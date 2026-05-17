from fastapi import APIRouter, Depends

from ..dependencies.auth import get_current_access_token, get_current_user
from ..schemas import AuthUserProfile, ProgressivePathResponse
from ..services.progressive_path_service import get_candidate_progressive_path

router = APIRouter()


@router.get("/candidate/progressive-path", response_model=ProgressivePathResponse)
def candidate_progressive_path(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> ProgressivePathResponse:
    return get_candidate_progressive_path(current_user.user_id, access_token)
