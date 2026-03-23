from fastapi import APIRouter

from ..config import settings

router = APIRouter()


@router.get("/health")
def healthcheck() -> dict[str, bool | str]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "supabaseConfigured": settings.supabase_enabled,
        "cohereConfigured": settings.cohere_enabled,
    }
