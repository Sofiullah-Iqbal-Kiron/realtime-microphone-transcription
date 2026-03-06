# fastapi
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession

# local
from auth.models import User
from auth.utils.jwt import decode_access_token
from auth.utils.user import get_user_by_id
from core.db import get_db
from core.exceptions import ForbiddenException, UnauthorizedException


security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)) -> User:
    """Extract and validate the current user from a Bearer JWT token."""

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise UnauthorizedException("Invalid or expired token.")

    user = await get_user_by_id(db, user_id=payload["sub"])
    if user is None:
        raise UnauthorizedException("User not found.")

    if not user.is_email_verified:
        raise ForbiddenException("Email not verified. Please verify your email first.")

    if not user.is_active:
        raise ForbiddenException("Deactivated account. Please contact support.")

    return user
