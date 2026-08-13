import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .security.session_cookies import ACCESS_COOKIE, REFRESH_COOKIE
from .routers.ai import router as ai_router
from .routers.auth import router as auth_router
from .routers.candidate import router as candidate_router
from .routers.community import router as community_router
from .routers.contact import router as contact_router
from .routers.dashboard import router as dashboard_router
from .routers.health import router as health_router
from .routers.payments import router as payments_router
from .routers.private import router as private_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API FastAPI pour le site PieAgency.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger("pieagency.requests")


@app.middleware("http")
async def cookie_csrf_guard(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        uses_cookie_auth = bool(
            request.cookies.get(ACCESS_COOKIE) or request.cookies.get(REFRESH_COOKIE)
        )
        if uses_cookie_auth:
            origin = request.headers.get("origin")
            if not origin or origin.rstrip("/") not in {
                allowed.rstrip("/") for allowed in settings.cors_origins
            }:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Origine non autorisee pour cette session web."},
                )
    return await call_next(request)


@app.middleware("http")
async def request_observability(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("request_failed id=%s method=%s path=%s", request_id, request.method, request.url.path)
        raise
    duration_ms = round((time.perf_counter() - started) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info("request_complete id=%s method=%s path=%s status=%s duration_ms=%s", request_id, request.method, request.url.path, response.status_code, duration_ms)
    return response

app.include_router(health_router, prefix=settings.api_prefix, tags=["health"])
app.include_router(ai_router, prefix=settings.api_prefix, tags=["ai"])
app.include_router(auth_router, prefix=settings.api_prefix, tags=["auth"])
app.include_router(candidate_router, prefix=settings.api_prefix, tags=["candidate"])
app.include_router(community_router, prefix=settings.api_prefix, tags=["community"])
app.include_router(dashboard_router, prefix=settings.api_prefix, tags=["dashboard"])
app.include_router(contact_router, prefix=settings.api_prefix, tags=["contact"])
app.include_router(payments_router, prefix=settings.api_prefix, tags=["payments"])
app.include_router(private_router, prefix=settings.api_prefix, tags=["private"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "PieAgency API is running."}
