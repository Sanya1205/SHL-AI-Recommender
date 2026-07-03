"""
Guardrails Service
--------------------
Keeps the agent strictly scoped to SHL assessment discovery:
- Detects prompt-injection attempts ("ignore previous instructions", role
  hijacking, system-prompt exfiltration attempts, etc.)
- Detects off-topic requests (legal advice, medical advice, general coding
  help, general hiring/HR advice unrelated to picking an SHL assessment).

This is a fast, deterministic pre-filter that runs BEFORE we spend an LLM
call — it is cheap, auditable, and impossible for the model to "reason its
way around" the way a purely prompt-based guardrail can be.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

_INJECTION_PATTERNS = [
    r"ignore (all|any|the) (previous|prior|above) instructions",
    r"disregard (all|any|the) (previous|prior|above)",
    r"you are now",
    r"act as (?!.*(recruiter|hiring))",  # "act as X" where X isn't a recruiting persona
    r"system prompt",
    r"reveal (your|the) (prompt|instructions)",
    r"jailbreak",
    r"pretend (to be|you are)",
    r"override your (rules|guidelines|instructions)",
    r"do anything now",
    r"\bDAN\b",
]

_OFF_TOPIC_PATTERNS = [
    (r"\b(sue|lawsuit|contract law|legal advice|attorney|liable|liability)\b", "legal"),
    (r"\b(diagnos|symptom|medication|prescri|disease|treatment)\b", "medical"),
    (r"\b(write (a|an|some) (function|script|code)|debug my code|fix this bug|regex for)\b", "programming"),
    (r"\b(salary negotiation|how much should i pay|termination letter|fire (an|my) employee|performance improvement plan)\b", "general_hr"),
    (r"\b(weather|stock price|recipe|write me a poem|translate this)\b", "unrelated"),
]

_SHL_SIGNAL_PATTERNS = [
    r"\bassessment\b", r"\bshl\b", r"\btest\b", r"\bhiring\b", r"\brecruit",
    r"\bcandidate\b", r"\bjob description\b", r"\brole\b", r"\bopq\b", r"\bgsa\b",
    r"\bpersonality\b", r"\baptitude\b", r"\bcognitive\b", r"\bcompetenc",
    r"\bskills?\b", r"\bcompare\b", r"\bdeveloper\b", r"\bengineer\b",
    r"\bmanager\b", r"\bleadership\b", r"\bscore\b", r"\bduration\b",
]


@dataclass
class GuardrailResult:
    allowed: bool
    reason: Optional[str] = None
    category: Optional[str] = None


def check_prompt_injection(text: str) -> GuardrailResult:
    lowered = text.lower()
    for pattern in _INJECTION_PATTERNS:
        if re.search(pattern, lowered):
            return GuardrailResult(
                allowed=False,
                reason=(
                    "I can't follow instructions that try to change how I operate. "
                    "I'm here to help you find the right SHL assessments — "
                    "what role are you hiring for?"
                ),
                category="prompt_injection",
            )
    return GuardrailResult(allowed=True)


def check_off_topic(text: str) -> GuardrailResult:
    lowered = text.lower()

    has_shl_signal = any(re.search(p, lowered) for p in _SHL_SIGNAL_PATTERNS)

    for pattern, category in _OFF_TOPIC_PATTERNS:
        if re.search(pattern, lowered) and not has_shl_signal:
            friendly = {
                "legal": "legal questions",
                "medical": "medical questions",
                "programming": "general programming help",
                "general_hr": "general hiring/HR advice",
                "unrelated": "topics unrelated to SHL assessments",
            }[category]
            return GuardrailResult(
                allowed=False,
                reason=(
                    f"That's outside what I can help with — I'm focused on SHL assessment "
                    f"discovery, not {friendly}. Tell me about the role you're hiring for "
                    "and I can recommend the right assessments."
                ),
                category=category,
            )
    return GuardrailResult(allowed=True)


def run_guardrails(text: str) -> GuardrailResult:
    injection = check_prompt_injection(text)
    if not injection.allowed:
        return injection
    return check_off_topic(text)
