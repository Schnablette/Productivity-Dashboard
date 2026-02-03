# Household Productivity Dashboard

A local network productivity dashboard with Google Calendar integration and Telegram bot for mobile todo input. Perfect for a wall-mounted display in your home.

## Features

- **Google Calendar Integration**: Display shared calendar events with real-time sync
- **Shared Todo List**: Accessible from the web dashboard and via Telegram
- **Telegram Bot**: Add, complete, and manage todos from your phone
- **Auto-Refresh**: Dashboard updates automatically every minute
- **Dark Theme**: Clean, readable UI optimized for wall-mounted displays

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│   FastAPI       │────▶│   SQLite DB     │
│   (Frontend)    │     │   (Backend)     │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
           ┌───────────────┐         ┌───────────────┐
           │ Telegram Bot  │         │ Google        │
           │ API           │         │ Calendar API  │
           └───────────────┘         └───────────────┘
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Telegram account
- A Google account with Calendar

## Quick Start

### 1. Clone and Setup

```bash
cd "Productivity Dashboard"

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Frontend setup (in a new terminal)
cd frontend
npm install
```

### 2. Configure Environment Variables

Edit `backend/.env` with your credentials:

```env
TELEGRAM_BOT_TOKEN=your_token_here
AUTHORIZED_USERS=your_telegram_id,spouse_telegram_id
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_ID=primary
```

### 3. Run the Application

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
python run.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Detailed Setup Guide

### Setting Up the Telegram Bot

1. **Create a Bot**:
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow the prompts
   - Choose a name (e.g., "Family Todo Bot")
   - Choose a username (e.g., "FamilyTodoBot")
   - Copy the API token provided

2. **Get Your Telegram User ID**:
   - Search for `@userinfobot` on Telegram
   - Send `/start`
   - It will reply with your User ID (a number like `123456789`)
   - Repeat for your spouse to get their ID

3. **Configure the Bot**:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   AUTHORIZED_USERS=123456789,987654321
   ```

4. **Using the Bot**:
   - `/start` - See available commands
   - `/add Buy groceries` - Add a new todo
   - `/list` - Show pending todos
   - `/done 1` - Complete todo #1
   - `/delete 1` - Delete todo #1

   Natural language also works:
   - "add todo: pick up dry cleaning"
   - "todo call mom"

### Setting Up Google Calendar

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (e.g., "Household Dashboard")
   - Enable the Google Calendar API:
     - Go to "APIs & Services" > "Library"
     - Search for "Google Calendar API"
     - Click "Enable"

2. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:8000/api/calendar/callback`
   - Copy the Client ID and Client Secret

3. **Configure OAuth Consent Screen**:
   - Go to "OAuth consent screen"
   - Select "External" (or "Internal" if using Google Workspace)
   - Fill in required fields:
     - App name: "Household Dashboard"
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `https://www.googleapis.com/auth/calendar.readonly`
   - Add your email as a test user

4. **Configure Environment**:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALENDAR_ID=primary
   ```

5. **Connect Calendar**:
   - Start the backend server
   - Open http://localhost:5173
   - Click "Connect Calendar" in the Calendar panel
   - Sign in with your Google account
   - Grant calendar read access

   For a **shared family calendar**:
   - In Google Calendar, find the calendar ID:
     - Settings > [Calendar Name] > "Integrate calendar"
     - Copy the Calendar ID (looks like: `abc123@group.calendar.google.com`)
   - Set `GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com`

### Running on Your Local Network

To access the dashboard from other devices on your network:

1. **Find Your Computer's IP**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig
   ```

   Look for an IP like `192.168.1.100`

2. **Update Configuration**:
   ```env
   FRONTEND_URL=http://192.168.1.100:5173
   ```

3. **Update Google OAuth Redirect**:
   - Go back to Google Cloud Console > Credentials
   - Edit your OAuth client
   - Add redirect URI: `http://192.168.1.100:8000/api/calendar/callback`

4. **Access from Other Devices**:
   - Open `http://192.168.1.100:5173` on any device on your network

### Wall-Mounted Display Setup

For a dedicated display (e.g., Raspberry Pi, old tablet):

1. **Auto-start the browser in kiosk mode**:
   ```bash
   # Chromium example
   chromium-browser --kiosk --noerrdialogs http://localhost:5173
   ```

2. **Prevent screen sleep** (varies by OS)

3. **Auto-start services on boot** (use systemd or similar)

---

## API Reference

### Todos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List all todos |
| GET | `/api/todos?completed=false` | List pending todos only |
| POST | `/api/todos` | Create todo |
| PUT | `/api/todos/{id}` | Update todo |
| DELETE | `/api/todos/{id}` | Delete todo |

**Create Todo**:
```bash
curl -X POST http://localhost:8000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk", "created_by": "web"}'
```

### Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/events` | Get events (next 7 days) |
| GET | `/api/calendar/today` | Get today's events |
| GET | `/api/calendar/auth` | Start OAuth flow |
| GET | `/api/calendar/status` | Check connection status |

### Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "telegram_bot": true,
  "google_calendar": true
}
```

---

## Project Structure

```
Productivity Dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Environment configuration
│   │   ├── database.py       # SQLite setup
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── todos.py      # Todo endpoints
│   │   │   └── calendar.py   # Calendar endpoints
│   │   └── services/
│   │       ├── google_calendar.py
│   │       └── telegram_bot.py
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Calendar.jsx
│   │   │   └── TodoList.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Troubleshooting

### Telegram Bot Not Responding
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check that your user ID is in `AUTHORIZED_USERS`
- Look at backend logs for errors

### Calendar Not Loading
- Ensure OAuth credentials are correct
- Check that redirect URI matches exactly
- Verify you've added yourself as a test user in Google Console
- Try re-authenticating at `/api/calendar/auth`

### Cannot Access from Other Devices
- Ensure firewall allows ports 5173 and 8000
- Use the local IP, not `localhost`
- Update `FRONTEND_URL` in `.env`

### Database Issues
- Delete `dashboard.db` to reset
- Restart the backend server

---

## Future Expansion

The architecture supports easy addition of:

- **Voice Assistant**: Add Mycroft/Home Assistant integration via new router
- **Shopping List**: New model and endpoints following todo pattern
- **Reminders**: Add notification service with scheduled tasks
- **Home Assistant**: Integrate via REST API or MQTT

---

## License

MIT - Feel free to use and modify for your household!
