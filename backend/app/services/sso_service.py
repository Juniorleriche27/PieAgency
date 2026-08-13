from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from ..config import settings
from ..schemas import AuthUserProfile
from .supabase_service import get_supabase_client


class SSOServiceError(RuntimeError):
    pass


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _validate_client(client_id: str, redirect_uri: str) -> None:
    if client_id != settings.assistant_sso_client_id:
        raise SSOServiceError("Unknown SSO client.")
    if redirect_uri != settings.assistant_sso_redirect_uri:
        raise SSOServiceError("Invalid SSO redirect URI.")


def issue_authorization_code(
    *,
    client_id: str,
    redirect_uri: str,
    user: AuthUserProfile,
) -> str:
    _validate_client(client_id, redirect_uri)
    if not user.is_active:
        raise SSOServiceError("Inactive account.")

    code = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=settings.sso_authorization_code_ttl_seconds
    )
    payload = {
        "code_hash": _hash_code(code),
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "user_id": user.user_id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "country": user.country,
        "role": user.role.value,
        "is_active": user.is_active,
        "expires_at": expires_at.isoformat(),
    }
    get_supabase_client().table("sso_authorization_codes").insert(payload).execute()
    return code


def consume_authorization_code(
    *,
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> AuthUserProfile:
    _validate_client(client_id, redirect_uri)
    if not settings.assistant_sso_client_secret or not secrets.compare_digest(
        client_secret,
        settings.assistant_sso_client_secret,
    ):
        raise SSOServiceError("Invalid SSO client credentials.")

    response = get_supabase_client().rpc(
        "consume_sso_authorization_code",
        {
            "p_code_hash": _hash_code(code),
            "p_client_id": client_id,
            "p_redirect_uri": redirect_uri,
        },
    ).execute()
    rows = response.data or []
    if not rows:
        raise SSOServiceError("Authorization code invalid, expired, or already used.")
    return AuthUserProfile.model_validate(rows[0])
