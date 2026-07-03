from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import auth, chat, health
from config import get_settings
from database.db import init_db
from services.catalog_service import catalog_service
from services.retriever import retriever

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("shl.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting %s (%s)", settings.app_name, settings.environment)
    try:
        init_db()
    except Exception as exc:  # noqa: BLE001
        logger.error("Database init failed: %s", exc)
    try:
        await catalog_service.load()
        retriever.build()
    except Exception as exc:  # noqa: BLE001
        # Never crash the process on startup data issues — /health must stay up
        # so the deployment platform doesn't mark it as failed, and /chat will
        # fail soft with a clear message until the catalog can be reloaded.
        logger.error("Startup data load failed: %s", exc)
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title="SHL AI Assessment Recommender API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
origins = ["*"] if settings.cors_origins.strip() == "*" else [o.strip() for o in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)


@app.get("/")
async def root() -> dict:
    return {"service": "SHL AI Assessment Recommender", "status": "running"}
