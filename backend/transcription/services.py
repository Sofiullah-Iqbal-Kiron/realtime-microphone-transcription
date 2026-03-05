# python
import uuid

# sqlalchemy
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

# local
from transcription.models import TranscriptionSession


async def create_session(
    db: AsyncSession,
    user_id: int,
    language: str = "en",
) -> TranscriptionSession:
    """Create a new active transcription session for the given user."""
    session = TranscriptionSession(
        user_id=user_id,
        language=language,
        status="active",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> TranscriptionSession | None:
    """Fetch a single session by its UUID."""
    result = await db.execute(
        select(TranscriptionSession).where(TranscriptionSession.id == session_id)
    )
    return result.scalar_one_or_none()


async def get_user_sessions(
    db: AsyncSession,
    user_id: int,
) -> list[TranscriptionSession]:
    """Fetch all sessions belonging to a specific user, newest first."""
    result = await db.execute(
        select(TranscriptionSession)
        .where(TranscriptionSession.user_id == user_id)
        .order_by(desc(TranscriptionSession.created_at))
    )
    return list(result.scalars().all())


async def update_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    transcript: str,
    duration: float,
    word_count: int,
) -> TranscriptionSession | None:
    """Finalise a session with the transcription result."""
    session = await get_session(db, session_id)
    if session is None:
        return None

    session.transcript = transcript
    session.duration = duration
    session.word_count = word_count
    session.status = "completed"
    await db.commit()
    await db.refresh(session)
    return session
