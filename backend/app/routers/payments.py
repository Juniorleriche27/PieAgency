import logging

from fastapi import APIRouter, HTTPException, status

from ..schemas import (
    PaymentConfigResponse,
    PaymentIntentCreateRequest,
    PaymentIntentCreateResponse,
    PaymentStatusResponse,
)
from ..services.payment_service import (
    MaketouNotConfiguredError,
    MaketouRequestError,
    fetch_payment_status,
    get_payment_config,
    initiate_payment,
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
    "/payments/maketou/checkout",
    response_model=PaymentIntentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_checkout(
    payload: PaymentIntentCreateRequest,
) -> PaymentIntentCreateResponse:
    try:
        return initiate_payment(payload)
    except MaketouNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except MaketouRequestError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to initiate MakeTou payment")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible d'initier le paiement pour le moment.",
        ) from exc


@router.get(
    "/payments/maketou/carts/{cart_id}",
    response_model=PaymentStatusResponse,
)
def get_payment_cart_status(cart_id: str) -> PaymentStatusResponse:
    try:
        return fetch_payment_status(cart_id)
    except MaketouNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except MaketouRequestError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to fetch MakeTou cart status")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible de verifier le statut du paiement pour le moment.",
        ) from exc
