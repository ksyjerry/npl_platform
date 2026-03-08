from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers.admin import router as admin_router
from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.consulting import router as consulting_router
from app.api.v1.routers.documents import router as documents_router
from app.api.v1.routers.glossary import router as glossary_router
from app.api.v1.routers.notices import router as notices_router
from app.api.v1.routers.pools import router as pools_router
from app.api.v1.routers.users import router as users_router
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify DB connection
    async with engine.connect() as conn:
        await conn.execute(
            __import__("sqlalchemy").text("SELECT 1")
        )
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="삼일PwC 온라인 NPL 플랫폼 API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix="/api/v1")
app.include_router(pools_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(notices_router, prefix="/api/v1")
app.include_router(glossary_router, prefix="/api/v1")
app.include_router(consulting_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
