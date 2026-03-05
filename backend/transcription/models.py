# python
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

# sqlalchemy
from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

# local
from core.db import Base

if TYPE_CHECKING:
    from auth.models import User


class TranscriptionSession(Base):
    __tablename__ = "transcription_sessions"

    # Essentials.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique identifier for the transcription session.",
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Owner of this transcription session.",
    )
    transcript: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default="",
        comment="Final transcribed text.",
    )
    duration: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Duration of the recording in seconds.",
    )
    word_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        default=0,
        comment="Number of words in the final transcript.",
    )
    language: Mapped[str] = mapped_column(
        String(10),
        default="en",
        server_default="en",
        comment="Language code used for transcription.",
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        server_default="active",
        comment="Session status: active or completed.",
    )

    # Timestamps.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="When the session was started.",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="When the session was last updated.",
    )

    # Relationships.
    user: Mapped[User] = relationship("User", back_populates="transcription_sessions", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TranscriptionSession: {self.id} | user={self.user_id} | {self.status}>"
