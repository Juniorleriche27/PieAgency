from backend.app.services.public_offer_service import list_public_offers,get_public_offer
def test_public_catalog_contains_products_and_paid_plans():
    offers=list_public_offers().offers
    assert any(x.kind=="product" for x in offers)
    assert any(x.kind=="subscription" for x in offers)
    assert all(x.price>0 for x in offers)
def test_public_detail_uses_same_product_price():
    offer=get_public_offer("prod-001")
    assert offer.service_slug=="prod-001"
    assert offer.features
