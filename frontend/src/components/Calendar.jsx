import { useCalendarEvents, useTodayEvents } from '../hooks/useApi';

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function isToday(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isTomorrow(dateStr) {
  const date = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

function getDateLabel(dateStr) {
  if (isToday(dateStr)) return 'Today';
  if (isTomorrow(dateStr)) return 'Tomorrow';
  return formatDate(dateStr);
}

function EventCard({ event }) {
  const startDate = new Date(event.start);
  const now = new Date();
  const isPast = startDate < now && !event.all_day;
  const isHappeningNow = !event.all_day &&
    startDate <= now &&
    new Date(event.end) > now;

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isHappeningNow
          ? 'bg-blue-900/50 border-blue-500 shadow-lg shadow-blue-500/20'
          : isPast
          ? 'bg-slate-800/50 border-slate-700 opacity-60'
          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate ${isPast ? 'text-slate-400' : 'text-white'}`}>
            {event.title}
          </h4>
          {event.location && (
            <p className="text-sm text-slate-400 truncate mt-1">
              {event.location}
            </p>
          )}
        </div>
        <div className="text-right text-sm shrink-0">
          {event.all_day ? (
            <span className="text-slate-400">All day</span>
          ) : (
            <>
              <span className={isHappeningNow ? 'text-blue-400 font-medium' : 'text-slate-300'}>
                {formatTime(event.start)}
              </span>
              <span className="text-slate-500"> - </span>
              <span className="text-slate-400">{formatTime(event.end)}</span>
            </>
          )}
        </div>
      </div>
      {isHappeningNow && (
        <div className="mt-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-blue-400 font-medium">Happening now</span>
        </div>
      )}
    </div>
  );
}

function DaySection({ dateLabel, events }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className={`text-sm font-semibold mb-3 ${
        dateLabel === 'Today' ? 'text-blue-400' : 'text-slate-400'
      }`}>
        {dateLabel}
      </h3>
      <div className="space-y-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export default function Calendar() {
  const { events, calendarConnected, loading, error } = useCalendarEvents();

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const dateLabel = getDateLabel(event.start);
    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(event);
    return groups;
  }, {});

  // Sort date labels to ensure Today comes first
  const sortedDateLabels = Object.keys(groupedEvents).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Tomorrow') return -1;
    if (b === 'Tomorrow') return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Calendar</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!calendarConnected) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Calendar</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Connect Google Calendar</h3>
          <p className="text-slate-400 mb-4 max-w-sm">
            Link your Google Calendar to see your events here.
          </p>
          <a
            href="/api/calendar/auth"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Connect Calendar
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Calendar</h2>
        </div>
        <div className="text-red-400 text-center py-8">
          Failed to load calendar events
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Calendar</h2>
        <span className="text-xs text-slate-500">Next 7 days</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {sortedDateLabels.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No upcoming events</p>
          </div>
        ) : (
          sortedDateLabels.map((dateLabel) => (
            <DaySection
              key={dateLabel}
              dateLabel={dateLabel}
              events={groupedEvents[dateLabel]}
            />
          ))
        )}
      </div>
    </div>
  );
}
