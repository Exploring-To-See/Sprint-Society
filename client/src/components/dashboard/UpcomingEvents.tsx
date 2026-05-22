import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const EVENT_ICONS: Record<string, string> = {
  group_run: '🏃', coffee_meetup: '☕', workout: '💪', social: '🎉', custom: '⭐',
};

const EVENT_COLORS: Record<string, string> = {
  group_run: 'bg-accent/10 border-accent/20',
  coffee_meetup: 'bg-amber-400/10 border-amber-400/20',
  workout: 'bg-emerald-400/10 border-emerald-400/20',
  social: 'bg-violet-400/10 border-violet-400/20',
  custom: 'bg-zinc-400/10 border-zinc-400/20',
};

function formatShortDate(date: string, time: string): string {
  const d = new Date(date + 'T' + time);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return `Today ${timeStr}`;
  if (isTomorrow) return `Tmrw ${timeStr}`;
  return d.toLocaleDateString('en-US', { weekday: 'short' }) + ` ${timeStr}`;
}

export function UpcomingEvents() {
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const endOfWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const { data } = useQuery({
    queryKey: ['events-upcoming-week'],
    queryFn: () => api.get('/events', { params: { from: today, to: endOfWeek, limit: 3 } }).then(r => r.data),
  });

  if (!data?.events?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-[14px]">This week</h3>
        <button onClick={() => navigate('/events')} className="text-[10px] text-accent font-semibold">
          See all
        </button>
      </div>
      <div className="space-y-2">
        {data.events.slice(0, 3).map((event: any) => {
          const color = EVENT_COLORS[event.event_type] || EVENT_COLORS.custom;
          return (
            <button
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border ${color} transition-all active:scale-[0.98]`}
            >
              <span className="text-base">{EVENT_ICONS[event.event_type] || '⭐'}</span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[12px] font-medium text-white truncate">{event.title}</p>
                <p className="text-[10px] text-zinc-600">{formatShortDate(event.date, event.time)}</p>
              </div>
              {event.attendee_count > 0 && (
                <span className="text-[10px] text-zinc-600 font-mono">{event.attendee_count} going</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
