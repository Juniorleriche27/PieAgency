from __future__ import annotations

from datetime import UTC, datetime, timedelta

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
    if service in {"assistant-30d", "assistant-90d"}:
        days = 30 if service == "assistant-30d" else 90
        client = _client_or_none()
        if client is None: raise RuntimeError("Supabase indisponible.")
        claim = client.table("payment_access_claims").select("user_id,service_slug").eq("cart_id", payment.cart_id).limit(1).execute()
        if claim.data:
            existing = claim.data[0]
            if str(existing.get("user_id")) != str(user_id) or str(existing.get("service_slug")) != service:
                raise PermissionError("Ce paiement est déjà associé à un autre compte ou Pass Assistant.")
            return {"fulfilled":True,"kind":"assistant_pass","user_id":user_id,"service_slug":service,"idempotent":True}
        access = client.table("assistant_access").select("access_until").eq("user_id", user_id).limit(1).execute().data or []
        now = datetime.now(UTC)
        current_until = None
        if access and access[0].get("access_until"):
            current_until = datetime.fromisoformat(str(access[0]["access_until"]).replace("Z", "+00:00"))
        base = current_until if current_until and current_until > now else now
        access_until = base + timedelta(days=days)
        client.table("assistant_access").upsert({"user_id":user_id,"access_until":access_until.isoformat(),"plan_code":service}, on_conflict="user_id").execute()
        client.table("payment_access_claims").insert({"cart_id":payment.cart_id,"user_id":user_id,"service_slug":service,"payment_id":payment.payment_id,"provider":"koryxa_pay"}).execute()
        return {"fulfilled":True,"kind":"assistant_pass","user_id":user_id,"service_slug":service,"access_until":access_until.isoformat()}
    if any(service in {p.id,p.service_slug} for p in PRODUCTS):
        result=grant_product_resource_entitlements(user_id=user_id,service_slug=service,payment_provider="koryxa_pay",cart_id=payment.cart_id,payment_id=payment.payment_id)
        if not result.has_access: raise RuntimeError(result.message)
        return {"fulfilled":True,"kind":"product","user_id":user_id,"service_slug":service}
    plans=list_private_subscriptions().plans
    if any(service in {p.id,p.service_slug} and p.price>0 for p in plans):
        grant_subscription_after_payment(user_id=user_id,service_slug=service,payment_provider="koryxa_pay",cart_id=payment.cart_id,payment_id=payment.payment_id)
        return {"fulfilled":True,"kind":"subscription","user_id":user_id,"service_slug":service}
    return {"fulfilled":False,"reason":"service_not_entitlement_bearing"}
