from backend.app.routers import candidate


def test_candidate_assistant_route_delegates_to_bridge_service():
    assert candidate.generate_candidate_assistant_response.__module__.endswith("assistant_bridge_service")


def test_candidate_router_does_not_import_legacy_ai_service_for_private_assistant():
    source = open(candidate.__file__, encoding="utf-8").read()
    assert "services.ai_service import generate_candidate_assistant_response" not in source
    assert "services.assistant_bridge_service" in source
