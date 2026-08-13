from __future__ import annotations

from fastapi import Response

from ..config import settings
from ..schemas import AuthSessionResponse

ACCESS_COOKIE = "pieagency_access"
REFRESH_COOKIE = "pieagency_refresh"


def _secure_cookie() -> bool:
    return settings.environment.lower() not in {"development", "dev", "test", "testing"}


def set_auth_cookies(response: Response, session: AuthSessionResponse) -> None:
    common = {
        "httponly": True,
        "secure": _secure_cookie(),
        "samesite": "lax",
    }
    response.set_cookie(
        ACCESS_COOKIE,
        session.access_token,
        max_age=max(int(session.expires_in), 60),
        path="/api",
        **common,
    )
    response.set_cookie(
        REFRESH_COOKIE,
        session.refresh_token,
        max_age=settings.auth_refresh_cookie_max_age_seconds,
        path="/api/auth/web",
        **common,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/api")
    response.delete_cookie(REFRESH_COOKIE, path="/api/auth/web")
