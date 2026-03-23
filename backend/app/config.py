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


settings = Settings()
