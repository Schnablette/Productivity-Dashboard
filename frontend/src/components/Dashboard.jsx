import { useState, useEffect } from 'react';
import Calendar from './Calendar';
import TodoList from './TodoList';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-center">
      <div className="text-5xl font-light text-white tracking-tight">
        {formattedTime}
      </div>
      <div className="text-lg text-slate-400 mt-1">
        {formattedDate}
      </div>
    </div>
  );
}

function StatusIndicator() {
  const [status, setStatus] = useState({ telegram: false, calendar: false });
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/health');
        if (response.ok) {
          const data = await response.json();
          setStatus({
            telegram: data.telegram_bot,
            calendar: data.google_calendar,
          });
          setLastUpdate(new Date());
        }
      } catch (err) {
        // Backend might not be running
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status.telegram ? 'bg-green-500' : 'bg-slate-600'}`}></span>
        <span className="text-slate-400">Telegram</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status.calendar ? 'bg-green-500' : 'bg-slate-600'}`}></span>
        <span className="text-slate-400">Calendar</span>
      </div>
      {lastUpdate && (
        <span className="text-slate-600 text-xs">
          Updated {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <Clock />
          <StatusIndicator />
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Calendar Panel */}
          <div className="min-h-[400px]">
            <Calendar />
          </div>

          {/* Todo Panel */}
          <div className="min-h-[400px]">
            <TodoList />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-slate-600 text-sm">
          <p>
            Add todos via Telegram or the form above
          </p>
        </footer>
      </div>
    </div>
  );
}
