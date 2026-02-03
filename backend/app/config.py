"""Configuration management for the application."""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "sqlite:///./dashboard.db"

    # Telegram Bot
    telegram_bot_token: str = ""
    authorized_users: str = ""  # Comma-separated Telegram user IDs

    # Google Calendar
    google_client_id: str = ""
    google_client_secret: str = ""
    google_calendar_id: str = "primary"

    # Application
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    @property
    def authorized_user_ids(self) -> list[int]:
        """Parse authorized users from comma-separated string."""
        if not self.authorized_users:
            return []
        return [int(uid.strip()) for uid in self.authorized_users.split(",") if uid.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
