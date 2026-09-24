from types import SimpleNamespace
from unittest.mock import Mock, patch

from backend.app.schemas import PaymentIntentCreateRequest
from backend.app.services import payment_service

def payload(**overrides):
    data=dict(full_name="Junior Test",email="test@example.com",phone="+22890000000",amount=1,service_slug="prod-001",dossier_reference="PIE-TEST",reason="Test")
    data.update(overrides)
    return PaymentIntentCreateRequest(**data)

def test_fixed_product_ignores_browser_amount_and_sends_description():
    response=Mock(status_code=201)
    response.json.return_value={"payment_id":"pay-1","order_id":"ord-1","payment_status":"pending","checkout_url":"https://pay.example"}
    with patch.object(payment_service.settings,"koryxa_pay_project_key","test-key"), patch.object(payment_service.settings,"koryxa_pay_webhook_secret","test-secret"), patch("backend.app.services.payment_service.httpx.post",return_value=response) as post:
        payment_service.initiate_payment(payload(amount=1))
    body=post.call_args.kwargs["json"]
    assert body["amount_minor"] == 19672  # 29.99 EUR at fixed XOF parity
    assert body["description"] == "Achat de Kit Campus France complet — PieAgency"
    assert body["metadata"]["pricing_mode"] == "fixed"

def test_custom_payment_keeps_agreed_amount_and_reason_description():
    response=Mock(status_code=201)
    response.json.return_value={"payment_id":"pay-2","order_id":"ord-2","payment_status":"pending","checkout_url":"https://pay.example"}
    with patch.object(payment_service.settings,"koryxa_pay_project_key","test-key"), patch.object(payment_service.settings,"koryxa_pay_webhook_secret","test-secret"), patch("backend.app.services.payment_service.httpx.post",return_value=response) as post:
        payment_service.initiate_payment(payload(service_slug="accompagnement-campus-france",amount=70000,reason="Acompte accompagnement Campus France"))
    body=post.call_args.kwargs["json"]
    assert body["amount_minor"] == 70000
    assert body["description"] == "Acompte accompagnement Campus France — PieAgency"
    assert body["metadata"]["pricing_mode"] == "custom"


def test_consultation_has_exact_fixed_price_and_scope_description():
    response=Mock(status_code=201)
    response.json.return_value={"payment_id":"pay-consult","order_id":"ord-consult","payment_status":"pending","checkout_url":"https://pay.example"}
    with patch.object(payment_service.settings,"koryxa_pay_project_key","test-key"), patch.object(payment_service.settings,"koryxa_pay_webhook_secret","test-secret"), patch("backend.app.services.payment_service.httpx.post",return_value=response) as post:
        payment_service.initiate_payment(payload(service_slug="consultation-orientation-1h",amount=1,reason="ignored browser amount"))
    body=post.call_args.kwargs["json"]
    assert body["amount_minor"] == 20000
    assert body["product_code"] == "consultation-orientation-1h"
    assert body["metadata"]["pricing_mode"] == "fixed"
    assert body["metadata"]["offer_title"] == "Consultation d’orientation — 1 h"
    assert "sans constitution de dossier" in body["description"]
    assert "lettre de motivation" in body["description"]
