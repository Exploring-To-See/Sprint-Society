// Event detail (/events/:id) — rebuilt on ss-base. Hooks preserved: GET /events/:id,
// /comments, /my-awards, /recap; POST /rsvp {status} (optimistic) / DELETE /rsvp;
// POST /checkin {code}; POST /comments; share-card generation.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import {
  ArrowLeft, Calendar, Pin, Check, Medal, Trophy, RunGlyph, Coffee, Dumbbell,
  CommunityOutline, Spark, Send,
} from '../components/ss/icons';
import { generateShareCard, shareOrDownload } from '../lib/shareCard';

const EVENT_TYPE_META: Record<string, { tag: string; Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element }> = {
  group_run: { tag: 'now', Icon: RunGlyph },
  coffee_meetup: { tag: 'maybe', Icon: Coffee },
  workout: { tag: 'go', Icon: Dumbbell },
  social: { tag: 'soon', Icon: CommunityOutline },
  custom: { tag: 'full', Icon: Spark },
};

function formatEventDateTime(date: string, time: string, duration: number): string {
  const d = new Date(date + 'T' + time);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const h = Math.floor(duration / 60);
  const m = duration % 60;
  const durStr = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  return `${dateStr} at ${timeStr} · ${durStr}`;
}

function fmtPace(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
}

