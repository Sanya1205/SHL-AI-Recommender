"""
Retriever Service
------------------
Semantic search over the SHL catalog using
`sentence-transformers/all-MiniLM-L6-v2` embeddings + a FAISS index.

If `sentence-transformers`/`faiss` are not installed in the runtime
environment (e.g. a constrained deployment), we degrade gracefully to a
scikit-learn TF-IDF cosine-similarity retriever so the service still runs.
This keeps the app deployable on free tiers without hard-failing on missing
native deps, while using the requested stack whenever it's available.
"""
from __future__ import annotations

import logging
import pickle
from typing import List, Optional, Tuple

import numpy as np

from config import get_settings
from services.catalog_service import CatalogItem, catalog_service

logger = logging.getLogger("shl.retriever")

try:
    import faiss  # type: ignore
    from sentence_transformers import SentenceTransformer  # type: ignore

    _HAS_EMBEDDINGS = True
except Exception:  # noqa: BLE001
    _HAS_EMBEDDINGS = False
    logger.warning("sentence-transformers/faiss unavailable; using TF-IDF fallback retriever.")


class Retriever:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._items: List[CatalogItem] = []
        self._model = None
        self._index = None
        self._tfidf = None
        self._tfidf_matrix = None

    def build(self) -> None:
        self._items = catalog_service.all()
        if not self._items:
            logger.warning("Retriever build skipped: empty catalog.")
            return

        texts = [item.searchable_text() for item in self._items]

        if _HAS_EMBEDDINGS:
            self._build_faiss(texts)
        else:
            self._build_tfidf(texts)

    def _build_faiss(self, texts: List[str]) -> None:
        self._model = SentenceTransformer(self.settings.embedding_model_name)
        embeddings = self._model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings.astype(np.float32))
        self._index = index

        try:
            faiss.write_index(index, self.settings.faiss_index_path)
            with open(self.settings.embeddings_meta_path, "wb") as f:
                pickle.dump([item.id for item in self._items], f)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not persist FAISS index to disk: %s", exc)

        logger.info("FAISS index built with %d vectors (dim=%d).", index.ntotal, dim)

    def _build_tfidf(self, texts: List[str]) -> None:
        from sklearn.feature_extraction.text import TfidfVectorizer

        self._tfidf = TfidfVectorizer(stop_words="english", max_features=8000)
        self._tfidf_matrix = self._tfidf.fit_transform(texts)
        logger.info("TF-IDF fallback index built with %d docs.", len(texts))

    def search(self, query: str, top_k: int = 8) -> List[Tuple[CatalogItem, float]]:
        if not self._items:
            return []

        top_k = max(1, min(top_k, len(self._items)))

        if _HAS_EMBEDDINGS and self._index is not None:
            return self._search_faiss(query, top_k)
        if self._tfidf is not None:
            return self._search_tfidf(query, top_k)
        return []

    def _search_faiss(self, query: str, top_k: int) -> List[Tuple[CatalogItem, float]]:
        q_emb = self._model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
        scores, idxs = self._index.search(q_emb.astype(np.float32), top_k)
        results = []
        for score, idx in zip(scores[0], idxs[0]):
            if idx < 0 or idx >= len(self._items):
                continue
            results.append((self._items[idx], float(score)))
        return results

    def _search_tfidf(self, query: str, top_k: int) -> List[Tuple[CatalogItem, float]]:
        from sklearn.metrics.pairwise import cosine_similarity

        q_vec = self._tfidf.transform([query])
        sims = cosine_similarity(q_vec, self._tfidf_matrix)[0]
        top_idx = np.argsort(sims)[::-1][:top_k]
        return [(self._items[i], float(sims[i])) for i in top_idx if sims[i] > 0]

    @property
    def is_ready(self) -> bool:
        return bool(self._items) and (self._index is not None or self._tfidf is not None)


retriever = Retriever()
