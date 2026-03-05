# python
from enum import StrEnum
from functools import lru_cache

# pydantic
from pydantic_settings import BaseSettings, SettingsConfigDict


ONE_SECOND = 1
ONE_MINUTE = 60 * ONE_SECOND
ONE_HOUR = 60 * ONE_MINUTE
ONE_DAY = 24 * ONE_HOUR
ONE_WEEK = 7 * ONE_DAY


class EnvironmentChoices(StrEnum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Settings(BaseSettings):
    # Application.
    ENVIRONMENT: EnvironmentChoices = EnvironmentChoices.DEVELOPMENT
    APP_NAME: str = "Real-Time Transcription API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:3000"

    # Database.
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/transcription_db"

    # CORS.
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # JWT Auth.
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_LIFETIME: int = ONE_DAY
    REFRESH_TOKEN_LIFETIME: int = ONE_WEEK

    # Email (Gmail SMTP).
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM_NAME: str = "Transcription App"
    EMAIL_TOKEN_EXPIRY: int = ONE_HOUR

    # Whisper Model.
    WHISPER_MODEL_SIZE: str = "tiny"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    # Audio.
    AUDIO_SAMPLE_RATE: int = 16000
    TRANSCRIPTION_INTERVAL_SECONDS: float = 1.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Lifetime cache.
@lru_cache
def get_settings() -> Settings:
    return Settings()


# Following Singleton Pattern.
settings = get_settings()
