import logging

from fastapi import APIRouter, HTTPException, status

from ..schemas import (
    ContactRequestCreate,
    ContactRequestResponse,
    PartnershipRequestCreate,
    PartnershipRequestResponse,
)
from ..services.contact_store import (
    SupabaseNotConfiguredError,
    store_contact_request,
    store_partnership_request,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/contact-requests",
    response_model=ContactRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_contact_request(payload: ContactRequestCreate) -> ContactRequestResponse:
    try:
        contact_id = store_contact_request(payload)
    except SupabaseNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to store contact request")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible d'enregistrer la demande pour le moment.",
        ) from exc

    return ContactRequestResponse(
        id=contact_id,
        status="stored",
        message="Votre demande a bien ete envoyee.",
    )


@router.post(
    "/partnership-requests",
    response_model=PartnershipRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_partnership_request(
    payload: PartnershipRequestCreate,
) -> PartnershipRequestResponse:
    try:
        request_id = store_partnership_request(payload)
    except SupabaseNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to store partnership request")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible d'enregistrer la demande de partenariat pour le moment.",
        ) from exc

    return PartnershipRequestResponse(
        id=request_id,
        status="stored",
        message="Votre demande de partenariat a bien ete envoyee.",
    )
