import logging

from fastapi import APIRouter, HTTPException, status

from ..schemas import (
    PaymentConfigResponse,
    PaymentIntentCreateRequest,
    PaymentIntentCreateResponse,
    PaymentStatusResponse,
)
from ..services.payment_service import (
    MakutaNotConfiguredError,
    MakutaRequestError,
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
    "/payments/makuta/transactions",
    response_model=PaymentIntentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_transaction(
    payload: PaymentIntentCreateRequest,
) -> PaymentIntentCreateResponse:
    try:
        return initiate_payment(payload)
    except MakutaNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except MakutaRequestError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to initiate Makuta payment")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible d'initier le paiement pour le moment.",
        ) from exc


@router.get(
    "/payments/makuta/transactions/{transaction_id}",
    response_model=PaymentStatusResponse,
)
def get_payment_transaction_status(transaction_id: str) -> PaymentStatusResponse:
    try:
        return fetch_payment_status(transaction_id)
    except MakutaNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except MakutaRequestError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to fetch Makuta payment status")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible de verifier le statut du paiement pour le moment.",
        ) from exc
