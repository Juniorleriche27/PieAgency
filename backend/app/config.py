from pathlib import Path

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
    supabase_url: str = ""
    supabase_secret_key: str = ""
    supabase_service_role_key: str = ""
    supabase_contact_table: str = "contact_requests"
    admin_emails: str = ""
    makuta_base_url: str = ""
    makuta_api_version: str = "v1"
    makuta_app_token: str = ""
    makuta_user_token: str = ""
    makuta_login_url: str = ""
    makuta_login_identity: str = ""
    makuta_login_password: str = ""
    makuta_login_identity_field: str = "login"
    makuta_login_password_field: str = "password"
    makuta_wallet_id: str = ""
    makuta_wallet_operation: str = "CREDIT"
    makuta_transaction_url: str = ""
    makuta_status_url_template: str = ""
    makuta_status_http_method: str = "GET"
    makuta_supported_currencies: str = "XOF"
    makuta_operator_options: str = ""
    makuta_request_timeout_seconds: float = 20.0
    makuta_merchant_label: str = "PieAgency"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

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
    def cohere_enabled(self) -> bool:
        return bool(self.cohere_api_key)

    @property
    def admin_email_list(self) -> set[str]:
        return {
            email.strip().lower()
            for email in self.admin_emails.split(",")
            if email.strip()
        }

    @property
    def makuta_enabled(self) -> bool:
        return bool(
            self.makuta_wallet_id
            and self.makuta_app_token
            and self.makuta_transaction_endpoint
        )

    @property
    def makuta_transaction_endpoint(self) -> str:
        if self.makuta_transaction_url.strip():
            return self.makuta_transaction_url.strip()

        base_url = self.makuta_base_url.rstrip("/")
        api_version = self.makuta_api_version.strip().strip("/")
        if not base_url or not api_version:
            return ""

        return f"{base_url}/{api_version}/financial-transactions/0"

    @property
    def makuta_supported_currency_list(self) -> list[str]:
        return [
            currency.strip().upper()
            for currency in self.makuta_supported_currencies.split(",")
            if currency.strip()
        ] or ["XOF"]

    @property
    def makuta_operator_option_list(self) -> list[tuple[str, str]]:
        options: list[tuple[str, str]] = []
        for item in self.makuta_operator_options.split(","):
            raw_item = item.strip()
            if not raw_item:
                continue

            if ":" in raw_item:
                code, label = raw_item.split(":", 1)
            else:
                code, label = raw_item, raw_item

            normalized_code = code.strip()
            normalized_label = label.strip()
            if normalized_code and normalized_label:
                options.append((normalized_code, normalized_label))

        return options


settings = Settings()
