"""
Central configuration for the SHL AI Assessment Recommender backend.
All values are overridable via environment variables / .env file.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    app_name: str = "SHL AI Assessment Recommender"
    environment: str = os.getenv("ENVIRONMENT", "development")
    cors_origins: str = os.getenv("CORS_ORIGINS", "*")  # comma separated

    # --- Gemini ---
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    gemini_temperature: float = float(os.getenv("GEMINI_TEMPERATURE", "0.3"))

    # --- Catalog ---
    catalog_source_url: str = os.getenv(
        "CATALOG_SOURCE_URL",
        "https://tcp-us-prod-rnd.shl.com/voiceRater/shl-ai-hiring/shl_product_catalog.json",
    )
    catalog_cache_path: str = os.getenv(
        "CATALOG_CACHE_PATH", os.path.join(os.path.dirname(__file__), "database", "catalog.json")
    )
    faiss_index_path: str = os.getenv(
        "FAISS_INDEX_PATH", os.path.join(os.path.dirname(__file__), "database", "faiss.index")
    )
    embeddings_meta_path: str = os.getenv(
        "EMBEDDINGS_META_PATH", os.path.join(os.path.dirname(__file__), "database", "embeddings.pkl")
    )
    embedding_model_name: str = os.getenv(
        "EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"
    )

    # --- Auth / Database ---
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./database/app.db")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me-in-production")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 days

    # --- Conversation limits (per assignment spec) ---
    max_turns: int = int(os.getenv("MAX_TURNS", "8"))
    request_timeout_seconds: int = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "28"))
    min_recommendations: int = 1
    max_recommendations: int = 10
    default_top_k: int = int(os.getenv("DEFAULT_TOP_K", "8"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
