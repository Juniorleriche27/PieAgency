import logging

from supabase_auth.types import Session, User

from ..config import settings
from ..schemas import (
    AuthSessionResponse,
    AuthSignInRequest,
    AuthSignUpRequest,
    AuthSignUpResponse,
    AuthUserProfile,
    PlatformRole,
)
from .supabase_service import get_supabase_client

logger = logging.getLogger(__name__)


class AuthServiceError(RuntimeError):
    pass


class InvalidCredentialsError(AuthServiceError):
    pass


class InvalidTokenError(AuthServiceError):
    pass


class InactiveProfileError(AuthServiceError):
    pass


def _public_error_message(exc: Exception, fallback: str) -> str:
    message = str(exc).strip()
    return message or fallback


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _email_confirmation_redirect_url() -> str:
    return f"{settings.frontend_origin.rstrip('/')}/connexion?mode=signin&confirmed=1"


def _determine_role(email: str | None, existing_role: str | None = None) -> PlatformRole:
    normalized_email = (email or "").strip().lower()
    if normalized_email and normalized_email in settings.admin_email_list:
        return PlatformRole.ADMIN

    if existing_role == PlatformRole.ADMIN.value:
        return PlatformRole.ADMIN

    return PlatformRole.STUDENT


def _profile_from_row(row: dict) -> AuthUserProfile:
    return AuthUserProfile(
        user_id=str(row.get("user_id", "")),
        email=row.get("email"),
        full_name=row.get("full_name"),
        phone=row.get("phone"),
        country=row.get("country"),
        role=PlatformRole(str(row.get("role", PlatformRole.STUDENT.value))),
        is_active=bool(row.get("is_active", True)),
    )


def _profile_from_user(user: User, existing_row: dict | None = None) -> AuthUserProfile:
    metadata = user.user_metadata or {}
    role = _determine_role(user.email, (existing_row or {}).get("role"))
    return AuthUserProfile(
        user_id=user.id,
        email=_normalize_optional_text(user.email),
        full_name=_normalize_optional_text(
            metadata.get("full_name") or (existing_row or {}).get("full_name"),
        ),
        phone=_normalize_optional_text(
            metadata.get("phone") or user.phone or (existing_row or {}).get("phone"),
        ),
        country=_normalize_optional_text(
            metadata.get("country") or (existing_row or {}).get("country"),
        ),
        role=role,
        is_active=bool((existing_row or {}).get("is_active", True)),
    )


def _profile_payload(user: User, existing_row: dict | None = None) -> dict:
    metadata = user.user_metadata or {}
    role = _determine_role(user.email, (existing_row or {}).get("role"))
    return {
        "user_id": user.id,
        "email": _normalize_optional_text(user.email),
        "full_name": _normalize_optional_text(
            metadata.get("full_name") or (existing_row or {}).get("full_name"),
        ),
        "phone": _normalize_optional_text(
            metadata.get("phone") or user.phone or (existing_row or {}).get("phone"),
        ),
        "country": _normalize_optional_text(
            metadata.get("country") or (existing_row or {}).get("country"),
        ),
        "role": role.value,
        "is_active": bool((existing_row or {}).get("is_active", True)),
    }


def _load_profile_row(client, user_id: str) -> dict | None:
    try:
        response = client.table("profiles").select("*").eq("user_id", user_id).limit(1).execute()
    except Exception:
        logger.exception("Unable to load profile row from Supabase")
        return None

    data = response.data or []
    return data[0] if data else None


def _needs_profile_upsert(existing_row: dict | None, payload: dict) -> bool:
    if not existing_row:
        return True

    tracked_fields = ("email", "full_name", "phone", "country", "role", "is_active")
    return any(existing_row.get(field) != payload.get(field) for field in tracked_fields)


