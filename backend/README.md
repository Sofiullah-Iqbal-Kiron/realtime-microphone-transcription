# Backend

FastAPI backend with async SQLAlchemy, Faster-Whisper, and JWT authentication.

## Setup

```bash
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Tests

```bash
uv run pytest -v
```

## API Docs

Once running, visit http://localhost:8000/docs for the interactive Swagger UI.
