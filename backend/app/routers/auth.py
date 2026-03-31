from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies.auth import get_current_user
from ..schemas import (
    AuthForgotPasswordRequest,
    AuthMessageResponse,
    AuthRefreshRequest,
    AuthResetPasswordRequest,
    AuthSessionResponse,
    AuthSignInRequest,
    AuthSignUpRequest,
    AuthSignUpResponse,
    AuthUserProfile,
)
from ..services.auth_service import (
    AuthServiceError,
    InactiveProfileError,
    InvalidCredentialsError,
    InvalidTokenError,
    request_password_reset,
    refresh_user_session,
    reset_user_password,
    sign_in_user,
    sign_up_user,
)
from ..services.supabase_service import SupabaseConfigurationError

router = APIRouter()


def _handle_auth_error(exc: Exception) -> HTTPException:
    if isinstance(exc, InvalidCredentialsError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if isinstance(exc, InactiveProfileError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    if isinstance(exc, InvalidTokenError):
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    if isinstance(exc, SupabaseConfigurationError):
        return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Erreur interne pendant l'authentification.",
    )


@router.post("/auth/sign-up", response_model=AuthSignUpResponse, status_code=status.HTTP_201_CREATED)
def sign_up(payload: AuthSignUpRequest) -> AuthSignUpResponse:
    try:
        return sign_up_user(payload)
    except (AuthServiceError, SupabaseConfigurationError) as exc:
        raise _handle_auth_error(exc) from exc


@router.post("/auth/sign-in", response_model=AuthSessionResponse)
def sign_in(payload: AuthSignInRequest) -> AuthSessionResponse:
    try:
        return sign_in_user(payload)
    except (AuthServiceError, SupabaseConfigurationError) as exc:
        raise _handle_auth_error(exc) from exc


@router.post("/auth/forgot-password", response_model=AuthMessageResponse)
def forgot_password(payload: AuthForgotPasswordRequest) -> AuthMessageResponse:
    try:
        return request_password_reset(payload)
    except (AuthServiceError, SupabaseConfigurationError) as exc:
        raise _handle_auth_error(exc) from exc


@router.post("/auth/reset-password", response_model=AuthMessageResponse)
def reset_password(payload: AuthResetPasswordRequest) -> AuthMessageResponse:
    try:
        return reset_user_password(payload)
    except (AuthServiceError, SupabaseConfigurationError) as exc:
        raise _handle_auth_error(exc) from exc


@router.post("/auth/refresh", response_model=AuthSessionResponse)
def refresh_session(payload: AuthRefreshRequest) -> AuthSessionResponse:
    try:
        return refresh_user_session(payload.refresh_token)
    except (AuthServiceError, SupabaseConfigurationError) as exc:
        raise _handle_auth_error(exc) from exc


@router.get("/auth/me", response_model=AuthUserProfile)
def current_user_profile(current_user: AuthUserProfile = Depends(get_current_user)) -> AuthUserProfile:
    return current_user
