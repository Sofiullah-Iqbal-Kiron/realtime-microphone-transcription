FROM python:3.12-slim

WORKDIR /app

# System dependencies for faster-whisper
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy project files
COPY pyproject.toml .
COPY alembic.ini .

# Install dependencies
RUN uv sync --no-dev --no-install-project

# Copy application code
COPY . .

# Download whisper model at build time for faster startup
RUN uv run python -c "from faster_whisper import WhisperModel; WhisperModel('tiny', device='cpu', compute_type='int8')"

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
