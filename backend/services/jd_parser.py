"""
JD Parser Service
--------------------
Extracts raw text from an uploaded Job Description (PDF, DOCX, or pasted
plain text) so it can be folded into the conversation as a user message for
the normal Conversation Manager -> Retriever -> Gemini pipeline to handle.
"""
from __future__ import annotations

import io
import logging

logger = logging.getLogger("shl.jd_parser")

MAX_CHARS = 6000  # keep prompts bounded


def extract_text_from_pdf(file_bytes: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(text_parts).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    import docx

    document = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in document.paragraphs).strip()


def extract_text(filename: str, file_bytes: bytes) -> str:
    lower = filename.lower()
    try:
        if lower.endswith(".pdf"):
            text = extract_text_from_pdf(file_bytes)
        elif lower.endswith(".docx"):
            text = extract_text_from_docx(file_bytes)
        else:
            text = file_bytes.decode("utf-8", errors="ignore")
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to parse JD file %s: %s", filename, exc)
        text = ""

    return text[:MAX_CHARS]


def build_jd_prompt_message(jd_text: str) -> str:
    """Wraps extracted JD text as a natural user message so it flows through
    the same conversation pipeline as typed input."""
    trimmed = jd_text.strip()
    if not trimmed:
        return "I uploaded a job description but no readable text was found in it."
    return f"Here is a job description, please recommend matching SHL assessments:\n\n{trimmed}"
