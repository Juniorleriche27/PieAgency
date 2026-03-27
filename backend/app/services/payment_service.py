import logging
from typing import Any
from urllib.parse import quote

import httpx

from ..config import settings
from ..schemas import (
    PaymentConfigResponse,
    PaymentIntentCreateRequest,
    PaymentIntentCreateResponse,
    PaymentOperatorItem,
    PaymentStatusResponse,
)

logger = logging.getLogger(__name__)


class MakutaNotConfiguredError(RuntimeError):
    pass


class MakutaRequestError(RuntimeError):
    pass


def _resolve_url(url_or_path: str) -> str:
    value = url_or_path.strip()
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    if not settings.makuta_base_url:
        return value
    return f"{settings.makuta_base_url.rstrip('/')}/{value.lstrip('/')}"


def _request_timeout() -> float:
    return max(settings.makuta_request_timeout_seconds, 5.0)


def _safe_json(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        return {}
    return payload if isinstance(payload, dict) else {}


def _extract_value(payload: dict[str, Any], candidates: tuple[str, ...]) -> str | None:
    for key in candidates:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, (int, float)):
            return str(value)
    return None


def _build_headers(user_token: str | None = None) -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if settings.makuta_app_token:
        headers["App-Token"] = settings.makuta_app_token
    if user_token:
        headers["User-Token"] = user_token
    return headers


def _ensure_configured() -> None:
    if not settings.makuta_enabled:
        raise MakutaNotConfiguredError(
            "Makuta n'est pas configure. Renseignez le wallet, l'App-Token et l'endpoint de transaction.",
        )


def _authenticate_makuta(client: httpx.Client) -> str:
    if settings.makuta_user_token.strip():
        return settings.makuta_user_token.strip()

    login_url = _resolve_url(settings.makuta_login_url)
    if not login_url:
        raise MakutaNotConfiguredError(
            "Le login Makuta n'est pas configure. Ajoutez MAKUTA_LOGIN_URL ou MAKUTA_USER_TOKEN.",
        )
    if not settings.makuta_login_identity or not settings.makuta_login_password:
        raise MakutaNotConfiguredError(
            "Les identifiants Makuta ne sont pas configures.",
        )

    payload = {
        settings.makuta_login_identity_field: settings.makuta_login_identity,
        settings.makuta_login_password_field: settings.makuta_login_password,
    }

    try:
        response = client.post(
            login_url,
            headers=_build_headers(),
            json=payload,
            timeout=_request_timeout(),
        )
    except Exception as exc:  # pragma: no cover - network error path
        logger.exception("Makuta authentication failed")
        raise MakutaRequestError("Connexion impossible au service Makuta.") from exc

    data = _safe_json(response)
    if response.status_code >= 400:
        error_message = _extract_value(data, ("message", "detail", "error"))
        raise MakutaRequestError(
            error_message or "Authentification Makuta refusee.",
        )

    header_token = response.headers.get("User-Token") or response.headers.get("user-token")
    body_token = _extract_value(data, ("userToken", "user_token", "token", "accessToken"))
    token = (header_token or body_token or "").strip()
    if not token:
        raise MakutaRequestError("Makuta n'a pas retourne de User-Token exploitable.")

    return token


def _normalize_amount(amount: float) -> int | float:
    rounded = round(amount, 2)
    return int(rounded) if rounded.is_integer() else rounded


def _build_reason(payload: PaymentIntentCreateRequest) -> str:
    parts = [payload.reason.strip()]
    if payload.service_slug:
        parts.append(f"Service {payload.service_slug}")
    if payload.dossier_reference:
        parts.append(f"Ref {payload.dossier_reference.strip()}")
    return " | ".join(parts)


def get_payment_config() -> PaymentConfigResponse:
    instructions = (
        "Paiement en ligne via Makuta. Le montant doit correspondre a un montant deja valide "
        "avec un conseiller PieAgency."
    )
    if not settings.makuta_enabled:
        instructions = (
            "Le paiement en ligne n'est pas encore active. Ajoutez les identifiants Makuta "
            "dans l'environnement backend pour l'ouvrir au public."
        )

    return PaymentConfigResponse(
        enabled=settings.makuta_enabled,
        provider="makuta",
        merchant_label=settings.makuta_merchant_label,
        currency_options=settings.makuta_supported_currency_list,
        operator_options=[
            PaymentOperatorItem(code=code, label=label)
            for code, label in settings.makuta_operator_option_list
        ],
        instructions=instructions,
        status_check_enabled=bool(settings.makuta_status_url_template.strip()),
    )


