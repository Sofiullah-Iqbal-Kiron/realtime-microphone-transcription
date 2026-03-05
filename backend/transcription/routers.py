# python
import uuid

# fastapi
from fastapi import APIRouter, Depends, WebSocket, Query

# sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession

# local
from auth.utils.jwt import decode_access_token
from auth.models import User
from auth.utils.user import get_user_by_id
from core.db import get_db
from core.deps import get_current_user
from core.exceptions import NotFoundException
from transcription.schemas import SessionResponse, SessionsListOut
from transcription.services import get_session, get_user_sessions
from transcription.websocket import websocket_transcription

router = APIRouter(tags=["transcription"])


# ── REST Endpoints ───────────────────────────────────────────────────────────

@router.get("/sessions", response_model=SessionsListOut)
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionsListOut:
    """Retrieve all saved transcription sessions for the current user."""
    sessions = await get_user_sessions(db, current_user.id)
    return SessionsListOut(count=len(sessions), sessions=sessions)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def retrieve_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionResponse:
    """Retrieve transcript and metadata for a specific session."""
    session = await get_session(db, session_id)
    if session is None or session.user_id != current_user.id:
        raise NotFoundException("Session not found.")
    return session


# ── WebSocket Endpoint ───────────────────────────────────────────────────────

@router.websocket("/ws/transcribe")
async def ws_transcribe(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    WebSocket endpoint for real-time audio transcription.

    Authenticate via query param: ws://…/ws/transcribe?token=<access_token>
    """
    # Validate JWT before accepting the connection
    payload = decode_access_token(token)
    if payload is None:
        await websocket.close(code=4001, reason="Invalid or expired token.")
        return

    user = await get_user_by_id(db, user_id=payload["sub"])
    if user is None or not user.is_active:
        await websocket.close(code=4003, reason="User not found or inactive.")
        return

    await websocket_transcription(websocket, db, user)
