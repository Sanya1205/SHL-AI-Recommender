"""
Conversation Manager
----------------------
The agentic core. For every incoming turn it decides:
  refuse -> clarify -> compare -> retrieve+recommend(+refine)

State is derived fresh from the full message history on every call (the API
is stateless — no server-side session), per the assignment spec.
"""
from __future__ import annotations

import logging
from typing import List

from config import get_settings
from models.schemas import ChatMessage, ChatResponse, Recommendation
from services import comparison_engine
from services.gemini_service import gemini_service
from services.guardrails import run_guardrails
from services.recommendation_engine import build_recommendations
from services.retriever import retriever

logger = logging.getLogger("shl.conversation_manager")


def _format_history(messages: List[ChatMessage]) -> str:
    lines = []
    for m in messages:
        speaker = "User" if m.role == "user" else "Assistant"
        lines.append(f"{speaker}: {m.content}")
    return "\n".join(lines)


def _context_summary(messages: List[ChatMessage]) -> str:
    user_turns = [m.content for m in messages if m.role == "user"]
    return " | ".join(user_turns[-4:])


def _prior_assistant_gave_recommendations(messages: List[ChatMessage]) -> bool:
    # Heuristic used to distinguish "refine an existing shortlist" from
    # "start a brand-new search" when Gemini's is_refinement flag is absent.
    return any(m.role == "assistant" for m in messages[:-1])


def handle_chat(messages: List[ChatMessage]) -> ChatResponse:
    settings = get_settings()

    if not messages or messages[-1].role != "user":
        return ChatResponse(
            reply="I didn't receive a message to respond to — what role are you hiring for?",
            recommendations=[],
            end_of_conversation=False,
        )

    latest_user_message = messages[-1].content.strip()
    turn_count = len(messages)

    # ---- 1. Guardrails (deterministic, runs before any LLM spend) ----
    guard = run_guardrails(latest_user_message)
    if not guard.allowed:
        return ChatResponse(reply=guard.reason or "I can't help with that.", recommendations=[], end_of_conversation=False)

    conversation_text = _format_history(messages)

    # ---- 2. Understand intent / extract slots via Gemini (with heuristic fallback) ----
    analysis = gemini_service.analyze(conversation_text)

    is_comparison = bool(analysis.get("is_comparison_request"))
    has_enough_context = bool(analysis.get("has_enough_context"))
    clarifying_question = analysis.get("clarifying_question")
    search_query = analysis.get("search_query") or latest_user_message
    comparison_targets = analysis.get("comparison_targets") or []
    is_refinement = bool(analysis.get("is_refinement")) and _prior_assistant_gave_recommendations(messages)

    forced_by_turn_cap = turn_count >= settings.max_turns - 1

    # ---- 3. Comparison branch ----
    if is_comparison:
        items = comparison_engine.resolve_targets(comparison_targets, fallback_query=latest_user_message)
        payload = comparison_engine.build_comparison_payload(items)
        reply_text = gemini_service.generate_comparison(conversation_text, payload)
        recs = build_recommendations([(item, 0.9) for item in items]) if items else []
        return ChatResponse(reply=reply_text, recommendations=recs, end_of_conversation=False)

    # ---- 4. Clarify branch ----
    if not has_enough_context and not forced_by_turn_cap:
        question = clarifying_question or "Could you tell me more about the role and level you're hiring for?"
        return ChatResponse(reply=question, recommendations=[], end_of_conversation=False)

    # ---- 5. Retrieve + Recommend (+ Refine) branch ----
    if not retriever.is_ready:
        return ChatResponse(
            reply=(
                "I'm having trouble reaching the SHL catalog right now, so I can't "
                "responsibly recommend an assessment. Please try again shortly."
            ),
            recommendations=[],
            end_of_conversation=False,
        )

    top_k = settings.default_top_k
    scored_items = retriever.search(search_query, top_k=top_k)

    if not scored_items:
        return ChatResponse(
            reply=(
                "I couldn't find a strong match in the SHL catalog for that. "
                "Could you share the specific role, key skills, or seniority level?"
            ),
            recommendations=[],
            end_of_conversation=False,
        )

    recommendations = build_recommendations(scored_items)
    retrieved_public = [
        {
            "name": r.name,
            "test_type": r.test_type,
            "description": r.description or "",
        }
        for r in recommendations
    ]

    reply_text = gemini_service.generate_reply(
        conversation_text=conversation_text,
        context_summary=_context_summary(messages),
        retrieved_items=retrieved_public,
    )

    user_signals_done = bool(analysis.get("user_signals_done"))
    end_of_conversation = user_signals_done or forced_by_turn_cap

    if is_refinement:
        reply_text = reply_text if reply_text else "Updated your shortlist based on the new details."

    return ChatResponse(
        reply=reply_text,
        recommendations=recommendations,
        end_of_conversation=end_of_conversation,
    )
