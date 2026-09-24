from pathlib import Path
from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "PieAgency API"
    environment: str = "development"
    api_prefix: str = "/api"
    frontend_origin: str = "http://localhost:3000"
    allowed_origins: str = "http://localhost:3000"
    cohere_api_key: str = ""
    cohere_model: str = "command-a-03-2025"

    knowlia_base_url: str = "http://knowlia:8080"
    knowlia_api_key: str = ""
    knowlia_model: str = ""
    knowlia_generate_path: str = "/public/v1/generate"
    knowlia_tenant_id: str = "pieagency"
    knowlia_request_timeout_seconds: float = 45.0
    supabase_url: str = ""
    supabase_secret_key: str = ""
    supabase_service_role_key: str = ""
    supabase_contact_table: str = "contact_requests"
    airtable_api_token: str = ""
    airtable_base_id: str = ""
    airtable_table_name: str = ""
    airtable_api_base_url: str = "https://api.airtable.com/v0"
    airtable_request_timeout_seconds: float = 20.0
    admin_emails: str = ""
    auth_refresh_cookie_max_age_seconds: int = 60 * 60 * 24 * 30
    assistant_sso_client_id: str = "assistant-pieagency"
    assistant_sso_client_secret: str = ""
    assistant_sso_redirect_uri: str = "http://localhost:8000/api/v1/auth/sso/callback"
    assistant_api_base_url: str = ""
    assistant_api_timeout_seconds: float = 55.0
    sso_authorization_code_ttl_seconds: int = 60
    resend_api_key: str = ""
    receipt_from_email: str = "PieAgency <contact@pieagency.fr>"
    koryxa_pay_base_url: str = "https://api-pay.koryxa.fr"
    koryxa_pay_project_code: str = "pieagency"
    koryxa_pay_project_key: str = ""
    koryxa_pay_webhook_secret: str = ""
    koryxa_pay_display_currency: str = "XOF"
    koryxa_pay_request_timeout_seconds: float = 20.0
    koryxa_pay_merchant_label: str = "PieAgency"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def assistant_api_origin(self) -> str:
        configured = self.assistant_api_base_url.strip()
        if configured:
            return configured.rstrip("/")
        parsed = urlsplit(self.assistant_sso_redirect_uri)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
        return "http://localhost:8000"

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        if self.frontend_origin not in origins:
            origins.append(self.frontend_origin)
        return origins

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    @property
    def supabase_key(self) -> str:
        # Prefer the legacy service_role key when both are present because it is
        # the most compatible option with the current backend setup.
        return self.supabase_service_role_key or self.supabase_secret_key

    @property
    def airtable_enabled(self) -> bool:
        return bool(
            self.airtable_api_token.strip()
            and self.airtable_base_id.strip()
            and self.airtable_table_name.strip()
        )

    @property
    def resend_enabled(self) -> bool:
        return bool(self.resend_api_key.strip())

    @property
    def cohere_enabled(self) -> bool:
        return bool(self.cohere_api_key)

    @property
    def knowlia_enabled(self) -> bool:
        return bool(self.knowlia_base_url.strip() and self.knowlia_api_key.strip() and self.knowlia_tenant_id.strip())

    @property
    def admin_email_list(self) -> set[str]:
        return {
            email.strip().lower()
            for email in self.admin_emails.split(",")
            if email.strip()
        }

    @property
    def koryxa_pay_enabled(self) -> bool:
        return bool(self.koryxa_pay_project_code.strip() and self.koryxa_pay_project_key.strip() and self.koryxa_pay_webhook_secret.strip())


settings = Settings()
