"""SQLAlchemy database models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime

from .database import Base


class Todo(Base):
    """Todo item model."""

    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    created_by = Column(String, default="web")  # Telegram username or "web"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    """Authorized user model for Telegram bot."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    telegram_username = Column(String, nullable=True)
    is_authorized = Column(Boolean, default=False)
