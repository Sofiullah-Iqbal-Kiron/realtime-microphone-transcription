# python
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# itsdangerous
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

# local
from core.config import settings


logger = logging.getLogger(__name__)

_serializer = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)


def generate_email_verification_token(email: str) -> str:
    """Generate a URL-safe token for email verification."""
    return _serializer.dumps(email, salt="email-verification")


def verify_email_verification_token(token: str) -> str | None:
    """
    Decode an email-verification token.

    Returns the email on success, or None if invalid/expired.
    """
    try:
        email: str = _serializer.loads(
            token,
            salt="email-verification",
            max_age=settings.EMAIL_TOKEN_EXPIRY,
        )
        return email
    except (BadSignature, SignatureExpired):
        return None


def generate_password_reset_token(email: str) -> str:
    """Generate a URL-safe token for password reset."""
    return _serializer.dumps(email, salt="password-reset")


def verify_password_reset_token(token: str) -> str | None:
    """
    Decode a password-reset token.

    Returns the email on success, or None if invalid/expired.
    """
    try:
        email: str = _serializer.loads(
            token,
            salt="password-reset",
            max_age=settings.EMAIL_TOKEN_EXPIRY,
        )
        return email
    except (BadSignature, SignatureExpired):
        return None


def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Send an email via Gmail SMTP. Fails silently with a log on error."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured – email not sent to %s", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info("Email sent to %s: %s", to_email, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)


def send_verification_email(email: str) -> None:
    """Send an account-verification email with a unique token link."""
    token = generate_email_verification_token(email)
    link = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"

    html = f"""
    <h2>Verify Your Email</h2>
    <p>Click the link below to verify your email address and activate your account:</p>
    <p><a href="{link}">{link}</a></p>
    <p>This link expires in {settings.EMAIL_TOKEN_EXPIRY // 60} minutes.</p>
    """
    _send_email(email, "Verify Your Email -- Transcription App", html)


def send_password_reset_email(email: str) -> None:
    """Send a password-reset email with a unique token link."""
    token = generate_password_reset_token(email)
    link = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"

    html = f"""
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password:</p>
    <p><a href="{link}">{link}</a></p>
    <p>This link expires in {settings.EMAIL_TOKEN_EXPIRY // 60} minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
    """
    _send_email(email, "Reset Your Password -- Transcription App", html)
