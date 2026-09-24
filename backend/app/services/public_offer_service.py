from __future__ import annotations
from ..schemas import PublicOfferItem, PublicOfferListResponse
from .private_catalog_service import list_private_products, list_private_subscriptions

def list_public_offers() -> PublicOfferListResponse:
    offers=[]
    for p in list_private_products().products:
        offers.append(PublicOfferItem(id=p.id,kind="product",title=p.title,description=p.description,category=p.category,price=p.price,currency=p.currency,service_slug=p.service_slug,features=p.what_you_get,target_audience=p.target_audience,badge=p.badge,billing_period="one_time"))
    for p in list_private_subscriptions().plans:
        if not p.is_active or p.price <= 0: continue
        offers.append(PublicOfferItem(id=p.id,kind="subscription",title=p.title,description=p.description,category="Abonnement",price=p.price,currency=p.currency,service_slug=p.service_slug,features=p.features,badge="recommended" if p.recommended else None,billing_period=p.billing_period))
    return PublicOfferListResponse(offers=offers)

def get_public_offer(offer_id: str) -> PublicOfferItem:
    for offer in list_public_offers().offers:
        if offer.id == offer_id or offer.service_slug == offer_id:
            return offer
    raise LookupError("Offre introuvable.")
