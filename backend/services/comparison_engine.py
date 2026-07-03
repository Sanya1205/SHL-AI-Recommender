"""
Comparison Engine
-------------------
Resolves user-mentioned assessment names/abbreviations (e.g. "OPQ", "GSA")
to catalog records via fuzzy matching + semantic search fallback, then hands
grounded catalog facts to the Gemini service for the final comparison text.
"""
from __future__ import annotations

from difflib import SequenceMatcher
from typing import List

from services.catalog_service import CatalogItem, catalog_service
from services.retriever import retriever


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def resolve_targets(target_names: List[str], fallback_query: str = "") -> List[CatalogItem]:
    resolved: List[CatalogItem] = []
    catalog = catalog_service.all()

    for target in target_names:
        best_item = None
        best_score = 0.0
        for item in catalog:
            score = _similarity(target, item.name)
            if target.lower() in item.name.lower():
                score = max(score, 0.85)
            if score > best_score:
                best_score = score
                best_item = item

        if best_item and best_score >= 0.45:
            resolved.append(best_item)
        else:
            # Fall back to semantic search for the target string itself.
            hits = retriever.search(target, top_k=1)
            if hits:
                resolved.append(hits[0][0])

    # De-duplicate while preserving order
    seen = set()
    unique = []
    for item in resolved:
        if item.id not in seen:
            seen.add(item.id)
            unique.append(item)

    if not unique and fallback_query:
        hits = retriever.search(fallback_query, top_k=2)
        unique = [h[0] for h in hits]

    return unique


def build_comparison_payload(items: List[CatalogItem]) -> List[dict]:
    return [item.to_public_dict() for item in items]
