from __future__ import annotations

import time
from contextlib import contextmanager
from typing import Iterator


@contextmanager
def timed(label: str, logger) -> Iterator[None]:
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.debug("%s took %.1fms", label, elapsed_ms)


def truncate(text: str, max_chars: int = 4000) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "…"
