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
    maketou_base_url: str = "https://api.maketou.net"
    maketou_api_key: str = ""
    maketou_checkout_url: str = ""
    maketou_cart_status_url_template: str = ""
    maketou_default_product_document_id: str = ""
    maketou_service_products: str = ""
    maketou_redirect_url: str = ""
    maketou_display_currency: str = "XOF"
    maketou_request_timeout_seconds: float = 20.0
    maketou_merchant_label: str = "PieAgency"

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
    def maketou_enabled(self) -> bool:
        return bool(
            self.maketou_api_key
            and self.maketou_checkout_endpoint
            and (
                self.maketou_default_product_document_id
                or self.maketou_service_product_map
            )
        )

    @property
    def maketou_checkout_endpoint(self) -> str:
        if self.maketou_checkout_url.strip():
            return self.maketou_checkout_url.strip()

        base_url = self.maketou_base_url.rstrip("/")
        if not base_url:
            return ""

        return f"{base_url}/api/v1/stores/cart/checkout"

    @property
    def maketou_cart_status_endpoint_template(self) -> str:
        if self.maketou_cart_status_url_template.strip():
            return self.maketou_cart_status_url_template.strip()

        base_url = self.maketou_base_url.rstrip("/")
        if not base_url:
            return ""

        return f"{base_url}/api/v1/stores/cart/{{cart_id}}"

    @property
    def maketou_service_product_map(self) -> dict[str, str]:
        product_map: dict[str, str] = {}
        for item in self.maketou_service_products.split(","):
            raw_item = item.strip()
            if not raw_item:
                continue

            if ":" not in raw_item:
                continue

            service_slug, product_document_id = raw_item.split(":", 1)
            normalized_service_slug = service_slug.strip()
            normalized_product_document_id = product_document_id.strip()
            if normalized_service_slug and normalized_product_document_id:
                product_map[normalized_service_slug] = normalized_product_document_id

        return product_map

    @property
    def maketou_return_url(self) -> str:
        if self.maketou_redirect_url.strip():
            return self.maketou_redirect_url.strip()
        return f"{self.frontend_origin.rstrip('/')}/paiement?checkout=return"


settings = Settings()
