# python
import uuid
from datetime import datetime

# pydantic
from pydantic import BaseModel, ConfigDict


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: int
    transcript: str | None
    duration: float | None
    word_count: int | None
    language: str
    status: str
    created_at: datetime
    updated_at: datetime


class SessionListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: int
    duration: float | None
    word_count: int | None
    language: str
    status: str
    created_at: datetime


class SessionsListOut(BaseModel):
    count: int
    sessions: list[SessionListResponse]


class TranscriptionMessage(BaseModel):
    """WebSocket message schema for transcription results."""

    type: str  # "partial", "final", "error", "session_created"
    text: str = ""
    session_id: str | None = None
    is_final: bool = False
    word_count: int = 0
    duration: float = 0.0
