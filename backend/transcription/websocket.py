# python
import asyncio
import json
import logging
import time
from typing import Any

# numpy
import numpy as np

# fastapi
from fastapi import WebSocket, WebSocketDisconnect

# sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession

# local
from auth.models import User
from core.config import settings
from transcription.schemas import TranscriptionMessage
from transcription.services import create_session, update_session
from transcription.whisper_engine import transcribe_audio

logger = logging.getLogger(__name__)


async def websocket_transcription(
    websocket: WebSocket,
    db: AsyncSession,
    user: User,
) -> None:
    """
    WebSocket handler for real-time audio transcription.

    Protocol:
    - Client sends binary audio frames (16-bit PCM, 16 kHz, mono).
    - Server responds with JSON messages:
        - {"type": "session_created", "session_id": "..."}
        - {"type": "partial", "text": "...", "word_count": N}
        - {"type": "final", "text": "...", "word_count": N, "duration": F, "session_id": "..."}
        - {"type": "error", "text": "..."}
    - Client sends JSON {"type": "stop"} to finalise.
    """
    await websocket.accept()

    # Create a new transcription session linked to the authenticated user.
    session = await create_session(db, user_id=user.id)
    session_id = str(session.id)

    await websocket.send_json(
        TranscriptionMessage(type="session_created", session_id=session_id).model_dump()
    )

    audio_buffer = bytearray()
    full_transcript = ""
    start_time = time.time()
    last_transcription_time = start_time
    transcription_lock = asyncio.Lock()

    try:
        while True:
            message = await websocket.receive()

            # Handle binary audio data.
            if "bytes" in message:
                audio_bytes: bytes = message["bytes"]
                audio_buffer.extend(audio_bytes)

                current_time = time.time()
                time_since_last = current_time - last_transcription_time

                # Transcribe periodically for partial results.
                if time_since_last >= settings.TRANSCRIPTION_INTERVAL_SECONDS:
                    async with transcription_lock:
                        last_transcription_time = current_time
                        partial_text = await asyncio.to_thread(
                            _transcribe_buffer, bytes(audio_buffer), session.language
                        )
                        if partial_text:
                            full_transcript = partial_text
                            word_count = len(partial_text.split())
                            await websocket.send_json(
                                TranscriptionMessage(
                                    type="partial",
                                    text=partial_text,
                                    word_count=word_count,
                                ).model_dump()
                            )

            # Handle text messages (control commands).
            elif "text" in message:
                try:
                    data: dict[str, Any] = json.loads(message["text"])
                except json.JSONDecodeError:
                    continue

                if data.get("type") == "stop":
                    # Final transcription with complete audio.
                    duration = time.time() - start_time

                    if len(audio_buffer) > 0:
                        async with transcription_lock:
                            final_text = await asyncio.to_thread(
                                _transcribe_buffer, bytes(audio_buffer), session.language
                            )
                            if final_text:
                                full_transcript = final_text

                    word_count = len(full_transcript.split()) if full_transcript else 0

                    # Persist to database.
                    await update_session(
                        db,
                        session.id,
                        transcript=full_transcript,
                        duration=round(duration, 2),
                        word_count=word_count,
                    )

                    await websocket.send_json(
                        TranscriptionMessage(
                            type="final",
                            text=full_transcript,
                            word_count=word_count,
                            duration=round(duration, 2),
                            session_id=session_id,
                            is_final=True,
                        ).model_dump()
                    )
                    break

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for session %s", session_id)
        # Save whatever we have on disconnect.
        duration = time.time() - start_time
        word_count = len(full_transcript.split()) if full_transcript else 0
        await update_session(
            db,
            session.id,
            transcript=full_transcript,
            duration=round(duration, 2),
            word_count=word_count,
        )
    except Exception as e:
        logger.exception("WebSocket error for session %s: %s", session_id, e)
        try:
            await websocket.send_json(
                TranscriptionMessage(type="error", text=str(e)).model_dump()
            )
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


def _transcribe_buffer(audio_bytes: bytes, language: str = "en") -> str:
    """Convert raw PCM bytes to numpy array and transcribe."""
    if len(audio_bytes) < 3200:  # minimum ~0.1s of audio at 16 kHz
        return ""

    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    return transcribe_audio(audio_array, language=language)
