from supabase import Client, create_client

from ..config import settings


class SupabaseConfigurationError(RuntimeError):
    pass


def get_supabase_client(access_token: str | None = None) -> Client:
    if not settings.supabase_enabled:
        raise SupabaseConfigurationError(
            "Supabase is not configured. Set SUPABASE_URL and a server-side key.",
        )

    client = create_client(settings.supabase_url, settings.supabase_key)
    if access_token:
        client.postgrest.auth(access_token)
    return client
