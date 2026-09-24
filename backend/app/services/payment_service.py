from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

import httpx

from ..config import settings
from ..schemas import PaymentConfigResponse, PaymentIntentCreateRequest, PaymentIntentCreateResponse, PaymentStatusResponse
from .private_catalog_service import PRODUCTS, list_private_subscriptions

logger = logging.getLogger(__name__)

class KoryxaPayNotConfiguredError(RuntimeError): pass
class KoryxaPayRequestError(RuntimeError): pass

def _headers() -> dict[str,str]:
    if not settings.koryxa_pay_enabled:
        raise KoryxaPayNotConfiguredError("KORYXA Pay n'est pas configure.")
    return {"X-Project-Code": settings.koryxa_pay_project_code, "X-Project-Key": settings.koryxa_pay_project_key, "Content-Type":"application/json"}

def _url(path: str) -> str:
    return settings.koryxa_pay_base_url.rstrip("/") + path

def _safe_json(response: httpx.Response) -> dict:
    try: data=response.json()
    except Exception: data={}
    return data if isinstance(data,dict) else {}

def _error(data: dict, fallback: str) -> str:
    err=data.get("error")
    if isinstance(err,dict) and err.get("message"): return str(err["message"])
    return fallback

def _normalize(status: str|None) -> str:
    return {"created":"waiting_payment","pending":"waiting_payment","succeeded":"completed","failed":"payment_failed","cancelled":"abandoned","refunded":"abandoned"}.get((status or "").lower(),"unknown")

def get_payment_config() -> PaymentConfigResponse:
    return PaymentConfigResponse(enabled=settings.koryxa_pay_enabled, provider="koryxa_pay", merchant_label=settings.koryxa_pay_merchant_label, display_currency=settings.koryxa_pay_display_currency, instructions="Paiement securise par KORYXA Pay.", status_check_enabled=settings.koryxa_pay_enabled)

def _eur_to_xof(value: float) -> int:
    return int((Decimal(str(value)) * Decimal("655.957")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

def _fixed_offer(service_slug: str | None):
    if not service_slug:
        return None
    for product in PRODUCTS:
        if service_slug in {product.service_slug, product.id}:
            amount = _eur_to_xof(product.price) if product.currency.upper() == "EUR" else int(Decimal(str(product.price)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
            return amount, product.title, f"Achat de {product.title} — PieAgency"
    try:
        plans = list_private_subscriptions().plans
    except Exception:
        plans = []
    for plan in plans:
        if service_slug in {plan.service_slug, plan.id} and plan.price > 0:
            amount = _eur_to_xof(plan.price) if plan.currency.upper() == "EUR" else int(Decimal(str(plan.price)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
            return amount, plan.title, f"Abonnement {plan.title} — PieAgency"
    return None

def initiate_payment(payload: PaymentIntentCreateRequest, user_id: str|None=None) -> PaymentIntentCreateResponse:
    fixed = _fixed_offer(payload.service_slug)
    if fixed:
        amount_minor, offer_title, description = fixed
    else:
        amount_minor=int((Decimal(str(payload.amount))*Decimal("1")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        offer_title = payload.reason.strip()
        description = (f"{offer_title} — PieAgency" if "PieAgency" not in offer_title else offer_title)[:255]
    product_code=(payload.service_slug or payload.dossier_reference or "pieagency-payment")[:120]
    customer_id=(user_id or payload.email)[:160]
    idem=f"pieagency-{product_code}-{customer_id}-{uuid4().hex}"
    body={"product_code":product_code,"description":description[:255],"customer_id":customer_id,"amount_minor":amount_minor,"currency":settings.koryxa_pay_display_currency,"idempotency_key":idem,"success_url":f"{settings.frontend_origin.rstrip('/')}/paiement?checkout=return","failure_url":f"{settings.frontend_origin.rstrip('/')}/paiement?checkout=failed","metadata":{"service_slug":payload.service_slug or "","dossier_reference":payload.dossier_reference or "","email":str(payload.email),"full_name":payload.full_name,"offer_title":offer_title,"pricing_mode":"fixed" if fixed else "custom"}}
    try: response=httpx.post(_url("/v1/client/checkouts"),headers=_headers(),json=body,timeout=settings.koryxa_pay_request_timeout_seconds)
    except Exception as exc: raise KoryxaPayRequestError("Impossible de joindre KORYXA Pay.") from exc
    data=_safe_json(response)
    if response.status_code>=400: raise KoryxaPayRequestError(_error(data,"KORYXA Pay a refuse la creation du paiement."))
    payment_id=str(data.get("payment_id") or "")
    if not payment_id: raise KoryxaPayRequestError("KORYXA Pay n'a pas retourne d'identifiant de paiement.")
    return PaymentIntentCreateResponse(provider="koryxa_pay",status=_normalize(data.get("payment_status")),message="Paiement KORYXA Pay cree.",cart_id=payment_id,redirect_url=data.get("checkout_url") or (_url(str(data["return_url"])) if data.get("return_url") else None),payment_id=payment_id,reference=str(data.get("order_id") or "") or None,status_check_enabled=True)

def fetch_payment_status(payment_id: str) -> PaymentStatusResponse:
    try: response=httpx.get(_url(f"/v1/client/payments/{payment_id}"),headers=_headers(),timeout=settings.koryxa_pay_request_timeout_seconds)
    except Exception as exc: raise KoryxaPayRequestError("Impossible de joindre KORYXA Pay.") from exc
    data=_safe_json(response)
    if response.status_code>=400: raise KoryxaPayRequestError(_error(data,"Impossible de verifier le paiement KORYXA Pay."))
    metadata=data.get("metadata") if isinstance(data.get("metadata"),dict) else {}
    resolved=str(data.get("payment_id") or payment_id)
    return PaymentStatusResponse(provider="koryxa_pay",cart_id=resolved,status=_normalize(data.get("payment_status") or data.get("status")),message="Statut KORYXA Pay verifie.",payment_id=resolved,reference=str(data.get("order_id") or "") or None,service_slug=str(metadata.get("service_slug") or "") or None,user_id=str(data.get("customer_id") or "") or None,customer_email=str(metadata.get("email") or "") or None)

def verify_webhook(raw_body: bytes, timestamp: str, signature: str) -> dict:
    if not settings.koryxa_pay_webhook_secret: raise KoryxaPayNotConfiguredError("Secret webhook KORYXA Pay absent.")
    try: ts=int(timestamp)
    except (TypeError,ValueError): raise KoryxaPayRequestError("Timestamp webhook invalide.")
    if abs(int(time.time())-ts)>300: raise KoryxaPayRequestError("Webhook KORYXA Pay expire.")
    expected="v1="+hmac.new(settings.koryxa_pay_webhook_secret.encode(),timestamp.encode()+b"."+raw_body,hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected,signature): raise KoryxaPayRequestError("Signature webhook KORYXA Pay invalide.")
    try: data=json.loads(raw_body)
    except Exception as exc: raise KoryxaPayRequestError("Payload webhook invalide.") from exc
    if not isinstance(data,dict) or data.get("event")!="payment.status.changed" or not data.get("payment_id"): raise KoryxaPayRequestError("Evenement webhook KORYXA Pay invalide.")
    return data
