from fastapi import Depends, Header, HTTPException, Request, status

from ..schemas import AuthUserProfile, PlatformRole
from ..services.auth_service import (
    InactiveProfileError,
    InvalidTokenError,
    get_current_user_profile,
)
from ..security.session_cookies import ACCESS_COOKIE


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip() or None


def get_optional_access_token(
    request: Request,
    authorization: str | None = Header(default=None),
) -> str | None:
    bearer_token = _extract_bearer_token(authorization)
    if bearer_token:
        return bearer_token
    return request.cookies.get(ACCESS_COOKIE)


def get_optional_current_user(
    access_token: str | None = Depends(get_optional_access_token),
) -> AuthUserProfile | None:
    if not access_token:
        return None

    try:
        return get_current_user_profile(access_token)
    except (InactiveProfileError, InvalidTokenError):
        return None


def get_optional_authenticated_access_token(
    access_token: str | None = Depends(get_optional_access_token),
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
) -> str | None:
    return access_token if current_user is not None else None


def get_current_user(
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
) -> AuthUserProfile:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise.",
        )
    return current_user


def get_current_access_token(
    access_token: str | None = Depends(get_optional_access_token),
) -> str:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise.",
        )
    return access_token


def require_admin_user(
    current_user: AuthUserProfile = Depends(get_current_user),
) -> AuthUserProfile:
    if current_user.role != PlatformRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acces admin requis.",
        )
    return current_user
