import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { AttendeeAvatars } from '../components/events/AttendeeAvatars';

const EVENT_COLORS: Record<string, string> = {
  group_run: 'from-orange-600/20 to-transparent',
  coffee_meetup: 'from-amber-600/20 to-transparent',
  workout: 'from-emerald-600/20 to-transparent',
  social: 'from-violet-600/20 to-transparent',
  custom: 'from-zinc-600/20 to-transparent',
};

const EVENT_ICONS: Record<string, string> = {
  group_run: '🏃', coffee_meetup: '☕', workout: '💪', social: '🎉', custom: '⭐',
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

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

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

  const commentMutation = useMutation({
    mutationFn: (body: string) => api.post(`/events/${id}/comments`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', id] });
      setCommentText('');
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse pt-4">
          <div className="h-6 w-32 bg-bg-tertiary rounded" />
          <div className="h-8 w-64 bg-bg-tertiary rounded" />
          <div className="h-4 w-48 bg-bg-tertiary rounded" />
          <div className="h-12 w-full bg-bg-tertiary rounded-lg" />
        </div>
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <div className="flex flex-col items-center py-20 gap-3">
          <span className="text-3xl">🤷</span>
          <p className="text-zinc-500 text-[13px]">Event not found</p>
          <button onClick={() => navigate('/events')} className="text-accent text-[12px] font-semibold">
            Back to events
          </button>
        </div>
      </AppShell>
    );
  }

  const gradient = EVENT_COLORS[event.event_type] || EVENT_COLORS.custom;

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[12px] font-medium">Events</span>
        </button>

        {/* Header with gradient */}
        <div className={`relative rounded-xl overflow-hidden bg-gradient-to-b ${gradient} p-5`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{EVENT_ICONS[event.event_type] || '⭐'}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {event.event_type.replace('_', ' ')}
            </span>
          </div>
          <h1 className="font-heading text-[24px] font-bold text-white leading-tight">
            {event.title}
          </h1>
        </div>

        {/* Date & location */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-secondary border border-bg-tertiary flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-400">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 6h12" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] text-white font-medium">
                {formatEventDateTime(event.date, event.time, event.duration_minutes)}
              </p>
            </div>
          </div>

          {event.location_name && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-bg-secondary border border-bg-tertiary flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-400">
                  <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <a
                href={`https://maps.google.com/?q=${event.latitude || event.location_name},${event.longitude || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-accent hover:underline font-medium"
              >
                {event.location_name}
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-[13px] text-zinc-400 leading-relaxed">{event.description}</p>
        )}

        {/* Hosts */}
        {event.hosts?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Hosted by</h3>
            <div className="flex flex-wrap gap-2">
              {event.hosts.map((host: any) => (
                <div key={host.user_id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary">
                  <div className="w-6 h-6 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center">
                    {host.profile_image_url ? (
                      <img src={host.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold text-zinc-500">{host.name?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-white">{host.name}</p>
                    <p className="text-[9px] text-zinc-600">{host.role_label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendees */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            Who's going · {event.attendee_count} going{event.maybe_count > 0 ? ` · ${event.maybe_count} maybe` : ''}
          </h3>
          {event.attendees?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.attendees.slice(0, 12).map((a: any) => (
                <div key={a.user_id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-bg-secondary border border-bg-tertiary">
                  <div className="w-5 h-5 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center">
                    {a.profile_image_url ? (
                      <img src={a.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold text-zinc-500">{a.name?.[0]}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">{a.name?.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RSVP Button */}
        <div className="space-y-2">
          {!event.user_rsvp ? (
            <div className="flex gap-2">
              <button
                onClick={() => rsvpMutation.mutate('going')}
                disabled={event.is_full || rsvpMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold text-[14px] disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {event.is_full ? 'Event Full' : "I'm Going"}
              </button>
              <button
                onClick={() => rsvpMutation.mutate('maybe')}
                disabled={rsvpMutation.isPending}
                className="px-5 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-zinc-400 font-semibold text-[14px] active:scale-[0.98] transition-all"
              >
                Maybe
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className={`flex-1 py-3 rounded-xl text-center font-semibold text-[14px] ${
                event.user_rsvp === 'going'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
              }`}>
                {event.user_rsvp === 'going' ? '✓ You\'re going!' : '~ Maybe'}
              </div>
              <button
                onClick={() => cancelRsvpMutation.mutate()}
                className="px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-zinc-500 text-[12px] font-medium active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-3 pt-2 border-t border-bg-tertiary/50">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Discussion</h3>

          {comments?.length > 0 && (
            <div className="space-y-3">
              {comments.map((c: any) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center shrink-0 mt-0.5">
                    {c.profile_image_url ? (
                      <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold text-zinc-500">{c.user_name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-semibold text-white">{c.user_name}</span>
                      <span className="text-[9px] text-zinc-700">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-400 mt-0.5">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Say something..."
              maxLength={500}
              className="flex-1 px-3 py-2.5 rounded-lg bg-bg-primary border border-bg-tertiary text-[12px] text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && commentText.trim()) commentMutation.mutate(commentText);
              }}
            />
            <button
              onClick={() => commentText.trim() && commentMutation.mutate(commentText)}
              disabled={!commentText.trim() || commentMutation.isPending}
              className="px-4 py-2.5 rounded-lg bg-accent text-white text-[11px] font-semibold disabled:opacity-30 active:scale-95 transition-all"
            >
              Post
            </button>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