def initiate_payment(payload: PaymentIntentCreateRequest) -> PaymentIntentCreateResponse:
    _ensure_configured()
    transaction_url = _resolve_url(settings.makuta_transaction_endpoint)
    if not transaction_url:
        raise MakutaNotConfiguredError(
            "L'endpoint de transaction Makuta est vide.",
        )

    client = httpx.Client()
    try:
        user_token = _authenticate_makuta(client)
        makuta_payload = {
            "wallet": settings.makuta_wallet_id,
            "walletOperation": settings.makuta_wallet_operation,
            "walletAmount": _normalize_amount(payload.amount),
            "clientOperator": payload.operator_code,
            "clientCurrency": payload.currency,
            "clientAccountNumber": payload.account_number,
            "reason": _build_reason(payload),
            "isPreview": False,
            "makeC2B": True,
        }

        response = client.post(
            transaction_url,
            headers=_build_headers(user_token),
            json=makuta_payload,
            timeout=_request_timeout(),
        )
    except MakutaRequestError:
        raise
    except Exception as exc:  # pragma: no cover - network error path
        logger.exception("Makuta payment initiation failed")
        raise MakutaRequestError("Impossible d'initier le paiement Makuta pour le moment.") from exc
    finally:
        client.close()

    data = _safe_json(response)
    if response.status_code >= 400:
        error_message = _extract_value(data, ("message", "detail", "error"))
        raise MakutaRequestError(error_message or "Makuta a refuse la demande de paiement.")

    transaction_id = _extract_value(
        data,
        (
            "financialTransactionId",
            "financial_transaction_id",
            "transactionId",
            "transaction_id",
            "id",
        ),
    )
    reference = _extract_value(
        data,
        ("reference", "externalReference", "clientReference", "traceId"),
    ) or payload.dossier_reference
    provider_status = _extract_value(
        data,
        ("status", "transactionStatus", "paymentStatus", "state"),
    )

    return PaymentIntentCreateResponse(
        provider="makuta",
        status="pending",
        message=(
            "La demande de paiement a ete envoyee. Verifiez votre telephone ou votre moyen "
            "de paiement pour confirmer l'operation."
        ),
        transaction_id=transaction_id,
        reference=reference,
        provider_status=provider_status,
        status_check_enabled=bool(settings.makuta_status_url_template.strip()),
    )


def fetch_payment_status(transaction_id: str) -> PaymentStatusResponse:
    _ensure_configured()
    template = settings.makuta_status_url_template.strip()
    if not template:
        return PaymentStatusResponse(
            provider="makuta",
            transaction_id=transaction_id,
            status="unknown",
            message="Le suivi automatique Makuta n'est pas configure.",
            provider_status=None,
            reference=None,
        )

    if "{transaction_id}" not in template:
        raise MakutaNotConfiguredError(
            "MAKUTA_STATUS_URL_TEMPLATE doit contenir {transaction_id}.",
        )

    status_url = _resolve_url(template.format(transaction_id=quote(transaction_id, safe="")))
    method = settings.makuta_status_http_method.strip().upper() or "GET"

    client = httpx.Client()
    try:
        user_token = _authenticate_makuta(client)
        response = client.request(
            method,
            status_url,
            headers=_build_headers(user_token),
            timeout=_request_timeout(),
        )
    except MakutaRequestError:
        raise
    except Exception as exc:  # pragma: no cover - network error path
        logger.exception("Makuta payment status lookup failed")
        raise MakutaRequestError("Impossible de verifier le statut du paiement.") from exc
    finally:
        client.close()

    data = _safe_json(response)
    if response.status_code >= 400:
        error_message = _extract_value(data, ("message", "detail", "error"))
        raise MakutaRequestError(error_message or "Makuta a refuse la verification du paiement.")

    provider_status = _extract_value(
        data,
        ("status", "transactionStatus", "paymentStatus", "state"),
    )
    normalized_status = "unknown"
    if provider_status:
        lowered = provider_status.lower()
        if any(token in lowered for token in ("success", "paid", "completed", "done")):
            normalized_status = "success"
        elif any(token in lowered for token in ("fail", "cancel", "reject", "error")):
            normalized_status = "failed"
        elif any(token in lowered for token in ("pending", "wait", "process", "initiated")):
            normalized_status = "pending"

    reference = _extract_value(
        data,
        ("reference", "externalReference", "clientReference", "traceId"),
    )
    message = _extract_value(data, ("message", "detail")) or "Statut Makuta recupere."

    return PaymentStatusResponse(
        provider="makuta",
        transaction_id=transaction_id,
        status=normalized_status,
        message=message,
        provider_status=provider_status,
        reference=reference,
    )
