from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers.ai import router as ai_router
from .routers.auth import router as auth_router
from .routers.community import router as community_router
from .routers.contact import router as contact_router
from .routers.dashboard import router as dashboard_router
from .routers.health import router as health_router

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

app.include_router(health_router, prefix=settings.api_prefix, tags=["health"])
app.include_router(ai_router, prefix=settings.api_prefix, tags=["ai"])
app.include_router(auth_router, prefix=settings.api_prefix, tags=["auth"])
app.include_router(community_router, prefix=settings.api_prefix, tags=["community"])
app.include_router(dashboard_router, prefix=settings.api_prefix, tags=["dashboard"])
app.include_router(contact_router, prefix=settings.api_prefix, tags=["contact"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "PieAgency API is running."}
