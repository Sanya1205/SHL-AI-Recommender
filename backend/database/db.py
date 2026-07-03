"""
Database session management.

Defaults to a local SQLite file (`database/app.db`) for zero-config local
dev. Set `DATABASE_URL` (e.g. Render/managed Postgres) in production —
SQLite files on most free-tier hosts are wiped on redeploy, so Postgres is
recommended for anything beyond local testing.
"""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import get_settings

settings = get_settings()

_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=_connect_args)
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
