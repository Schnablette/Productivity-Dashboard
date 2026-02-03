"""Google Calendar integration endpoints."""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from ..schemas import CalendarEventsResponse
from ..services.google_calendar import GoogleCalendarService
from ..config import get_settings

router = APIRouter(prefix="/api/calendar", tags=["calendar"])
settings = get_settings()

# Initialize calendar service
calendar_service = GoogleCalendarService()


@router.get("/auth")
async def auth():
    """Initiate Google OAuth2 flow."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=500,
            detail="Google Calendar credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )

    auth_url = calendar_service.get_auth_url()
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(code: str, request: Request):
    """Handle OAuth2 callback from Google."""
    try:
        calendar_service.handle_callback(code)
        return RedirectResponse(url=f"{settings.frontend_url}?calendar_connected=true")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to complete OAuth: {str(e)}")


@router.get("/events", response_model=CalendarEventsResponse)
async def get_events(days: int = 7):
    """Get calendar events for the next N days."""
    if not calendar_service.is_authenticated():
        return CalendarEventsResponse(events=[], calendar_connected=False)

    try:
        events = calendar_service.get_upcoming_events(days=days)
        return CalendarEventsResponse(events=events, calendar_connected=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")


@router.get("/today", response_model=CalendarEventsResponse)
async def get_today_events():
    """Get today's calendar events."""
    if not calendar_service.is_authenticated():
        return CalendarEventsResponse(events=[], calendar_connected=False)

    try:
        events = calendar_service.get_today_events()
        return CalendarEventsResponse(events=events, calendar_connected=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")


@router.get("/status")
async def calendar_status():
    """Check if Google Calendar is connected."""
    return {
        "connected": calendar_service.is_authenticated(),
        "calendar_id": settings.google_calendar_id if calendar_service.is_authenticated() else None
    }
