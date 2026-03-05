# Real-Time Microphone Transcription

A full-stack real-time speech-to-text web application with **user authentication**. Audio captured from the browser microphone is streamed to a FastAPI backend via WebSocket, transcribed using **Faster-Whisper (tiny model)** on CPU, and displayed live in the Next.js frontend.

---

## Architecture Overview

```
┌─────────────┐  WebSocket (PCM audio)   ┌──────────────────┐
│   Next.js   │ ───────────────────────▸  │   FastAPI         │
│   Frontend  │ ◂─────────────────────── │   Backend         │
│  (React 19) │  JSON partial/final text  │  (Faster-Whisper) │
└─────────────┘                           └────────┬─────────┘
                                                   │
                                            ┌──────▼──────┐
                                            │  PostgreSQL  │
                                            └─────────────┘
```

### Design Decisions

| Decision                          | Rationale                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| **Faster-Whisper (tiny)**         | Best CPU-only accuracy-to-speed ratio. Uses CTranslate2 for optimized int8 inference.       |
| **WebSocket streaming**           | Low-latency bidirectional communication for real-time audio + transcription.                |
| **ScriptProcessorNode** (browser) | Captures raw 16-bit PCM at 16 kHz — exactly what Whisper expects.                           |
| **Django-style app structure**    | `auth/` and `transcription/` apps are self-contained with models, schemas, views, services. |
| **JWT Authentication**            | Stateless access/refresh token pair. WebSocket auth via `?token=` query param.              |
| **itsdangerous tokens**           | Secure email verification and password reset links (URLSafeTimedSerializer).                |
| **Gmail SMTP**                    | Transactional email for verification and password reset flows.                              |
| **Async SQLAlchemy + asyncpg**    | Non-blocking DB calls to match FastAPI's async architecture.                                |
| **Zustand**                       | Lightweight global state for transcription status, avoiding prop drilling.                  |
| **SWR**                           | Stale-while-revalidate data fetching with auto-refresh for the sessions list.               |

### Database Schema

```
users
├── id                 INTEGER  (PK, auto-increment)
├── email              VARCHAR(255) (unique, indexed)
├── hashed_password    VARCHAR(255)
├── is_email_verified  BOOLEAN  (default false)
├── is_active          BOOLEAN  (default false, true after email verified)
├── is_admin           BOOLEAN  (default false)
├── first_name         VARCHAR(128) (nullable)
├── last_name          VARCHAR(128) (nullable)
├── profile_picture    VARCHAR(500) (nullable)
├── created_by_id      INTEGER  (FK → users.id, nullable)
├── last_login         TIMESTAMPTZ (nullable)
└── date_joined        TIMESTAMPTZ (server default now())

transcription_sessions
├── id           UUID  (PK, auto-generated)
├── user_id      INTEGER (FK → users.id, CASCADE, indexed)
├── transcript   TEXT  (nullable)
├── duration     FLOAT (seconds)
├── word_count   INTEGER
├── language     VARCHAR(10)  default 'en'
├── status       VARCHAR(20)  default 'active' → 'completed'
├── created_at   TIMESTAMPTZ
└── updated_at   TIMESTAMPTZ
```

---

## Project Structure

