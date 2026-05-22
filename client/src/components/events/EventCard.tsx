const EVENT_STYLES: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  group_run: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', icon: '🏃' },
  coffee_meetup: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: '☕' },
  workout: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: '💪' },
  social: { color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', icon: '🎉' },
  custom: { color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', icon: '⭐' },
};

function formatEventDate(date: string, time: string): string {
  const d = new Date(date + 'T' + time);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${timeStr}`;
}

interface EventCardProps {
  event: any;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const style = EVENT_STYLES[event.event_type] || EVENT_STYLES.custom;

  return (
    <button
      onClick={onClick}
      className="w-full text-left card p-4 space-y-3 transition-all active:scale-[0.98] hover:border-zinc-700"
    >
      {/* Type badge + date */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.color} border ${style.border}`}>
          <span>{style.icon}</span>
          {event.event_type.replace('_', ' ')}
        </span>
        <span className="text-[10px] text-zinc-600 font-mono">
          {formatEventDate(event.date, event.time)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-heading font-semibold text-[15px] text-white leading-snug">
        {event.title}
      </h3>

      {/* Location */}
      {event.location_name && (
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-zinc-600 shrink-0">
            <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className="text-[11px] text-zinc-500 truncate">{event.location_name}</span>
        </div>
      )}

      {/* Bottom row: attendees + spots left + RSVP status */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {event.attendee_count > 0 && (
            <span className="text-[10px] text-zinc-500 font-medium">
              {event.attendee_count} going
            </span>
          )}
          {event.max_attendees && !event.is_full && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              (event.max_attendees - (event.attendee_count || 0)) <= 10
                ? 'bg-red-500/10 text-red-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}>
              {event.max_attendees - (event.attendee_count || 0)} spots left
            </span>
          )}
        </div>
        {event.status === 'live' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">
            LIVE
          </span>
        )}
        {event.user_rsvp && event.status !== 'live' && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            event.user_rsvp === 'going'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
          }`}>
            {event.user_rsvp === 'going' ? '✓ Going' : '~ Maybe'}
          </span>
        )}
        {event.is_full && !event.user_rsvp && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
            Full
          </span>
        )}
      </div>
    </button>
  );
}
