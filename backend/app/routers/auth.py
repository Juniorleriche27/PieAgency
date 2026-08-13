from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from ..config import settings
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
    SSOAuthorizeRequest,
    SSOAuthorizeResponse,
    SSOExchangeRequest,
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
from ..services.sso_service import SSOServiceError, consume_authorization_code, issue_authorization_code
from ..security.session_cookies import REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies

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


@router.post("/auth/web/sign-in", response_model=AuthUserProfile)
def web_sign_in(payload: AuthSignInRequest, response: Response) -> AuthUserProfile:
    try:
        session = sign_in_user(payload)
        set_auth_cookies(response, session)
        return session.user
    except (AuthServiceError, SupabaseConfigurationError) as exc:
        raise _handle_auth_error(exc) from exc


@router.post("/auth/web/sign-up")
def web_sign_up(payload: AuthSignUpRequest, response: Response) -> dict:
    try:
        result = sign_up_user(payload)
        authenticated = result.session is not None
        if result.session is not None:
            set_auth_cookies(response, result.session)
        return {
            "status": result.status,
            "message": result.message,
            "authenticated": authenticated,
            "user": result.user,
        }
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


@router.post("/auth/web/refresh", response_model=AuthUserProfile)
def web_refresh_session(request: Request, response: Response) -> AuthUserProfile:
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if not refresh_token:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session web absente ou expiree.",
        )
    try:
        session = refresh_user_session(refresh_token)
        set_auth_cookies(response, session)
        return session.user
    except (AuthServiceError, SupabaseConfigurationError) as exc:
        clear_auth_cookies(response)
        raise _handle_auth_error(exc) from exc


@router.post("/auth/web/logout", response_model=AuthMessageResponse)
def web_logout(response: Response) -> AuthMessageResponse:
    clear_auth_cookies(response)
    return AuthMessageResponse(message="Session fermee.")


@router.post("/auth/sso/authorize", response_model=SSOAuthorizeResponse)
def sso_authorize(
    payload: SSOAuthorizeRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
) -> SSOAuthorizeResponse:
    try:
        code = issue_authorization_code(
            client_id=payload.client_id,
            redirect_uri=payload.redirect_uri,
            user=current_user,
        )
        return SSOAuthorizeResponse(
            code=code,
            expires_in=settings.sso_authorization_code_ttl_seconds,
        )
    except (SSOServiceError, SupabaseConfigurationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/auth/sso/exchange", response_model=AuthUserProfile)
def sso_exchange(payload: SSOExchangeRequest) -> AuthUserProfile:
    try:
        return consume_authorization_code(
            code=payload.code,
            client_id=payload.client_id,
            client_secret=payload.client_secret,
            redirect_uri=payload.redirect_uri,
        )
    except SSOServiceError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except SupabaseConfigurationError as exc:
        raise _handle_auth_error(exc) from exc


@router.get("/auth/me", response_model=AuthUserProfile)
def current_user_profile(current_user: AuthUserProfile = Depends(get_current_user)) -> AuthUserProfile:
    return current_user
