# Real-Time Microphone Transcription

A full-stack real-time speech-to-text application. Audio from the browser microphone is streamed via WebSocket to a FastAPI backend, transcribed using Faster-Whisper, and displayed live in the Next.js frontend. Includes JWT authentication, email verification, and session history.

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy (async), Faster-Whisper, Alembic, PostgreSQL
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Shadcn/ui, Zustand, SWR
- **Infra:** Docker Compose, UV (Python), npm

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose, **or**:
  - Python 3.12+ with [UV](https://docs.astral.sh/uv/)
  - Node.js 20+
  - PostgreSQL 16+

## Quick Start (Docker)

```bash
git clone <repository-url>
cd real-time-microphone-transcription
docker compose up --build
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:8000         |
| API Docs | http://localhost:8000/docs    |

## Local Development

### 1. Database

```bash
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
cp .env.example .env          # Edit .env with your settings
uv sync                       # Install dependencies
uv run alembic upgrade head   # Run migrations
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> The Faster-Whisper tiny model (~75 MB) downloads automatically on first startup.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local    # Edit if backend is not on localhost:8000
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment Variables

### Backend (`backend/.env`)

| Variable                 | Default                                                                  | Description                        |
| ------------------------ | ------------------------------------------------------------------------ | ---------------------------------- |
| `DATABASE_URL`           | `postgresql+asyncpg://postgres:postgres@localhost:5432/transcription_db` | PostgreSQL connection string       |
| `JWT_SECRET_KEY`         | _(required)_                                                             | JWT signing secret                 |
| `ACCESS_TOKEN_LIFETIME`  | `86400`                                                                  | Access token lifetime (seconds)    |
| `REFRESH_TOKEN_LIFETIME` | `604800`                                                                 | Refresh token lifetime (seconds)   |
| `SMTP_USER`              | _(empty)_                                                                | Gmail address for sending emails   |
| `SMTP_PASSWORD`          | _(empty)_                                                                | Gmail app password                 |
| `FRONTEND_URL`           | `http://localhost:3000`                                                  | Used in email verification links   |
| `CORS_ORIGINS`           | `["http://localhost:3000"]`                                              | Allowed CORS origins               |
| `WHISPER_MODEL_SIZE`     | `tiny`                                                                   | Whisper model (`tiny`, `base`, etc.) |

### Frontend (`frontend/.env.local`)

| Variable                    | Default                  | Description         |
| --------------------------- | ------------------------ | ------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  | `http://127.0.0.1:8000`  | Backend API URL     |
| `NEXT_PUBLIC_WS_BASE_URL`   | `ws://127.0.0.1:8000`    | Backend WebSocket URL |

## Running Tests

```bash
cd backend
uv run pytest -v
```

## License

Developed as an interview assignment for Alpha Net.
