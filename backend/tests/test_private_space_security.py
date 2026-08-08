import pytest

from backend.app.services.private_catalog_service import (
    STUDENT_DOCUMENT_MAX_BYTES,
    validate_student_document_upload,
)
from backend.app.services import private_catalog_service
from backend.app.schemas import PrivateOnboardingSubmitRequest
from backend.app.main import app
from fastapi.testclient import TestClient


def test_student_document_accepts_a_real_pdf_signature():
    validate_student_document_upload(b"%PDF-1.7\ncontent", "dossier.pdf", "application/pdf")


@pytest.mark.parametrize(
    ("content", "filename", "content_type"),
    [
        (b"MZ executable", "piece.pdf", "application/pdf"),
        (b"%PDF-1.7", "piece.exe", "application/x-msdownload"),
        (b"PK\x03\x04archive", "piece.docx", "application/zip"),
        (b"", "piece.pdf", "application/pdf"),
    ],
)
def test_student_document_rejects_disguised_or_unsupported_files(content, filename, content_type):
    with pytest.raises(ValueError):
        validate_student_document_upload(content, filename, content_type)


def test_student_document_rejects_files_over_ten_megabytes():
    with pytest.raises(ValueError, match="10 Mo"):
        validate_student_document_upload(
            b"%PDF-" + b"0" * STUDENT_DOCUMENT_MAX_BYTES,
            "large.pdf",
            "application/pdf",
        )


def test_onboarding_never_reports_success_without_storage(monkeypatch):
    monkeypatch.setattr(private_catalog_service, "_client_or_none", lambda *_args, **_kwargs: None)
    with pytest.raises(RuntimeError, match="brouillon"):
        private_catalog_service.save_private_onboarding(
            "00000000-0000-0000-0000-000000000001",
            PrivateOnboardingSubmitRequest(data={"country": "Togo"}),
        )


def test_private_document_management_routes_are_registered():
    routes = {(route.path, method) for route in app.routes for method in (route.methods or set())}
    assert ("/api/private/documents/{document_id}/download", "GET") in routes
    assert ("/api/private/documents/{document_id}", "DELETE") in routes


def test_every_response_exposes_a_request_identifier():
    response = TestClient(app).get("/", headers={"X-Request-ID": "audit-test-123"})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "audit-test-123"
