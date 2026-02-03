"""Pydantic schemas for request/response validation."""

from datetime import datetime
from pydantic import BaseModel


# Todo Schemas
class TodoBase(BaseModel):
    """Base schema for todo items."""
    title: str


class TodoCreate(TodoBase):
    """Schema for creating a todo."""
    created_by: str = "web"


class TodoUpdate(BaseModel):
    """Schema for updating a todo."""
    title: str | None = None
    completed: bool | None = None


class TodoResponse(TodoBase):
    """Schema for todo response."""
    id: int
    completed: bool
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Calendar Schemas
class CalendarEvent(BaseModel):
    """Schema for calendar event."""
    id: str
    title: str
    start: datetime
    end: datetime
    all_day: bool = False
    location: str | None = None
    description: str | None = None


class CalendarEventsResponse(BaseModel):
    """Schema for calendar events response."""
    events: list[CalendarEvent]
    calendar_connected: bool = True


# Health Check
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    telegram_bot: bool
    google_calendar: bool