```
├── docker-compose.yml
├── backend/
│   ├── main.py                    # FastAPI app entry point, lifespan, CORS
│   ├── pyproject.toml             # UV project config & dependencies
│   ├── alembic.ini                # Alembic configuration
│   ├── alembic/
│   │   ├── env.py                 # Async Alembic environment
│   │   └── versions/
│   │       ├── 0001_create_transcription_sessions.py
│   │       ├── 0002_create_users_table.py
│   │       └── 0003_add_user_id_to_sessions.py
│   ├── core/                      # Shared infrastructure
│   │   ├── config.py              # Pydantic settings (.env)
│   │   ├── database.py            # Async engine, session, Base
│   │   └── deps.py                # FastAPI dependencies (get_db, get_current_user)
│   ├── auth/                      # Authentication app (Django-style)
│   │   ├── models.py              # User SQLAlchemy ORM model
│   │   ├── schemas.py             # Auth Pydantic schemas
│   │   ├── jwt.py                 # JWT token creation & decoding (PyJWT)
│   │   ├── password.py            # Password hashing (passlib + bcrypt)
│   │   ├── email.py               # Email verification & password reset tokens (itsdangerous + SMTP)
│   │   ├── services.py            # User CRUD operations
│   │   ├── response.py            # Shared SigninResponse factory
│   │   └── views.py               # Auth API router
│   ├── transcription/             # Transcription app (Django-style)
│   │   ├── models.py              # TranscriptionSession ORM model
│   │   ├── schemas.py             # Transcription Pydantic schemas
│   │   ├── services.py            # Session CRUD operations
│   │   ├── views.py               # REST + WebSocket router
│   │   ├── websocket.py           # WebSocket handler logic
│   │   └── whisper_engine.py      # Faster-Whisper model singleton
│   ├── tests/
│   │   └── test_api.py            # Automated API tests
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Main recording page
│   │   ├── layout.tsx             # Root layout with navigation
│   │   └── sessions/
│   │       ├── page.tsx           # Sessions list
│   │       └── [id]/page.tsx      # Session detail
│   ├── hooks/
│   │   └── use-audio-transcription.ts  # WebSocket + microphone hook
│   ├── lib/
│   │   ├── api.ts                 # Axios instance
│   │   ├── sessions.ts            # API fetchers
│   │   ├── store.ts               # Zustand store
│   │   └── utils.ts               # Tailwind merge utility
│   ├── components/ui/             # Shadcn/ui components
│   ├── Dockerfile
│   └── package.json
└── README.md
```

---

## Prerequisites

