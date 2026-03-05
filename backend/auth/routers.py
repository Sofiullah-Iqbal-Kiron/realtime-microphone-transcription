# python
from asyncio import to_thread

# fastapi
from fastapi import APIRouter, Depends, status

# sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession

# local
from auth.models import User
from auth.utils.jwt import decode_refresh_token
from auth.utils.password import verify_password
from auth.utils.response import create_signin_response
from auth.utils.email import (
    send_password_reset_email,
    send_verification_email,
    verify_email_verification_token,
    verify_password_reset_token,
)
from auth.schemas import (
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    SigninRequest,
    SigninResponse,
    SignupRequest,
    UserResponse,
    VerifyEmailRequest,
)
from auth.utils.user import (
    activate_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_last_login,
    update_password,
)
from core.db import get_db
from core.deps import get_current_user
from core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    """Register a new user and send a verification email."""

    existing = await get_user_by_email(db, request.email)
    if existing:
        raise ConflictException("A user with this email already exists.")

    await create_user(
        db,
        email=request.email,
        password=request.password,
        first_name=request.first_name,
        last_name=request.last_name,
    )

    # Send verification email in background thread (SMTP is blocking)
    await to_thread(send_verification_email, request.email)

    return MessageResponse(message="Account created. Please check your email to verify your account.")


@router.post("/signin", response_model=SigninResponse)
async def signin(request: SigninRequest, db: AsyncSession = Depends(get_db)) -> SigninResponse:
    """Authenticate with email and password."""
    
    user = await get_user_by_email(db, request.email)
    if user is None or not verify_password(request.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password.")

    if not user.is_email_verified:
        raise ForbiddenException("Email not verified. Please verify your email first.")

    if not user.is_active:
        raise ForbiddenException("Account is inactive. Please contact support.")

    await update_last_login(db, user)

    return create_signin_response(user)


@router.post("/verify-email", response_model=SigninResponse)
async def verify_email(request: VerifyEmailRequest, db: AsyncSession = Depends(get_db)) -> SigninResponse:
    """Verify user email with the token from the verification link."""

    email = verify_email_verification_token(request.token)
    if email is None:
        raise BadRequestException("Invalid or expired verification token.")

    user = await get_user_by_email(db, email)
    if user is None:
        raise NotFoundException("User not found.")

    if user.is_email_verified:
        raise BadRequestException("Email is already verified.")

    user = await activate_user(db, user)
    await update_last_login(db, user)

    return create_signin_response(user)


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(request: PasswordResetRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    """Resend the verification email to the given address."""

    user = await get_user_by_email(db, request.email)
    if user and not user.is_email_verified:
        await to_thread(send_verification_email, request.email)

    # Always return success to avoid email enumeration.
    return MessageResponse(message="If the email is registered and unverified, a verification link has been sent.")


@router.post("/password-reset", response_model=MessageResponse)
async def request_password_reset(request: PasswordResetRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    """Send a password-reset link to the user's email."""

    user = await get_user_by_email(db, request.email)
    if user and user.is_active:
        await to_thread(send_password_reset_email, request.email)

    # Always return success to avoid email enumeration.
    return MessageResponse(message="If the email is registered, a password reset link has been sent.")


@router.post("/password-reset/confirm", response_model=SigninResponse)
async def confirm_password_reset(request: PasswordResetConfirm, db: AsyncSession = Depends(get_db)) -> SigninResponse:
    """Reset the user's password using the token from the reset link."""

    email = verify_password_reset_token(request.token)
    if email is None:
        raise BadRequestException("Invalid or expired password reset token.")

    user = await get_user_by_email(db, email)
    if user is None:
        raise NotFoundException("User not found.")

    if not user.is_active:
        raise ForbiddenException("Account is inactive or has been deactivated.")

    user = await update_password(db, user, request.new_password)
    await update_last_login(db, user)

    return create_signin_response(user)


@router.post("/refresh", response_model=SigninResponse)
async def refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> SigninResponse:
    """Exchange a valid refresh token for a new access/refresh token pair."""

    payload = decode_refresh_token(request.refresh_token)
    if payload is None:
        raise UnauthorizedException("Invalid or expired refresh token.")

    user = await get_user_by_id(db, payload["sub"])
    if user is None or not user.is_active:
        raise UnauthorizedException("User not found or inactive.")

    return create_signin_response(user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user's profile."""
    
    return current_user
