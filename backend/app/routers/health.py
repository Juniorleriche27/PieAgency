from fastapi import APIRouter, Response, status

from ..config import settings
from ..services.supabase_service import get_supabase_client

router = APIRouter()


@router.get("/health")
def healthcheck() -> dict[str, bool | str]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "supabaseConfigured": settings.supabase_enabled,
        "cohereConfigured": settings.cohere_enabled,
        "aiGatewayConfigured": settings.ai_gateway_enabled,
    }


@router.get("/health/private-space")
def private_space_readiness(response: Response) -> dict[str, object]:
    required_tables = ["subscription_plans", "user_resource_entitlements", "payment_access_claims", "case_documents", "student_onboarding"]
    checks: dict[str, bool] = {}
    try:
        client = get_supabase_client()
        for table in required_tables:
            try:
                client.table(table).select("*", count="exact").limit(1).execute()
                checks[table] = True
            except Exception:
                checks[table] = False
    except Exception:
        checks = {table: False for table in required_tables}
    ready = all(checks.values())
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ready" if ready else "not_ready", "checks": checks}
