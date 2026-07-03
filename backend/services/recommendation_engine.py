"""
Recommendation Engine
-----------------------
Takes raw (CatalogItem, similarity_score) pairs from the Retriever and turns
them into a ranked, confidence-scored, UI-ready shortlist, respecting the
assignment's 1-10 item bound.
"""
from __future__ import annotations

from typing import List, Tuple

from config import get_settings
from models.schemas import Recommendation
from services.catalog_service import CatalogItem


def _score_to_confidence(score: float) -> float:
    """Normalize a raw similarity score (cosine sim, roughly -1..1, or a
    TF-IDF cosine 0..1) into a friendly 0-100 confidence percentage."""
    clamped = max(0.0, min(1.0, score))
    # Slight curve so mid-range matches don't look artificially low.
    confidence = 40 + clamped * 60
    return round(min(99.0, confidence), 1)


def build_recommendations(
    scored_items: List[Tuple[CatalogItem, float]],
    min_items: int | None = None,
    max_items: int | None = None,
) -> List[Recommendation]:
    settings = get_settings()
    min_items = min_items or settings.min_recommendations
    max_items = max_items or settings.max_recommendations

    ranked = sorted(scored_items, key=lambda pair: pair[1], reverse=True)
    ranked = ranked[:max_items]

    recommendations: List[Recommendation] = []
    for item, score in ranked:
        recommendations.append(
            Recommendation(
                name=item.name,
                url=item.url,
                test_type=item.test_type,
                category=item.category or item.test_type_label,
                duration=item.duration,
                skills=item.skills,
                description=item.description,
                confidence=_score_to_confidence(score),
                remote_testing=item.remote_testing,
                adaptive=item.adaptive,
                languages=item.languages,
            )
        )

    return recommendations
