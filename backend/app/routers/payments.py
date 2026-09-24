import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from ..dependencies.auth import get_optional_current_user
from ..schemas import AuthUserProfile

from ..schemas import (
    PaymentConfigResponse,
    PaymentIntentCreateRequest,
    PaymentIntentCreateResponse,
    PaymentReceiptRequest,
    PaymentStatusResponse,
)
from ..services.email_service import send_payment_receipt
from ..services.payment_fulfillment_service import fulfill_successful_payment
from ..services.payment_service import (
    KoryxaPayNotConfiguredError,
    KoryxaPayRequestError,
    fetch_payment_status,
    get_payment_config,
    initiate_payment,
    verify_webhook,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/payments/config",
    response_model=PaymentConfigResponse,
)
def read_payment_config() -> PaymentConfigResponse:
    return get_payment_config()


@router.post(
    "/payments/koryxa/checkout",
    response_model=PaymentIntentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_checkout(
    payload: PaymentIntentCreateRequest,
    current_user: AuthUserProfile | None = Depends(get_optional_current_user),
) -> PaymentIntentCreateResponse:
    try:
        return initiate_payment(payload, current_user.user_id if current_user else None)
    except KoryxaPayNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except KoryxaPayRequestError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to initiate KORYXA Pay payment")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible d'initier le paiement pour le moment.",
        ) from exc


@router.get(
    "/payments/koryxa/{cart_id}",
    response_model=PaymentStatusResponse,
)
def get_payment_cart_status(cart_id: str) -> PaymentStatusResponse:
    try:
        return fetch_payment_status(cart_id)
    except KoryxaPayNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except KoryxaPayRequestError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to fetch KORYXA Pay cart status")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible de verifier le statut du paiement pour le moment.",
        ) from exc


@router.post("/payments/receipt", status_code=status.HTTP_202_ACCEPTED)
def send_receipt(payload: PaymentReceiptRequest) -> dict:
    sent = send_payment_receipt(
        to_email=payload.email,
        full_name=payload.full_name,
        amount=payload.amount,
        currency=payload.currency,
        service_label=payload.service_label,
        reference=payload.reference,
        payment_id=payload.payment_id,
    )
    return {"sent": sent}


@router.post("/payments/koryxa/callback")
async def koryxa_pay_callback(request: Request) -> dict:
    raw_body = await request.body()
    try:
        event = verify_webhook(raw_body, request.headers.get("x-koryxa-timestamp", ""), request.headers.get("x-koryxa-signature", ""))
        payment = fetch_payment_status(str(event["payment_id"]))
        fulfillment = fulfill_successful_payment(payment)
    except KoryxaPayNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except KoryxaPayRequestError as exc:
        raise HTTPException(status_code=401 if "Signature" in str(exc) or "Timestamp" in str(exc) or "expire" in str(exc) else 503, detail=str(exc)) from exc
    except (LookupError, PermissionError, RuntimeError) as exc:
        logger.exception("Unable to fulfill confirmed KORYXA Pay payment")
        raise HTTPException(status_code=503, detail="Paiement confirmé mais attribution en attente de reprise.") from exc
    return {"accepted": True, "event_id": request.headers.get("x-koryxa-event-id"), "payment_id": payment.payment_id, "status": payment.status, "fulfillment": fulfillment}
