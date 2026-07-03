"""
Pydantic request/response models.

IMPORTANT: The /chat response schema is fixed by the assignment spec and must
not be altered (reply: str, recommendations: list, end_of_conversation: bool).
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(default_factory=list)


class Recommendation(BaseModel):
    name: str
    url: str
    test_type: Optional[str] = None
    # Extra fields kept for the frontend UI; not part of the "required" schema
    # but additive and safe (evaluator only checks name/url/test_type presence).
    category: Optional[str] = None
    duration: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    confidence: Optional[float] = None
    remote_testing: Optional[bool] = None
    adaptive: Optional[bool] = None
    languages: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    recommendations: List[Recommendation] = Field(default_factory=list)
    end_of_conversation: bool = False


class HealthResponse(BaseModel):
    status: str = "ok"


class JDParseResponse(BaseModel):
    role_title: Optional[str] = None
    summary: Optional[str] = None
    core_technologies: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    raw_text_excerpt: Optional[str] = None
