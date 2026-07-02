// Event card — liquid-glass tile with semantic ss-tags (reference: events.html).
// All data affordances preserved: type badge, date, location, friends going,
// spots left, LIVE / Going / Maybe / Full states.
import { RunGlyph, Coffee, Dumbbell, CommunityOutline, Spark, Pin, Check } from '../ss/icons';

const EVENT_STYLES: Record<string, { tag: string; Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element }> = {
  group_run: { tag: 'now', Icon: RunGlyph },
  coffee_meetup: { tag: 'maybe', Icon: Coffee },
  workout: { tag: 'go', Icon: Dumbbell },
  social: { tag: 'soon', Icon: CommunityOutline },
  custom: { tag: 'full', Icon: Spark },
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
  const spotsLeft = event.max_attendees ? event.max_attendees - (event.attendee_count || 0) : null;

  return (
    <button
      onClick={onClick}
      className="tile"
      style={{ borderRadius: 18, padding: 13, gap: 9 }}
      data-testid={`event-card-${event.id}`}
    >
      {/* Type badge + date */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`ss-tag ${style.tag}`}>
          <style.Icon width={10} height={10} />
          {String(event.event_type).replace('_', ' ')}
        </span>
        <span className="num" style={{ font: '600 10.5px var(--mono)', color: 'var(--muted-2)' }}>
          {formatEventDate(event.date, event.time)}
        </span>
      </span>

      {/* Title */}
      <span style={{ font: '600 15px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)', lineHeight: 1.35 }}>
        {event.title}
      </span>

      {/* Location */}
      {event.location_name && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Pin width={12} height={12} style={{ color: 'var(--muted-2)', flex: 'none' }} />
          <span style={{ font: '500 11px var(--body)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.location_name}
          </span>
        </span>
      )}

      {/* Bottom row: friends going + spots left + RSVP status */}
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {event.friends_going?.length > 0 ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ display: 'flex' }} aria-hidden="true">
                {event.friends_going.slice(0, 3).map((f: any, i: number) => (
                  <span key={f.id ?? i} className="ss-puck" style={{ width: 20, height: 20, fontSize: 7.5, marginLeft: i === 0 ? 0 : -7, overflow: 'hidden' }}>
                    {f.profile_image_url ? (
                      <img src={f.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      f.name?.[0]?.toUpperCase() || '?'
                    )}
                  </span>
                ))}
              </span>
              <span style={{ font: '500 10px var(--body)', color: 'var(--accent-2)' }}>
                {event.friends_going_count === 1
                  ? `${event.friends_going[0].name?.split(' ')[0]} is going`
                  : `${event.friends_going_count} friends going`}
              </span>
            </span>
          ) : event.attendee_count > 0 ? (
            <span className="num" style={{ font: '600 10.5px var(--mono)', color: 'var(--muted)' }}>
              {event.attendee_count} going
            </span>
          ) : null}
          {spotsLeft !== null && !event.is_full && (
            <span className={`ss-dchip ${spotsLeft <= 10 ? 'warn' : 'neutral'}`}>
              {spotsLeft} spots left
            </span>
          )}
        </span>
        {event.status === 'live' && (
          <span className="ss-tag go">Live</span>
        )}
        {event.user_rsvp && event.status !== 'live' && (
          <span className={`ss-tag ${event.user_rsvp === 'going' ? 'go' : 'maybe'}`}>
            {event.user_rsvp === 'going' ? <><Check width={9} height={9} /> Going</> : 'Maybe'}
          </span>
        )}
        {event.is_full && !event.user_rsvp && (
          <span className="ss-tag full">Full</span>
        )}
      </span>
    </button>
  );
}
