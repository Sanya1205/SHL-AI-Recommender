"""
Catalog Service
----------------
Loads the official SHL product catalog (Individual Test Solutions only),
normalizes every record into a consistent internal schema, and caches it
to disk so the app has a fast, reliable cold start.

Design notes:
- We NEVER hardcode assessments. Everything is loaded dynamically from the
  configured `CATALOG_SOURCE_URL`.
- If the live fetch fails (network issue, source down), we fall back to the
  last good local cache at `database/catalog.json` so the service stays up.
- Records are normalized to: id, name, url, description, test_type,
  test_type_label, category, duration, remote_testing, adaptive, languages,
  skills (best-effort keyword extraction from name/description).
"""
from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import httpx

from config import get_settings

logger = logging.getLogger("shl.catalog")

TEST_TYPE_LABELS = {
    "A": "Ability & Aptitude",
    "B": "Biodata & Situational Judgement",
    "C": "Competencies",
    "D": "Development & 360",
    "E": "Assessment Exercises",
    "K": "Knowledge & Skills",
    "P": "Personality & Behavior",
    "S": "Simulations",
}

# Lightweight keyword bank used only to *derive* human-readable skill chips
# from a catalog record's own name/description text (no invented content).
_SKILL_KEYWORDS = [
    "Java", "Python", "JavaScript", "TypeScript", "SQL", "React", "Angular",
    "Spring Boot", "Microservices", "API Design", "AWS", "Azure", "Cloud",
    "Leadership", "Influence", "Adaptability", "Problem Solving",
    "Critical Thinking", "Communication", "Numerical Reasoning",
    "Verbal Reasoning", "Inductive Reasoning", "Data Analysis",
    "Customer Service", "Sales", "Negotiation", "Project Management",
    "Teamwork", "Decision Making", "Strategic Thinking", "C#", ".NET",
    "C++", "Excel", "Data Science", "Machine Learning", "SQL Server",
]


@dataclass
class CatalogItem:
    id: str
    name: str
    url: str
    description: str = ""
    test_type: Optional[str] = None
    test_type_label: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[str] = None
    remote_testing: Optional[bool] = None
    adaptive: Optional[bool] = None
    languages: Optional[str] = None
    skills: List[str] = field(default_factory=list)

    def searchable_text(self) -> str:
        parts = [self.name, self.description or "", self.category or "", " ".join(self.skills)]
        return " | ".join(p for p in parts if p)

    def to_public_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "url": self.url,
            "test_type": self.test_type,
            "category": self.category or self.test_type_label,
            "duration": self.duration,
            "skills": self.skills,
            "description": self.description,
            "remote_testing": self.remote_testing,
            "adaptive": self.adaptive,
            "languages": self.languages,
        }


def _derive_skills(name: str, description: str) -> List[str]:
    text = f"{name} {description}".lower()
    found = [kw for kw in _SKILL_KEYWORDS if kw.lower() in text]
    return found[:6]


def _coerce_bool(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        v = value.strip().lower()
        if v in ("yes", "true", "y"):
            return True
        if v in ("no", "false", "n"):
            return False
    return None


def _normalize_record(raw: Dict[str, Any]) -> Optional[CatalogItem]:
    """Best-effort normalization: the upstream JSON's exact field names are
    not guaranteed, so we probe a set of likely keys for each attribute."""
    name = (
        raw.get("name")
        or raw.get("title")
        or raw.get("assessment_name")
        or raw.get("product_name")
    )
    url = raw.get("url") or raw.get("link") or raw.get("product_url")
    if not name or not url:
        return None

    # Skip pre-packaged Job Solutions if the source marks them; assignment
    # scope is Individual Test Solutions only.
    solution_type = str(raw.get("solution_type") or raw.get("type") or "").lower()
    if "job solution" in solution_type or "job-solution" in solution_type:
        return None

    description = (
        raw.get("description") or raw.get("summary") or raw.get("about") or ""
    )
    test_type_raw = raw.get("test_type") or raw.get("key") or raw.get("keys")
    test_type = None
    if isinstance(test_type_raw, list) and test_type_raw:
        test_type = str(test_type_raw[0]).strip().upper()[:1]
    elif isinstance(test_type_raw, str) and test_type_raw:
        test_type = test_type_raw.strip().upper()[:1]

    duration = raw.get("duration") or raw.get("assessment_length") or raw.get("length")
    if isinstance(duration, (int, float)):
        duration = f"{int(duration)} minutes"

    languages = raw.get("languages") or raw.get("language")
    if isinstance(languages, list):
        languages = ", ".join(str(l) for l in languages)

    item_id = raw.get("id") or re.sub(r"[^a-z0-9]+", "-", str(name).lower()).strip("-")

    item = CatalogItem(
        id=str(item_id),
        name=str(name).strip(),
        url=str(url).strip(),
        description=str(description).strip(),
        test_type=test_type,
        test_type_label=TEST_TYPE_LABELS.get(test_type or "", raw.get("category")),
        category=raw.get("category") or TEST_TYPE_LABELS.get(test_type or ""),
        duration=str(duration).strip() if duration else None,
        remote_testing=_coerce_bool(raw.get("remote_testing") or raw.get("remote_support")),
        adaptive=_coerce_bool(raw.get("adaptive") or raw.get("adaptive_irt")),
        languages=str(languages).strip() if languages else None,
    )
    item.skills = _derive_skills(item.name, item.description)
    return item


class CatalogService:
    """Singleton-style holder for the normalized catalog."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.items: List[CatalogItem] = []
        self._by_name_lower: Dict[str, CatalogItem] = {}

    async def load(self) -> None:
        raw_records = await self._fetch_or_cache()
        items: List[CatalogItem] = []
        for raw in raw_records:
            try:
                normalized = _normalize_record(raw)
            except Exception:  # noqa: BLE001 - never let one bad row kill startup
                normalized = None
            if normalized:
                items.append(normalized)

        if not items:
            logger.warning("Catalog normalized to 0 items; check upstream schema.")

        self.items = items
        self._by_name_lower = {i.name.lower(): i for i in items}
        logger.info("Catalog loaded: %d items", len(self.items))

    async def _fetch_or_cache(self) -> List[Dict[str, Any]]:
        cache_path = self.settings.catalog_cache_path
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(self.settings.catalog_source_url)
                resp.raise_for_status()
                data = resp.json()
            records = _extract_records(data)
            os.makedirs(os.path.dirname(cache_path), exist_ok=True)
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(records, f)
            logger.info("Fetched fresh catalog from source (%d raw records).", len(records))
            return records
        except Exception as exc:  # noqa: BLE001
            logger.warning("Live catalog fetch failed (%s). Falling back to cache.", exc)
            if os.path.exists(cache_path):
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            logger.error("No cache available either. Starting with an empty catalog.")
            return []

    def get_by_name(self, name: str) -> Optional[CatalogItem]:
        return self._by_name_lower.get(name.lower())

    def find_many_by_names(self, names: List[str]) -> List[CatalogItem]:
        out = []
        for n in names:
            hit = self.get_by_name(n)
            if hit:
                out.append(hit)
        return out

    def all(self) -> List[CatalogItem]:
        return self.items


def _extract_records(data: Any) -> List[Dict[str, Any]]:
    """The source JSON might be a bare list, or wrapped under a key like
    'catalog' / 'items' / 'products'. Handle the common shapes."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("items", "catalog", "products", "data", "results"):
            if key in data and isinstance(data[key], list):
                return data[key]
    return []


catalog_service = CatalogService()
