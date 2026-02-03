"""Main FastAPI application."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import init_db
from .routers import todos, calendar
from .services.telegram_bot import telegram_bot
from .schemas import HealthResponse

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Household Productivity Dashboard...")
    init_db()
    logger.info("Database initialized.")

    # Start Telegram bot in background
    asyncio.create_task(telegram_bot.start())

    yield

    # Shutdown
    logger.info("Shutting down...")
    await telegram_bot.stop()


app = FastAPI(
    title="Household Productivity Dashboard",
    description="A local productivity dashboard with Google Calendar and Telegram integration",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for local network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(todos.router)
app.include_router(calendar.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Household Productivity Dashboard",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    from .services.google_calendar import GoogleCalendarService

    calendar_service = GoogleCalendarService()

    return HealthResponse(
        status="healthy",
        telegram_bot=bool(settings.telegram_bot_token),
        google_calendar=calendar_service.is_authenticated()
    )
