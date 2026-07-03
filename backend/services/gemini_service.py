"""
Gemini Service
---------------
Wraps all calls to Google Gemini 2.5 Flash. Two responsibilities:

1. `analyze()` — a structured-JSON call that reads the conversation and
   decides: do we have enough context to recommend, what's the retrieval
   query, has the user changed constraints (refine), and are they asking a
   comparison question. This is the "brain" behind the Conversation Manager.

2. `generate_reply()` / `generate_comparison()` — grounded natural-language
   generation calls that are only ever given retrieved catalog facts, never
   asked to recall assessments from memory.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from tenacity import retry, stop_after_attempt, wait_exponential

from config import get_settings

logger = logging.getLogger("shl.gemini")

_PROMPT_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")


def _load_prompt(name: str) -> str:
    with open(os.path.join(_PROMPT_DIR, name), "r", encoding="utf-8") as f:
        return f.read()


_SYSTEM_PROMPT = _load_prompt("system_prompt.txt")
_RECOMMENDATION_PROMPT = _load_prompt("recommendation_prompt.txt")
_COMPARISON_PROMPT = _load_prompt("comparison_prompt.txt")

_ANALYSIS_INSTRUCTIONS = """
You are the conversation-understanding module for an SHL assessment
recommender agent. Read the conversation and return ONLY a JSON object
(no markdown fences, no extra text) with these fields:

{
  "has_enough_context": boolean,   // enough to search the catalog & recommend?
  "clarifying_question": string|null,  // ask ONE short question if not enough context
  "search_query": string,          // best-effort semantic search query for the catalog
                                    // combining role, seniority, skills, and any
                                    // assessment-type preference mentioned so far
  "is_comparison_request": boolean,
  "comparison_targets": string[],  // assessment names user wants compared, if any
  "is_refinement": boolean,        // did the user change/add a constraint vs. prior turns?
  "user_signals_done": boolean     // did the user indicate the shortlist is accepted/final?
}

Guidance:
- A single vague statement like "I need an assessment" or "help me hire someone"
  has_enough_context=false. Ask what role/level/skills they need.
- Once you know at least a role or a clear skill focus (e.g. "Java developer",
  "leadership assessment for CXOs", "data scientist with SQL"), that IS enough
  context to search and recommend — do not over-ask.
- If the user's latest message changes or adds constraints on top of an
  existing shortlist (e.g. "actually also add personality tests", "make it
  shorter", "entry level instead"), set is_refinement=true and
  has_enough_context=true.
"""


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None
        self._configured = False

    def _ensure_configured(self) -> bool:
        if self._configured:
            return True
        if not self.settings.gemini_api_key:
            logger.warning("GEMINI_API_KEY not set — Gemini calls will be skipped.")
            return False
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.settings.gemini_api_key)
            self._genai = genai
            self._model = genai.GenerativeModel(
                self.settings.gemini_model,
                system_instruction=_SYSTEM_PROMPT,
            )
            self._configured = True
            return True
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to configure Gemini: %s", exc)
            return False

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=3))
    def _generate(self, prompt: str, json_mode: bool = False) -> str:
        if not self._ensure_configured():
            raise RuntimeError("gemini_not_configured")

        generation_config: Dict[str, Any] = {"temperature": self.settings.gemini_temperature}
        if json_mode:
            generation_config["response_mime_type"] = "application/json"

        response = self._model.generate_content(prompt, generation_config=generation_config)
        return (response.text or "").strip()

    # ---------------------------------------------------------------- #
    # Public API
    # ---------------------------------------------------------------- #

    def analyze(self, conversation_text: str) -> Dict[str, Any]:
        prompt = f"{_ANALYSIS_INSTRUCTIONS}\n\nConversation:\n{conversation_text}\n"
        try:
            raw = self._generate(prompt, json_mode=True)
            return _safe_json(raw)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini analyze() failed (%s); using heuristic fallback.", exc)
            return _heuristic_analyze(conversation_text)

    def generate_reply(
        self,
        conversation_text: str,
        context_summary: str,
        retrieved_items: List[Dict[str, Any]],
    ) -> str:
        items_text = "\n".join(
            f"- {i['name']} ({i.get('test_type') or 'n/a'}): {i.get('description', '')[:180]}"
            for i in retrieved_items
        ) or "(none retrieved)"

        prompt = _RECOMMENDATION_PROMPT.format(
            conversation_history=conversation_text,
            context_summary=context_summary,
            retrieved_items=items_text,
        )
        try:
            return self._generate(prompt)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini generate_reply() failed (%s); using template fallback.", exc)
            names = ", ".join(i["name"] for i in retrieved_items[:3])
            return (
                f"Based on what you've shared, here's a shortlist that fits, including {names}."
                if names
                else "I couldn't find a strong match in the catalog for that — could you share a bit more detail?"
            )

    def generate_comparison(self, conversation_text: str, catalog_items: List[Dict[str, Any]]) -> str:
        items_text = json.dumps(catalog_items, indent=2) if catalog_items else "(no matching items found)"
        prompt = _COMPARISON_PROMPT.format(
            conversation_history=conversation_text, catalog_items=items_text
        )
        try:
            return self._generate(prompt)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini generate_comparison() failed (%s).", exc)
            if not catalog_items:
                return "I don't have catalog data on those specific assessments to compare them accurately."
            lines = [f"**{i['name']}** — {i.get('description', 'No description available.')[:200]}" for i in catalog_items]
            return "\n\n".join(lines)


def _safe_json(raw: str) -> Dict[str, Any]:
    cleaned = re.sub(r"^```(json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except Exception:  # noqa: BLE001
        return _heuristic_analyze(raw)


def _heuristic_analyze(conversation_text: str) -> Dict[str, Any]:
    """Deterministic fallback used if Gemini is unavailable/misconfigured,
    so the API never hard-fails just because of a missing API key."""
    lowered = conversation_text.lower()
    is_comparison = bool(re.search(r"\b(compare|difference between|vs\.?|versus)\b", lowered))

    role_signals = [
        "developer", "engineer", "manager", "analyst", "scientist", "designer",
        "leadership", "executive", "sales", "customer service", "java", "python",
        "data", "administrator", "consultant",
    ]
    has_role_signal = any(sig in lowered for sig in role_signals)

    words = re.findall(r"\w+", conversation_text)
    has_enough_context = has_role_signal and len(words) > 4

    return {
        "has_enough_context": has_enough_context,
        "clarifying_question": None if has_enough_context else "Could you tell me which role you're hiring for, and the seniority level?",
        "search_query": conversation_text[-400:],
        "is_comparison_request": is_comparison,
        "comparison_targets": [],
        "is_refinement": False,
        "user_signals_done": bool(re.search(r"\b(perfect|great|that works|sounds good|thank you|thanks)\b", lowered)),
    }


gemini_service = GeminiService()