- **Docker** and **Docker Compose** (recommended)
- Or for local development:
    - Python 3.12+
    - Node.js 20+
    - PostgreSQL 15+
    - [UV](https://docs.astral.sh/uv/) package manager

---

## Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd real-time-microphone-transcription

# Start all services
docker compose up --build

# The app will be available at:
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## Local Development Setup

### 1. Database

```bash
# Start PostgreSQL (or use your existing instance)
docker run -d \
  --name transcription-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=transcription_db \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies with UV
uv sync

# Run database migrations
uv run alembic upgrade head

# Start the server
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **Note:** On first startup, the Faster-Whisper tiny model (~75 MB) will be downloaded automatically.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## API Usage

### Health Check

```bash
curl http://localhost:8000/health
```

```json
{ "status": "healthy", "version": "1.0.0" }
```

### Authentication

#### Signup

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "StrongP@ss1", "first_name": "John", "last_name": "Doe"}'
```

```json
{
	"message": "Account created. Please check your email to verify your account."
}
```

#### Verify Email

```bash
curl -X POST http://localhost:8000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "<token-from-email-link>"}'
```

Returns `SigninResponse` with access/refresh tokens.

#### Signin

```bash
curl -X POST http://localhost:8000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "StrongP@ss1"}'
```

```json
{
	"access_token": "eyJhbGciOiJIUzI1NiIs...",
	"refresh_token": "eyJhbGciOiJIUzI1NiIs...",
	"token_type": "bearer",
	"expires_in": 1800,
	"user": {
		"id": 1,
		"email": "user@example.com",
		"first_name": "John",
		"last_name": "Doe",
		"is_email_verified": true,
		"is_active": true
	}
}
```

#### Refresh Token

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<refresh_token>"}'
```

#### Password Reset

```bash
# Request reset email
curl -X POST http://localhost:8000/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Confirm reset with token from email
curl -X POST http://localhost:8000/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"token": "<token-from-email>", "new_password": "NewP@ss123"}'
```

#### Get Current User

```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <access_token>"
```

### Sessions (requires authentication)

All session endpoints require the `Authorization: Bearer <access_token>` header.

#### Get All Sessions

```bash
curl http://localhost:8000/sessions \
  -H "Authorization: Bearer <access_token>"
```

```json
{
	"count": 2,
	"sessions": [
		{
			"id": "a1b2c3d4-...",
			"user_id": 1,
			"duration": 12.5,
			"word_count": 45,
			"language": "en",
			"status": "completed",
			"created_at": "2025-01-15T10:30:00Z"
		}
	]
}
```

### Get Specific Session

```bash
curl http://localhost:8000/sessions/{session_id} \
  -H "Authorization: Bearer <access_token>"
```

### WebSocket Transcription (requires authentication)

```
ws://localhost:8000/ws/transcribe?token=<access_token>
```

**Protocol:**

1. Client connects with JWT token as query param
2. Server validates token → sends `{"type": "session_created", "session_id": "..."}`
3. Client sends binary frames (16-bit PCM, 16 kHz, mono)
4. Server sends `{"type": "partial", "text": "...", "word_count": N}`
5. Client sends `{"type": "stop"}` to finalize
6. Server sends `{"type": "final", "text": "...", "word_count": N, "duration": F, "session_id": "..."}`

---

## Environment Variables

| Variable                 | Default                                                                  | Description                                 |
| ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------- |
| `DATABASE_URL`           | `postgresql+asyncpg://postgres:postgres@localhost:5432/transcription_db` | Async PostgreSQL connection string          |
| `DEBUG`                  | `false`                                                                  | Enable debug logging                        |
| `FRONTEND_URL`           | `http://localhost:3000`                                                  | Frontend URL (used in email links)          |
| `CORS_ORIGINS`           | `["http://localhost:3000"]`                                              | Allowed CORS origins                        |
| `SECRET_KEY`             | `change-me-to-a-real-secret-key`                                         | JWT signing key (**change in production!**) |
| `ACCESS_TOKEN_LIFETIME`  | `30`                                                                     | Access token lifetime in minutes            |
| `REFRESH_TOKEN_LIFETIME` | `7`                                                                      | Refresh token lifetime in days              |
| `SMTP_HOST`              | `smtp.gmail.com`                                                         | SMTP server host                            |
| `SMTP_PORT`              | `587`                                                                    | SMTP server port                            |
| `SMTP_USER`              | _(empty)_                                                                | Gmail address for sending emails            |
| `SMTP_PASSWORD`          | _(empty)_                                                                | Gmail app password                          |
| `EMAIL_FROM_NAME`        | `Transcription App`                                                      | Sender display name                         |
| `EMAIL_TOKEN_EXPIRY`     | `3600`                                                                   | Email token lifetime in seconds             |
| `WHISPER_MODEL_SIZE`     | `tiny`                                                                   | Whisper model size                          |
| `WHISPER_DEVICE`         | `cpu`                                                                    | Inference device                            |
| `WHISPER_COMPUTE_TYPE`   | `int8`                                                                   | CTranslate2 compute type                    |

> **Gmail App Password**: Go to your Google Account → Security → 2-Step Verification → App passwords → Generate a new app password for "Mail".

---

## Running Tests

```bash
cd backend
uv run pytest -v
```

---

## Limitations & Future Improvements

### Current Limitations

- **CPU-only inference**: Transcription speed depends on CPU power; may lag on low-end machines
- **Single language**: Currently defaults to English; multi-language detection could be added
- **ScriptProcessorNode**: Deprecated Web Audio API — should migrate to AudioWorklet for production

### Future Improvements

- AudioWorklet for better audio processing performance
- Speaker diarization (who said what)
- Multi-language auto-detection
- OAuth2 social login (Google, GitHub)
- Export transcripts (TXT, SRT, VTT)
- Real-time confidence scores
- Pagination for sessions list
- WebSocket reconnection with resume capability

---

## License

This project was developed as an interview assignment for Alpha Net.
