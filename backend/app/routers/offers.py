from fastapi import APIRouter, HTTPException
from ..schemas import PublicOfferItem, PublicOfferListResponse
from ..services.public_offer_service import get_public_offer, list_public_offers
router=APIRouter()
@router.get("/offers",response_model=PublicOfferListResponse)
def public_offers()->PublicOfferListResponse: return list_public_offers()
@router.get("/offers/{offer_id}",response_model=PublicOfferItem)
def public_offer(offer_id:str)->PublicOfferItem:
    try: return get_public_offer(offer_id)
    except LookupError as exc: raise HTTPException(status_code=404,detail=str(exc)) from exc
