import logging
from typing import Any
from urllib.parse import quote

import httpx

from ..config import settings
from ..schemas import (
    PaymentConfigResponse,
    PaymentIntentCreateRequest,
    PaymentIntentCreateResponse,
    PaymentStatusResponse,
)

logger = logging.getLogger(__name__)


class MaketouNotConfiguredError(RuntimeError):
    pass


class MaketouRequestError(RuntimeError):
    pass


def _resolve_url(url_or_path: str) -> str:
    value = url_or_path.strip()
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return f"{settings.maketou_base_url.rstrip('/')}/{value.lstrip('/')}"


def _request_timeout() -> float:
    return max(settings.maketou_request_timeout_seconds, 5.0)


def _safe_json(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        return {}
    return payload if isinstance(payload, dict) else {}


def _extract_string(payload: dict[str, Any], key: str) -> str | None:
    value = payload.get(key)
    if isinstance(value, str) and value.strip():
        return value.strip()
    if isinstance(value, (int, float)):
        return str(value)
    return None


def _split_full_name(full_name: str) -> tuple[str, str]:
    parts = [item for item in full_name.strip().split() if item]
    if not parts:
        return "Client", "PieAgency"
    if len(parts) == 1:
        return parts[0], parts[0]
    return parts[0], " ".join(parts[1:])


def _build_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.maketou_api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _ensure_configured() -> None:
    if not settings.maketou_enabled:
        raise MaketouNotConfiguredError(
            "MakeTou n'est pas configure. Ajoutez la cle API et le productDocumentId dans Render.",
        )


def _resolve_product_document_id(service_slug: str | None) -> str:
    if service_slug:
        service_product = settings.maketou_service_product_map.get(service_slug)
        if service_product:
            return service_product

    if settings.maketou_default_product_document_id.strip():
        return settings.maketou_default_product_document_id.strip()

    raise MaketouNotConfiguredError(
        "Aucun productDocumentId MakeTou n'est configure pour ce paiement.",
    )


def _normalize_amount(amount: float) -> int | float:
    rounded = round(amount, 2)
    return int(rounded) if rounded.is_integer() else rounded


def _build_checkout_meta(payload: PaymentIntentCreateRequest) -> dict[str, str]:
    meta = {
        "source": "pieagency-website",
        "reason": payload.reason.strip(),
    }
    if payload.service_slug:
        meta["serviceSlug"] = payload.service_slug
    if payload.dossier_reference:
        meta["dossierReference"] = payload.dossier_reference
    return meta


def _extract_reference(payload: dict[str, Any]) -> str | None:
    meta = payload.get("meta")
    if isinstance(meta, dict):
        reference = meta.get("dossierReference")
        if isinstance(reference, str) and reference.strip():
            return reference.strip()
    return None


def _normalize_status(raw_status: str | None) -> str:
    if raw_status in {"waiting_payment", "completed", "abandoned", "payment_failed"}:
        return raw_status
    return "unknown"


def get_payment_config() -> PaymentConfigResponse:
    instructions = (
        "Paiement en ligne via MakeTou. Le client saisit uniquement un montant deja valide "
        "avec un conseiller PieAgency. Le produit MakeTou utilise doit etre configure en Prix libre."
    )
    if not settings.maketou_enabled:
        instructions = (
            "Le paiement en ligne n'est pas encore actif. Ajoutez la cle API MakeTou et un "
            "productDocumentId configure en Prix libre dans l'environnement backend."
        )

    return PaymentConfigResponse(
        enabled=settings.maketou_enabled,
        provider="maketou",
        merchant_label=settings.maketou_merchant_label,
        display_currency=settings.maketou_display_currency.strip().upper() or "XOF",
        instructions=instructions,
        status_check_enabled=settings.maketou_enabled
        and bool(settings.maketou_cart_status_endpoint_template),
    )


def initiate_payment(payload: PaymentIntentCreateRequest) -> PaymentIntentCreateResponse:
    _ensure_configured()
    checkout_url = settings.maketou_checkout_endpoint
    product_document_id = _resolve_product_document_id(payload.service_slug)
    first_name, last_name = _split_full_name(payload.full_name)

    checkout_payload = {
        "productDocumentId": product_document_id,
        "email": payload.email,
        "firstName": first_name,
        "lastName": last_name,
        "phone": payload.phone,
        "redirectURL": settings.maketou_return_url,
        "customerPrice": _normalize_amount(payload.amount),
        "meta": _build_checkout_meta(payload),
    }

    try:
        response = httpx.post(
            _resolve_url(checkout_url),
            headers=_build_headers(),
            json=checkout_payload,
            timeout=_request_timeout(),
        )
    except Exception as exc:  # pragma: no cover - network error path
        logger.exception("MakeTou checkout initiation failed")
        raise MaketouRequestError("Impossible d'initier le paiement MakeTou.") from exc

    data = _safe_json(response)
    if response.status_code >= 400:
        message = _extract_string(data, "message") or "MakeTou a refuse la creation du panier."
        raise MaketouRequestError(message)

    cart = data.get("cart")
    cart_payload = cart if isinstance(cart, dict) else {}
    raw_status = _extract_string(cart_payload, "status")
    cart_id = _extract_string(cart_payload, "id")
    payment_id = _extract_string(cart_payload, "paymentId")
    redirect_url = _extract_string(data, "redirectUrl")

    return PaymentIntentCreateResponse(
        provider="maketou",
        status=_normalize_status(raw_status),
        message=(
            "Le panier MakeTou a ete cree. Vous allez maintenant etre redirige vers la page "
            "de paiement pour finaliser l'operation."
        ),
        cart_id=cart_id,
        redirect_url=redirect_url,
        payment_id=payment_id,
        reference=payload.dossier_reference,
        status_check_enabled=settings.maketou_enabled
        and bool(settings.maketou_cart_status_endpoint_template),
    )


def fetch_payment_status(cart_id: str) -> PaymentStatusResponse:
    _ensure_configured()
    template = settings.maketou_cart_status_endpoint_template
    if "{cart_id}" not in template:
        raise MaketouNotConfiguredError(
            "MAKETOU_CART_STATUS_URL_TEMPLATE doit contenir {cart_id}.",
        )

    status_url = _resolve_url(template.format(cart_id=quote(cart_id, safe="")))
    try:
        response = httpx.get(
            status_url,
            headers=_build_headers(),
            timeout=_request_timeout(),
        )
    except Exception as exc:  # pragma: no cover - network error path
        logger.exception("MakeTou cart status lookup failed")
        raise MaketouRequestError("Impossible de verifier le statut du panier MakeTou.") from exc

    data = _safe_json(response)
    if response.status_code >= 400:
        message = _extract_string(data, "message") or "MakeTou a refuse la verification du panier."
        raise MaketouRequestError(message)

    raw_status = _extract_string(data, "status")
    payment_id = _extract_string(data, "paymentId")
    reference = _extract_reference(data)

    return PaymentStatusResponse(
        provider="maketou",
        cart_id=cart_id,
        status=_normalize_status(raw_status),
        message="Statut du panier MakeTou recupere.",
        payment_id=payment_id,
        reference=reference,
    )
