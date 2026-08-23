from fastapi.testclient import TestClient

from backend.app.dependencies.auth import get_current_access_token, get_current_user
from backend.app.main import app
from backend.app.routers import candidate as candidate_router
from backend.app.schemas import AuthUserProfile
from backend.app.services.progressive_path_service import _fallback_path


USER = AuthUserProfile(user_id="candidate-http-test", email="student@example.com")


def _client():
    app.dependency_overrides[get_current_user] = lambda: USER
    app.dependency_overrides[get_current_access_token] = lambda: "test-token"
    return TestClient(app)


def _cleanup():
    app.dependency_overrides.clear()


def test_progressive_path_evidence_route_is_registered():
    routes = {(route.path, method) for route in app.routes for method in (route.methods or set())}
    assert ("/api/candidate/progressive-path/steps/{step_id}/evidence", "PUT") in routes


def test_evidence_endpoint_updates_current_step(monkeypatch):
    expected = _fallback_path(USER.user_id)
    captured = {}

    def fake_update(candidate_id, step_id, evidence_keys, access_token):
        captured.update(
            candidate_id=candidate_id,
            step_id=step_id,
            evidence_keys=evidence_keys,
            access_token=access_token,
        )
        return expected

    monkeypatch.setattr(candidate_router, "update_candidate_progressive_path_step_evidence", fake_update)
    client = _client()
    try:
        response = client.put(
            "/api/candidate/progressive-path/steps/prepare-study-project/evidence",
            json={"evidence_keys": ["study_project_ready", "study_project_ready"]},
        )
    finally:
        _cleanup()

    assert response.status_code == 200
    assert captured == {
        "candidate_id": USER.user_id,
        "step_id": "prepare-study-project",
        "evidence_keys": ["study_project_ready"],
        "access_token": "test-token",
    }


def test_evidence_endpoint_rejects_invalid_payload_before_service(monkeypatch):
    called = False

    def fake_update(*_args, **_kwargs):
        nonlocal called
        called = True
        return _fallback_path(USER.user_id)

    monkeypatch.setattr(candidate_router, "update_candidate_progressive_path_step_evidence", fake_update)
    client = _client()
    try:
        response = client.put(
            "/api/candidate/progressive-path/steps/prepare-study-project/evidence",
            json={"evidence_keys": [""]},
        )
    finally:
        _cleanup()

    assert response.status_code == 422
    assert called is False


def test_evidence_endpoint_maps_locked_step_to_409(monkeypatch):
    monkeypatch.setattr(
        candidate_router,
        "update_candidate_progressive_path_step_evidence",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(PermissionError("Étape verrouillée")),
    )
    client = _client()
    try:
        response = client.put(
            "/api/candidate/progressive-path/steps/prepare-career-project/evidence",
            json={"evidence_keys": ["career_project_ready"]},
        )
    finally:
        _cleanup()

    assert response.status_code == 409
    assert "verrouillée" in response.json()["detail"]


def test_evidence_endpoint_maps_storage_outage_to_503(monkeypatch):
    monkeypatch.setattr(
        candidate_router,
        "update_candidate_progressive_path_step_evidence",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("Stockage indisponible")),
    )
    client = _client()
    try:
        response = client.put(
            "/api/candidate/progressive-path/steps/prepare-study-project/evidence",
            json={"evidence_keys": ["study_project_ready"]},
        )
    finally:
        _cleanup()

    assert response.status_code == 503
    assert "Stockage indisponible" in response.json()["detail"]


def test_complete_endpoint_maps_business_block_to_409(monkeypatch):
    monkeypatch.setattr(
        candidate_router,
        "complete_candidate_progressive_path_step",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            PermissionError("Cette étape ne peut pas être terminée : CV déposé et approuvé")
        ),
    )
    client = _client()
    try:
        response = client.post(
            "/api/candidate/progressive-path/steps/prepare-cv/complete"
        )
    finally:
        _cleanup()

    assert response.status_code == 409
    assert "CV déposé et approuvé" in response.json()["detail"]