def _sync_profile(client, user: User) -> AuthUserProfile:
    existing_row = _load_profile_row(client, user.id)
    payload = _profile_payload(user, existing_row)

    if existing_row and not _needs_profile_upsert(existing_row, payload):
        return _profile_from_row(existing_row)

    try:
        response = client.table("profiles").upsert(payload, on_conflict="user_id").execute()
    except Exception:
        logger.exception("Unable to upsert profile row in Supabase")
        return _profile_from_user(user, existing_row)

    data = response.data or []
    row = data[0] if data else payload
    return _profile_from_row(row)


def _build_session_response(session: Session, profile: AuthUserProfile) -> AuthSessionResponse:
    return AuthSessionResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
        expires_at=session.expires_at,
        token_type=session.token_type,
        user=profile,
    )


def sign_up_user(payload: AuthSignUpRequest) -> AuthSignUpResponse:
    auth_client = get_supabase_client()

    try:
        auth_response = auth_client.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
                "options": {
                    "email_redirect_to": _email_confirmation_redirect_url(),
                    "data": {
                        "full_name": payload.full_name,
                        "phone": payload.phone,
                        "country": payload.country,
                    },
                },
            },
        )
    except Exception as exc:
        logger.exception("Unable to sign up user")
        raise InvalidCredentialsError(
            _public_error_message(exc, "Impossible de creer le compte pour le moment."),
        ) from exc

    if auth_response.user is None:
        raise AuthServiceError("Supabase did not return the created user.")

    profile_client = get_supabase_client(auth_response.session.access_token) if auth_response.session else auth_client
    profile = _sync_profile(profile_client, auth_response.user)

    if auth_response.session is None:
        return AuthSignUpResponse(
            status="pending_confirmation",
            message="Compte cree. Verifiez votre email pour confirmer l'adresse avant la connexion.",
            user=profile,
        )

    if not profile.is_active:
        raise InactiveProfileError("Ce compte est desactive.")

    return AuthSignUpResponse(
        status="ok",
        message="Compte cree avec succes.",
        session=_build_session_response(auth_response.session, profile),
        user=profile,
    )


def sign_in_user(payload: AuthSignInRequest) -> AuthSessionResponse:
    auth_client = get_supabase_client()

    try:
        auth_response = auth_client.auth.sign_in_with_password(
            {
                "email": payload.email,
                "password": payload.password,
            },
        )
    except Exception as exc:
        raise InvalidCredentialsError(
            _public_error_message(exc, "Email ou mot de passe invalide."),
        ) from exc

    if auth_response.session is None or auth_response.user is None:
        raise InvalidCredentialsError("Session introuvable apres la connexion.")

    profile_client = get_supabase_client(auth_response.session.access_token)
    profile = _sync_profile(profile_client, auth_response.user)
    if not profile.is_active:
        raise InactiveProfileError("Ce compte est desactive.")

    return _build_session_response(auth_response.session, profile)


def refresh_user_session(refresh_token: str) -> AuthSessionResponse:
    auth_client = get_supabase_client()

    try:
        auth_response = auth_client.auth.refresh_session(refresh_token)
    except Exception as exc:
        raise InvalidTokenError(
            _public_error_message(exc, "Session expiree ou refresh token invalide."),
        ) from exc

    if auth_response.session is None:
        raise InvalidTokenError("Session introuvable apres le refresh.")

    profile_client = get_supabase_client(auth_response.session.access_token)
    profile = _sync_profile(profile_client, auth_response.session.user)
    if not profile.is_active:
        raise InactiveProfileError("Ce compte est desactive.")

    return _build_session_response(auth_response.session, profile)


def get_current_user_profile(access_token: str) -> AuthUserProfile:
    client = get_supabase_client(access_token)

    try:
        user_response = client.auth.get_user(access_token)
    except Exception as exc:
        raise InvalidTokenError(
            _public_error_message(exc, "Session invalide ou expiree."),
        ) from exc

    if user_response is None or user_response.user is None:
        raise InvalidTokenError("Utilisateur introuvable pour ce token.")

    profile = _sync_profile(client, user_response.user)
    if not profile.is_active:
        raise InactiveProfileError("Ce compte est desactive.")

    return profile
