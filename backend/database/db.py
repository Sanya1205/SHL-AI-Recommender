"""
Database session management.

Defaults to a local SQLite file (`database/app.db`) for zero-config local
dev. Set `DATABASE_URL` (e.g. Railway/Render managed Postgres) in production —
SQLite files on most free-tier hosts are wiped on redeploy, so Postgres is
recommended for anything beyond local testing.
"""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import get_settings

settings = get_settings()


def _normalize_database_url(url: str) -> str:
    """Railway (and Heroku-style) managed Postgres injects DATABASE_URL as
    'postgres://...', which older SQLAlchemy rejects and which doesn't pin
    a driver. Normalize to 'postgresql+psycopg2://...' so the psycopg2
    driver from requirements.txt is used explicitly."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+psycopg2" not in url:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


_database_url = _normalize_database_url(settings.database_url)
_connect_args = {"check_same_thread": False} if _database_url.startswith("sqlite") else {}

engine = create_engine(_database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    # Import models here so they're registered on Base's metadata before create_all.
    from models import db_models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()