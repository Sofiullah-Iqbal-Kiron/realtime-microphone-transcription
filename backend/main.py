# python
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

# fastapi
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# local
from auth.routers import router as auth_router
from core.config import settings
from core.db import Base, engine
from transcription.routers import router as transcription_router
from transcription.whisper_engine import get_whisper_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown lifecycle."""
    # Create tables (used for quick dev; Alembic is the primary migration tool).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured.")

    # Pre-load the Whisper model so the first request is fast.
    get_whisper_model()
    logger.info("Application startup complete.")

    yield

    await engine.dispose()
    logger.info("Application shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers.
app.include_router(auth_router)
app.include_router(transcription_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "version": settings.APP_VERSION}
