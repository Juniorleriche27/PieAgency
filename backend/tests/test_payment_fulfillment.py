from unittest.mock import Mock, patch
from backend.app.schemas import PaymentStatusResponse
from backend.app.services.payment_fulfillment_service import fulfill_successful_payment

def payment(status="completed",service="prod-005"):
    return PaymentStatusResponse(provider="koryxa_pay",cart_id="pay-1",status=status,message="ok",payment_id="pay-1",service_slug=service,user_id="user-1",customer_email="u@example.com")

def test_pending_does_not_fulfill():
    assert fulfill_successful_payment(payment(status="waiting_payment"))["fulfilled"] is False

def test_product_fulfillment_delegates_to_idempotent_grant():
    with patch("backend.app.services.payment_fulfillment_service._resolve_user_id",return_value="user-1"), patch("backend.app.services.payment_fulfillment_service.grant_product_resource_entitlements",return_value=Mock(has_access=True)) as grant:
        out=fulfill_successful_payment(payment())
    assert out["kind"]=="product"
    grant.assert_called_once()

def test_subscription_fulfillment_delegates_to_payment_grant():
    with patch("backend.app.services.payment_fulfillment_service._resolve_user_id",return_value="user-1"), patch("backend.app.services.payment_fulfillment_service.list_private_subscriptions") as plans, patch("backend.app.services.payment_fulfillment_service.grant_subscription_after_payment") as grant:
        plans.return_value.plans=[Mock(id="standard-mensuel",service_slug="standard-mensuel",price=19.99)]
        out=fulfill_successful_payment(payment(service="standard-mensuel"))
    assert out["kind"]=="subscription"
    grant.assert_called_once()