function Puck({ name, image, size = 26 }: { name?: string; image?: string | null; size?: number }) {
  return (
    <span className="ss-puck" style={{ width: size, height: size, fontSize: size * 0.36, overflow: 'hidden' }} aria-hidden="true">
      {image ? (
        <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      ) : (
        name?.[0]?.toUpperCase() || '?'
      )}
    </span>
  );
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [checkInMessage, setCheckInMessage] = useState('');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ['event-comments', id],
    queryFn: () => api.get(`/events/${id}/comments`).then(r => r.data),
    enabled: !!id,
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: string) => api.post(`/events/${id}/rsvp`, { status }),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ['event', id] });
      const prev = queryClient.getQueryData(['event', id]);
      queryClient.setQueryData(['event', id], (old: any) => ({
        ...old,
        user_rsvp: status,
        attendee_count: status === 'going' ? (old.attendee_count || 0) + 1 : old.attendee_count,
      }));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['event', id], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: () => api.delete(`/events/${id}/rsvp`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const { data: myAwards } = useQuery({
    queryKey: ['event-awards', id],
    queryFn: () => api.get(`/events/${id}/my-awards`).then(r => r.data),
    enabled: !!id && event?.status === 'completed',
  });

  const checkInMutation = useMutation({
    mutationFn: (code: string) => api.post(`/events/${id}/checkin`, { code }),
    onSuccess: (res) => {
      setCheckInStatus('success');
      setCheckInMessage(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
    onError: (err: any) => {
      setCheckInStatus('error');
      // api.ts rejects with a normalized ApiError — the server's real reason
      // lives on .message, not on an axios-style .response.
      setCheckInMessage(err?.message || 'Check-in failed');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => api.post(`/events/${id}/comments`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', id] });
      setCommentText('');
    },
  });

  if (isLoading) {
    return (
      <SSScreen active="events" bodyLabel="Event">
        <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SSSkeleton height={120} style={{ borderRadius: 22 }} />
          <SSSkeleton height={72} style={{ borderRadius: 18 }} />
          <SSSkeleton height={48} style={{ borderRadius: 13 }} />
        </div>
      </SSScreen>
    );
  }

  if (!event) {
    return (
      <SSScreen active="events" bodyLabel="Event">
        <div className="ss-pad">
          <SSEmpty
            icon={<Calendar width={22} height={22} />}
            title="Event not found"
            body="It may have been removed, or the link is off."
            cta={
              <button className="ss-btn ss-btn-soft" style={{ height: 42, padding: '0 22px', flex: 'none' }} onClick={() => navigate('/events')}>
                Back to events
              </button>
            }
            testid="event-not-found"
          />
        </div>
      </SSScreen>
    );
  }

  const meta = EVENT_TYPE_META[event.event_type] || EVENT_TYPE_META.custom;

  return (
    <SSScreen active="events" bodyLabel={event.title}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>
        {/* Back */}
        <button
          onClick={() => navigate('/events')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', font: '500 12px var(--body)', color: 'var(--muted)', minHeight: 34, padding: 0 }}
        >
          <ArrowLeft width={15} height={15} /> Events
        </button>

        {/* Hero header */}
        <section className="ss-surface ss-hero" style={{ borderRadius: 22, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className={`ss-tag ${meta.tag}`}>
              <meta.Icon width={10} height={10} />
              {String(event.event_type).replace('_', ' ')}
            </span>
            {event.status === 'live' && <span className="ss-tag go">Live</span>}
            {event.status === 'completed' && <span className="ss-tag full">Completed</span>}
          </div>
          <h1 style={{ font: '500 24px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', lineHeight: 1.2 }}>
            {event.title}
          </h1>
        </section>

        {/* Date & location */}
        <div className="tile recess" style={{ borderRadius: 18, padding: 13, gap: 11 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <span className="ticon" style={{ flex: 'none' }}><Calendar width={14} height={14} style={{ color: 'var(--muted)' }} /></span>
            <p style={{ font: '500 13px var(--body)', color: 'var(--fg)', paddingTop: 4 }}>
              {formatEventDateTime(event.date, event.time, event.duration_minutes)}
            </p>
          </div>
          {event.location_name && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              <span className="ticon" style={{ flex: 'none' }}><Pin width={14} height={14} style={{ color: 'var(--muted)' }} /></span>
              <a
                href={`https://maps.google.com/?q=${event.latitude || event.location_name},${event.longitude || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ font: '600 13px var(--body)', color: 'var(--accent-2)', paddingTop: 4, textDecoration: 'none' }}
              >
                {event.location_name}
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p style={{ font: '400 13px/1.6 var(--body)', color: 'var(--muted)' }}>{event.description}</p>
        )}

        {/* Hosts */}
        {event.hosts?.length > 0 && (
          <div>
            <p className="tlbl" style={{ marginBottom: 8 }}>Hosted by</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {event.hosts.map((host: any) => (
                <div key={host.user_id} className="ss-qchip" style={{ height: 44, cursor: 'default' }}>
                  <Puck name={host.name} image={host.profile_image_url} />
                  <span>
                    <span style={{ display: 'block', font: '600 11.5px var(--body)', color: 'var(--fg)' }}>{host.name}</span>
                    <span style={{ display: 'block', font: '500 9.5px var(--body)', color: 'var(--muted-2)' }}>{host.role_label}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendees */}
        <div>
          <p className="tlbl" style={{ marginBottom: 8 }}>
            Who's going · <span className="num">{event.attendee_count}</span> going{event.maybe_count > 0 ? <> · <span className="num">{event.maybe_count}</span> maybe</> : null}
          </p>
          {event.attendees?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {event.attendees.slice(0, 12).map((a: any) => (
                <span key={a.user_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 11px 0 4px', borderRadius: 16, background: 'var(--glass)', border: '1px solid var(--hair)' }}>
                  <Puck name={a.name} image={a.profile_image_url} size={24} />
                  <span style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>{a.name?.split(' ')[0]}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* RSVP */}
        {!event.user_rsvp ? (
          <div style={{ display: 'flex', gap: 9 }}>
            <button
              onClick={() => rsvpMutation.mutate('going')}
              disabled={event.is_full || rsvpMutation.isPending}
              className="ss-btn ss-btn-primary"
              data-testid="rsvp-going"
            >
              {event.is_full ? 'Event full' : "I'm going"}
            </button>
            <button
              onClick={() => rsvpMutation.mutate('maybe')}
              disabled={rsvpMutation.isPending}
              className="ss-btn ss-btn-soft"
              style={{ flex: 'none', padding: '0 22px' }}
              data-testid="rsvp-maybe"
            >
              Maybe
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              className="ss-btn"
              style={{
                flex: 1, cursor: 'default',
                background: event.user_rsvp === 'going' ? 'rgba(52,211,153,.1)' : 'rgba(251,191,36,.1)',
                border: `1px solid ${event.user_rsvp === 'going' ? 'rgba(52,211,153,.24)' : 'rgba(251,191,36,.24)'}`,
                color: event.user_rsvp === 'going' ? 'var(--green)' : 'var(--amber)',
              }}
              data-testid="rsvp-status"
            >
              {event.user_rsvp === 'going' ? <><Check width={15} height={15} /> You're going</> : 'Maybe'}
            </div>
            <button
              onClick={() => cancelRsvpMutation.mutate()}
              disabled={cancelRsvpMutation.isPending}
              className="ss-btn ss-btn-ghost"
              style={{ width: 'auto', padding: '0 18px', fontSize: 12.5 }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Check-in (live events) */}
        {event.status === 'live' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="tile"
            style={{ borderRadius: 18, padding: 15, background: 'rgba(52,211,153,.07)', borderColor: 'rgba(52,211,153,.22)' }}
            aria-label="Event check-in"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 0 3px rgba(52,211,153,.18)' }} aria-hidden="true" />
              <p style={{ font: '700 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--green)' }}>Event is live</p>
            </div>

            {checkInStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <span className="ss-dchip good" style={{ minHeight: 28 }}><Check width={12} height={12} /> Checked in</span>
                <p style={{ font: '600 13px var(--body)', color: 'var(--green)', marginTop: 8 }}>{checkInMessage}</p>
              </div>
            ) : (
              <>
                <p style={{ font: '400 12px var(--body)', color: 'var(--muted)', marginBottom: 10 }}>
                  Enter the code shared by the organizer to check in:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={checkInCode}
                    onChange={e => {
                      setCheckInCode(e.target.value.toUpperCase());
                      setCheckInStatus('idle');
                    }}
                    placeholder="ENTER CODE"
                    maxLength={10}
                    className="ss-input num"
                    style={{ textAlign: 'center', font: '700 16px var(--mono)', letterSpacing: '.3em', textTransform: 'uppercase' }}
                    aria-label="Check-in code"
                  />
                  <button
                    onClick={() => checkInMutation.mutate(checkInCode)}
                    disabled={!checkInCode.trim() || checkInMutation.isPending}
                    className="ss-btn"
                    style={{ flex: 'none', padding: '0 18px', background: 'rgba(52,211,153,.16)', border: '1px solid rgba(52,211,153,.32)', color: 'var(--green)', fontSize: 13 }}
                  >
                    {checkInMutation.isPending ? '…' : 'Check in'}
                  </button>
                </div>
                {checkInStatus === 'error' && (
                  <p style={{ font: '500 11px var(--body)', color: 'var(--amber)', marginTop: 8 }} role="alert">{checkInMessage}</p>
                )}
              </>
            )}
          </motion.section>
        )}

        {/* Post-event results + share card */}
        {event.status === 'completed' && myAwards && (myAwards.awards?.length > 0 || myAwards.activity) && (
          <motion.section
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ss-surface ss-hero"
            style={{ borderRadius: 22, padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}
            aria-label="Your results"
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ font: '700 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: '.2em', color: 'var(--accent-2)', marginBottom: 4 }}>Your results</p>
              <h3 style={{ font: '600 17px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)' }}>{event.title}</h3>
            </div>

            {myAwards.awards?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {myAwards.awards.map((a: any) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 13, background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.24)' }}>
                    <Trophy width={15} height={15} style={{ color: 'var(--amber)', flex: 'none' }} />
                    <span>
                      <span style={{ display: 'block', font: '600 11.5px var(--body)', color: 'var(--fg)' }}>{a.award_title}</span>
                      {a.stat_value && <span className="num" style={{ display: 'block', font: '500 10px var(--mono)', color: 'var(--muted)' }}>{a.stat_value}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {myAwards.activity && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '4px 0' }}>
                {[
                  { v: (myAwards.activity.distance_meters / 1000).toFixed(1), k: 'km', hue: 'var(--fg)' },
                  { v: fmtPace(myAwards.activity.average_pace_per_km), k: 'pace/km', hue: 'var(--accent-2)' },
                  { v: `${Math.floor(myAwards.activity.moving_time_seconds / 60)}:${String(myAwards.activity.moving_time_seconds % 60).padStart(2, '0')}`, k: 'time', hue: 'var(--fg)' },
                ].map((s) => (
                  <div key={s.k} style={{ textAlign: 'center' }}>
                    <p className="num" style={{ font: '700 20px var(--mono)', color: s.hue, lineHeight: 1 }}>{s.v}</p>
                    <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 5 }}>{s.k}</p>
                  </div>
                ))}
              </div>
            )}

            <p style={{ font: '600 9.5px var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', textAlign: 'center' }}>
              Sprint Society · {event.date}
            </p>

            <button
              onClick={async () => {
                const blob = await generateShareCard({
                  title: event.title,
                  subtitle: event.date,
                  stats: myAwards.activity ? [
                    { label: 'Distance', value: `${(myAwards.activity.distance_meters / 1000).toFixed(1)}km` },
                    { label: 'Pace', value: fmtPace(myAwards.activity.average_pace_per_km) },
                    { label: 'Time', value: `${Math.floor(myAwards.activity.moving_time_seconds / 60)}m` },
                  ] : [{ label: 'Status', value: 'Completed' }],
                  awards: myAwards.awards?.map((a: any) => ({ icon: a.award_icon, title: a.award_title })),
                  footer: `Sprint Society · ${event.date}`,
                });
                if (blob) await shareOrDownload(blob, `sprint-society-${event.id}.png`);
              }}
              className="ss-btn ss-btn-soft"
              data-testid="share-results"
            >
              Share to Instagram Story
            </button>
          </motion.section>
        )}

        {/* Event recap leaderboard */}
        {event.status === 'completed' && <EventRecap eventId={id!} />}

        {/* Comments */}
        <div style={{ borderTop: '1px solid var(--hair)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="tlbl">Discussion</p>

          {comments?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', gap: 9 }}>
                  <Puck name={c.user_name} image={c.profile_image_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ font: '600 11.5px var(--body)', color: 'var(--fg)' }}>{c.user_name}</span>
                      <span className="num" style={{ font: '500 9.5px var(--mono)', color: 'var(--muted-2)' }}>
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ font: '400 12.5px/1.5 var(--body)', color: 'var(--muted)', marginTop: 2 }}>{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Say something..."
              maxLength={500}
              className="ss-input"
              style={{ height: 44 }}
              aria-label="Add a comment"
              onKeyDown={e => {
                if (e.key === 'Enter' && commentText.trim()) commentMutation.mutate(commentText);
              }}
            />
            <button
              onClick={() => commentText.trim() && commentMutation.mutate(commentText)}
              disabled={!commentText.trim() || commentMutation.isPending}
              aria-label="Post comment"
              style={{
                width: 44, height: 44, borderRadius: 13, flex: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer',
                background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', border: 'none', color: '#fff',
                opacity: !commentText.trim() || commentMutation.isPending ? .4 : 1,
              }}
            >
              <Send width={16} height={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </SSScreen>
  );
}

function EventRecap({ eventId }: { eventId: string }) {
  const { data: recap } = useQuery({
    queryKey: ['event-recap', eventId],
    queryFn: () => api.get(`/events/${eventId}/recap`).then(r => r.data).catch(() => null),
  });

  if (!recap?.stats || recap.leaderboard.length === 0) return null;

  const medalColor = (rank: number) =>
    rank === 1 ? 'var(--amber)' : rank === 2 ? 'var(--muted)' : 'var(--accent-2)';

  return (
    <section className="tile recess" style={{ borderRadius: 18, padding: 13, gap: 11 }} aria-label="Event recap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="tlbl">Event recap</p>
        <span className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>{recap.attendee_count} attended</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
        {[
          { v: recap.stats.total_distance_km, k: 'km total', hue: 'var(--fg)' },
          { v: recap.stats.total_runs, k: 'runs', hue: 'var(--fg)' },
          { v: recap.stats.avg_pace ? fmtPace(recap.stats.avg_pace) : '--', k: 'avg pace', hue: 'var(--accent-2)' },
        ].map((s) => (
          <div key={s.k}>
            <p className="num" style={{ font: '700 18px var(--mono)', color: s.hue, lineHeight: 1 }}>{s.v}</p>
            <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 5 }}>{s.k}</p>
          </div>
        ))}
      </div>

      <div>
        {recap.leaderboard.slice(0, 5).map((entry: any, i: number) => (
          <div key={entry.rank} style={{ display: 'flex', alignItems: 'center', gap: 9, minHeight: 40, padding: '7px 0', borderBottom: i === Math.min(recap.leaderboard.length, 5) - 1 ? 'none' : '1px solid var(--hair)' }}>
            <span style={{ width: 20, textAlign: 'center', flex: 'none' }}>
              {entry.rank <= 3 ? (
                <Medal width={14} height={14} style={{ color: medalColor(entry.rank) }} aria-label={`Rank ${entry.rank}`} />
              ) : (
                <span className="num" style={{ font: '700 10px var(--mono)', color: 'var(--muted-2)' }}>#{entry.rank}</span>
              )}
            </span>
            <Puck name={entry.name} image={entry.profile_image_url} size={22} />
            <span style={{ flex: 1, minWidth: 0, font: '500 11.5px var(--body)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
            <span className="num" style={{ font: '700 11px var(--mono)', color: 'var(--accent-2)' }}>{entry.distance_km}km</span>
          </div>
        ))}
      </div>
    </section>
  );
}
