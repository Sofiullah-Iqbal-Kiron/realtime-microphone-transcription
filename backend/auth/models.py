# python
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

# sqlalchemy
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

# local
from core.db import Base

if TYPE_CHECKING:
    from transcription.models import TranscriptionSession


class User(Base):
    __tablename__ = "users"

    # Essentials.
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True,
        comment="Unique, auto-incrementing identifier for the user.",
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="User's email address, used for login and communication. Must be unique and properly validated.",
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Hashed password of the user, plaintext passwords are never stored.",
    )

    # Flags.
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        server_default="false",
        comment="True if user has verified email via link. Automatically set if created by admin.",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        server_default="false",
        comment="False until email is verified (self-register). True if created by admin.",
    )
    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        server_default="false",
        comment="Designates whether the user has full admin privileges.",
    )

    # Profile Info.
    first_name: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        comment="User's first name.",
    )
    last_name: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        comment="User's last name.",
    )
    profile_picture: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="URL to user's profile picture hosted on CDN (e.g., AWS S3).",
    )

    # Audit Trail.
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Admin user who created this user account. Null if user self-registered.",
    )
    created_by: Mapped[User | None] = relationship(
        "User",
        remote_side=[id],
        foreign_keys=[created_by_id],
        lazy="selectin",
    )

    # Reverse relation to transcription sessions.
    transcription_sessions: Mapped[list[TranscriptionSession]] = relationship(
        "TranscriptionSession",
        back_populates="user",
        lazy="selectin",
    )

    # Timestamps.
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of the user's last successful login. Null if never logged in.",
    )
    date_joined: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Timestamp when the user account was created.",
    )

    @property
    def full_name(self) -> str:
        names = [self.first_name, self.last_name]
        full_name = " ".join(filter(None, names)).strip()

        return full_name or "Unnamed User"

    def __repr__(self) -> str:
        role = "Admin" if self.is_admin else "User"
        status = "Active" if self.is_active else "Inactive"

        return f"<User: {self.email} | {role} | {status}>"

    def __str__(self) -> str:
        return f"{self.email} ({self.full_name})"
