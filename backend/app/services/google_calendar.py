"""Google Calendar API service."""

import os
import json
from datetime import datetime, timedelta
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

from ..config import get_settings
from ..schemas import CalendarEvent

settings = get_settings()

# OAuth2 scopes for Google Calendar
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

# Token storage path
TOKEN_PATH = Path(__file__).parent.parent.parent / "google_token.json"


class GoogleCalendarService:
    """Service for interacting with Google Calendar API."""

    def __init__(self):
        self.credentials: Credentials | None = None
        self._load_credentials()

    def _get_client_config(self) -> dict:
        """Build OAuth client config from environment variables."""
        redirect_uri = f"http://{settings.backend_host}:{settings.backend_port}/api/calendar/callback"
        if settings.backend_host == "0.0.0.0":
            redirect_uri = f"http://localhost:{settings.backend_port}/api/calendar/callback"

        return {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        }

    def _load_credentials(self):
        """Load credentials from stored token file."""
        if TOKEN_PATH.exists():
            try:
                with open(TOKEN_PATH, "r") as f:
                    token_data = json.load(f)
                self.credentials = Credentials.from_authorized_user_info(token_data, SCOPES)

                # Refresh if expired
                if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                    self.credentials.refresh(Request())
                    self._save_credentials()
            except Exception:
                self.credentials = None

    def _save_credentials(self):
        """Save credentials to token file."""
        if self.credentials:
            with open(TOKEN_PATH, "w") as f:
                f.write(self.credentials.to_json())

    def is_authenticated(self) -> bool:
        """Check if we have valid credentials."""
        return self.credentials is not None and self.credentials.valid

    def get_auth_url(self) -> str:
        """Get the OAuth2 authorization URL."""
        flow = Flow.from_client_config(
            self._get_client_config(),
            scopes=SCOPES,
            redirect_uri=self._get_client_config()["web"]["redirect_uris"][0]
        )
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )
        return auth_url

    def handle_callback(self, code: str):
        """Handle OAuth2 callback and store credentials."""
        flow = Flow.from_client_config(
            self._get_client_config(),
            scopes=SCOPES,
            redirect_uri=self._get_client_config()["web"]["redirect_uris"][0]
        )
        flow.fetch_token(code=code)
        self.credentials = flow.credentials
        self._save_credentials()

    def _get_service(self):
        """Get the Google Calendar API service."""
        if not self.is_authenticated():
            raise Exception("Not authenticated with Google Calendar")
        return build("calendar", "v3", credentials=self.credentials)

    def get_upcoming_events(self, days: int = 7) -> list[CalendarEvent]:
        """Get upcoming calendar events for the next N days."""
        service = self._get_service()

        now = datetime.utcnow()
        time_min = now.isoformat() + "Z"
        time_max = (now + timedelta(days=days)).isoformat() + "Z"

        events_result = service.events().list(
            calendarId=settings.google_calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            maxResults=50,
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        events = events_result.get("items", [])
        return [self._parse_event(event) for event in events]

    def get_today_events(self) -> list[CalendarEvent]:
        """Get today's calendar events."""
        service = self._get_service()

        now = datetime.utcnow()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        events_result = service.events().list(
            calendarId=settings.google_calendar_id,
            timeMin=start_of_day.isoformat() + "Z",
            timeMax=end_of_day.isoformat() + "Z",
            maxResults=50,
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        events = events_result.get("items", [])
        return [self._parse_event(event) for event in events]

    def _parse_event(self, event: dict) -> CalendarEvent:
        """Parse a Google Calendar event into our schema."""
        start = event.get("start", {})
        end = event.get("end", {})

        # Handle all-day events (date) vs timed events (dateTime)
        all_day = "date" in start

        if all_day:
            start_dt = datetime.fromisoformat(start["date"])
            end_dt = datetime.fromisoformat(end["date"])
        else:
            start_dt = datetime.fromisoformat(start["dateTime"].replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end["dateTime"].replace("Z", "+00:00"))

        return CalendarEvent(
            id=event.get("id", ""),
            title=event.get("summary", "No Title"),
            start=start_dt,
            end=end_dt,
            all_day=all_day,
            location=event.get("location"),
            description=event.get("description")
        )
