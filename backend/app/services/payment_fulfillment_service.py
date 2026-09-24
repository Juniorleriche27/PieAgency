from __future__ import annotations

from ..schemas import PaymentStatusResponse
from .dashboard_service import _client_or_none
from .private_catalog_service import PRODUCTS, grant_product_resource_entitlements, grant_subscription_after_payment, list_private_subscriptions

def _resolve_user_id(payment: PaymentStatusResponse) -> str:
    client=_client_or_none()
    if client is None: raise RuntimeError("Supabase indisponible.")
    customer=(payment.user_id or "").strip()
    # Authenticated checkouts use the Supabase user UUID directly. Verify it exists.
    if customer and "@" not in customer:
        rows=client.table("profiles").select("user_id").eq("user_id",customer).limit(1).execute().data or []
        if rows: return str(rows[0]["user_id"])
    email=(payment.customer_email or (customer if "@" in customer else "")).strip().lower()
    if not email: raise LookupError("Propriétaire du paiement introuvable.")
    rows=client.table("profiles").select("user_id,email").eq("email",email).limit(2).execute().data or []
    if len(rows)!=1: raise LookupError("Propriétaire du paiement introuvable ou ambigu.")
    return str(rows[0]["user_id"])

def fulfill_successful_payment(payment: PaymentStatusResponse) -> dict:
    if payment.status != "completed": return {"fulfilled":False,"reason":"payment_not_completed"}
    if not payment.payment_id or not payment.service_slug: raise LookupError("Paiement incomplet pour attribution.")
    user_id=_resolve_user_id(payment)
    service=payment.service_slug
    if any(service in {p.id,p.service_slug} for p in PRODUCTS):
        result=grant_product_resource_entitlements(user_id=user_id,service_slug=service,payment_provider="koryxa_pay",cart_id=payment.cart_id,payment_id=payment.payment_id)
        if not result.has_access: raise RuntimeError(result.message)
        return {"fulfilled":True,"kind":"product","user_id":user_id,"service_slug":service}
    plans=list_private_subscriptions().plans
    if any(service in {p.id,p.service_slug} and p.price>0 for p in plans):
        grant_subscription_after_payment(user_id=user_id,service_slug=service,payment_provider="koryxa_pay",cart_id=payment.cart_id,payment_id=payment.payment_id)
        return {"fulfilled":True,"kind":"subscription","user_id":user_id,"service_slug":service}
    return {"fulfilled":False,"reason":"service_not_entitlement_bearing"}
