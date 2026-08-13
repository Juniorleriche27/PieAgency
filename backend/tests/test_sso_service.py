from __future__ import annotations

from unittest.mock import patch

import pytest

from backend.app.config import settings
from backend.app.schemas import AuthUserProfile, PlatformRole
from backend.app.services.sso_service import SSOServiceError, consume_authorization_code, issue_authorization_code


class _Result:
    def __init__(self, data=None):
        self.data = data


class _Table:
    def __init__(self, client):
        self.client = client

    def insert(self, payload):
        self.client.inserted = payload
        return self

    def execute(self):
        return _Result()


class _RPC:
    def __init__(self, client, params):
        self.client = client
        self.params = params

    def execute(self):
        self.client.rpc_params = self.params
        return _Result(self.client.rpc_data)


class _FakeSupabase:
    def __init__(self, rpc_data=None):
        self.inserted = None
        self.rpc_params = None
        self.rpc_data = rpc_data or []

    def table(self, name):
        assert name == "sso_authorization_codes"
        return _Table(self)

    def rpc(self, name, params):
        assert name == "consume_sso_authorization_code"
        return _RPC(self, params)


def test_issue_authorization_code_stores_only_hash(monkeypatch):
    fake = _FakeSupabase()
    monkeypatch.setattr(settings, "assistant_sso_client_id", "assistant-pieagency")
    monkeypatch.setattr(
        settings,
        "assistant_sso_redirect_uri",
        "https://assistant.example/api/v1/auth/sso/callback",
    )
    user = AuthUserProfile(
        user_id="00000000-0000-0000-0000-000000000001",
        email="student@example.com",
        role=PlatformRole.STUDENT,
        is_active=True,
    )
    with patch("backend.app.services.sso_service.get_supabase_client", return_value=fake):
        code = issue_authorization_code(
            client_id="assistant-pieagency",
            redirect_uri="https://assistant.example/api/v1/auth/sso/callback",
            user=user,
        )
    assert code
    assert fake.inserted is not None
    assert fake.inserted["code_hash"] != code
    assert code not in fake.inserted.values()


def test_consume_authorization_code_requires_client_secret(monkeypatch):
    monkeypatch.setattr(settings, "assistant_sso_client_id", "assistant-pieagency")
    monkeypatch.setattr(settings, "assistant_sso_client_secret", "a-strong-test-secret")
    monkeypatch.setattr(
        settings,
        "assistant_sso_redirect_uri",
        "https://assistant.example/api/v1/auth/sso/callback",
    )
    with pytest.raises(SSOServiceError):
        consume_authorization_code(
            code="opaque-authorization-code-value",
            client_id="assistant-pieagency",
            client_secret="wrong-secret-value",
            redirect_uri="https://assistant.example/api/v1/auth/sso/callback",
        )


def test_consume_authorization_code_returns_profile(monkeypatch):
    fake = _FakeSupabase(
        rpc_data=[
            {
                "user_id": "00000000-0000-0000-0000-000000000002",
                "email": "admin@example.com",
                "full_name": "Admin Test",
                "phone": None,
                "country": "TG",
                "role": "admin",
                "is_active": True,
            }
        ]
    )
    monkeypatch.setattr(settings, "assistant_sso_client_id", "assistant-pieagency")
    monkeypatch.setattr(settings, "assistant_sso_client_secret", "a-strong-test-secret")
    monkeypatch.setattr(
        settings,
        "assistant_sso_redirect_uri",
        "https://assistant.example/api/v1/auth/sso/callback",
    )
    with patch("backend.app.services.sso_service.get_supabase_client", return_value=fake):
        profile = consume_authorization_code(
            code="opaque-authorization-code-value",
            client_id="assistant-pieagency",
            client_secret="a-strong-test-secret",
            redirect_uri="https://assistant.example/api/v1/auth/sso/callback",
        )
    assert profile.user_id.endswith("0002")
    assert profile.role == PlatformRole.ADMIN
    assert fake.rpc_params is not None
    assert fake.rpc_params["p_code_hash"] != "opaque-authorization-code-value"
