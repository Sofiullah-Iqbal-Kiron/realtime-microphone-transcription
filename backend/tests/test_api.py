# python
import uuid
from collections.abc import AsyncGenerator

# third-party
import pytest
import pytest_asyncio
from unittest.mock import patch, AsyncMock

from httpx import AsyncClient, ASGITransport, Response
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# local
from core.db import Base, get_db
from main import app


# ---------------------------------------------------------------------------
# Fixtures – in-memory SQLite async engine for testing
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    """Create tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Helper – register, verify, sign in
# ---------------------------------------------------------------------------

SIGNUP_PAYLOAD = {
    "email": "test@example.com",
    "password": "StrongP@ss1",
    "first_name": "Test",
    "last_name": "User",
}


async def _signup(client: AsyncClient, payload: dict | None = None) -> Response:
    """Register a new user (email sending is mocked)."""
    return await client.post("/auth/signup", json=payload or SIGNUP_PAYLOAD)


async def _activate_user_directly(email: str = "test@example.com") -> None:
    """Manually activate user in DB (bypass email verification)."""
    async with TestSessionLocal() as session:
        from sqlalchemy import update, func
        from auth.models import User
        await session.execute(
            update(User)
            .where(func.lower(User.email) == email.lower())
            .values(is_email_verified=True, is_active=True)
        )
        await session.commit()


async def _signin(client: AsyncClient, email: str = "test@example.com", password: str = "StrongP@ss1") -> Response:
    """Signin and return the response."""
    return await client.post("/auth/signin", json={"email": email, "password": password})


async def _get_auth_header(client: AsyncClient) -> dict[str, str]:
    """Register, activate, sign in, and return an Authorization header."""
    with patch("auth.routers.to_thread", new_callable=AsyncMock):
        await _signup(client)
    await _activate_user_directly()
    resp = await _signin(client)
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    """Health endpoint should return 200."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


# ---------------------------------------------------------------------------
# Auth – Signup
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient) -> None:
    """POST /auth/signup should create a user and return 201."""
    with patch("auth.routers.to_thread", new_callable=AsyncMock):
        response = await _signup(client)
    assert response.status_code == 201
    data = response.json()
    assert "message" in data


@pytest.mark.asyncio
async def test_signup_duplicate(client: AsyncClient) -> None:
    """POST /auth/signup with existing email should return 409."""
    with patch("auth.routers.to_thread", new_callable=AsyncMock):
        await _signup(client)
        response = await _signup(client)
    assert response.status_code == 409


# ---------------------------------------------------------------------------
# Auth – Signin
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_signin_unverified(client: AsyncClient) -> None:
    """Signing in before email verification should return 403."""
    with patch("auth.routers.to_thread", new_callable=AsyncMock):
        await _signup(client)
    response = await _signin(client)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_signin_success(client: AsyncClient) -> None:
    """Signing in with valid, verified credentials should return tokens."""
    with patch("auth.routers.to_thread", new_callable=AsyncMock):
        await _signup(client)
    await _activate_user_directly()
    response = await _signin(client)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data


@pytest.mark.asyncio
async def test_signin_wrong_password(client: AsyncClient) -> None:
    """Wrong password should return 401."""
    with patch("auth.routers.to_thread", new_callable=AsyncMock):
        await _signup(client)
    await _activate_user_directly()
    response = await _signin(client, password="WrongPass1")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Auth – Me
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient) -> None:
    """GET /auth/me with valid token should return user info."""
    headers = await _get_auth_header(client)
    response = await client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient) -> None:
    """GET /auth/me without token should return 403."""
    response = await client.get("/auth/me")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Auth – Refresh
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient) -> None:
    """POST /auth/refresh with valid refresh token should return new tokens."""
    with patch("auth.routers.to_thread", new_callable=AsyncMock):
        await _signup(client)
    await _activate_user_directly()
    signin_resp = await _signin(client)
    refresh_token = signin_resp.json()["refresh_token"]

    response = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


# ---------------------------------------------------------------------------
# Auth – Password Reset Request
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_password_reset_request(client: AsyncClient) -> None:
    """POST /auth/password-reset should always return 200 (anti-enumeration)."""
    with patch("auth.routers.to_thread", new_callable=AsyncMock):
        response = await client.post(
            "/auth/password-reset",
            json={"email": "nonexistent@example.com"},
        )
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Sessions – Auth required
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_sessions_unauthenticated(client: AsyncClient) -> None:
    """GET /sessions without auth should return 403."""
    response = await client.get("/sessions")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_sessions_empty(client: AsyncClient) -> None:
    """GET /sessions with auth should return empty list initially."""
    headers = await _get_auth_header(client)
    response = await client.get("/sessions", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert data["sessions"] == []


@pytest.mark.asyncio
async def test_get_session_not_found(client: AsyncClient) -> None:
    """GET /sessions/{id} with non-existent id should return 404."""
    headers = await _get_auth_header(client)
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/sessions/{fake_id}", headers=headers)
    assert response.status_code == 404
