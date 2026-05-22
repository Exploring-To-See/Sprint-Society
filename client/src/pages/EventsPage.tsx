import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { EventCard } from '../components/events/EventCard';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const FILTERS = [
  { key: 'all', label: 'All', active: true },
  { key: 'group_run', label: 'Runs', active: true },
  { key: 'social', label: 'Social', active: false },
  { key: 'health_fitness', label: 'Health & Fitness', active: false },
] as const;

export function EventsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['events', activeFilter],
    queryFn: () => api.get('/events', {
      params: { type: activeFilter === 'all' ? undefined : activeFilter }
    }).then(r => r.data),
  });

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 pb-6">
        <motion.div variants={fadeUp}>
          <h1 className="font-heading text-[22px] font-bold">Events</h1>
          <p className="text-[11px] text-zinc-600 mt-0.5">Meet up, run together, vibe</p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => f.active && setActiveFilter(f.key)}
              className={`relative px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                !f.active
                  ? 'bg-bg-secondary/50 border border-bg-tertiary/50 text-zinc-700 cursor-default'
                  : activeFilter === f.key
                  ? 'bg-accent text-white active:scale-95'
                  : 'bg-bg-secondary border border-bg-tertiary text-zinc-500 hover:text-zinc-300 active:scale-95'
              }`}
            >
              {f.label}
              {!f.active && (
                <span className="ml-1 text-[8px] text-zinc-700 uppercase">Soon</span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-bg-tertiary rounded-full" />
                  <div className="h-5 w-20 bg-bg-tertiary rounded-full" />
                </div>
                <div className="h-5 w-48 bg-bg-tertiary rounded" />
                <div className="h-4 w-32 bg-bg-tertiary rounded" />
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(j => <div key={j} className="w-6 h-6 rounded-full bg-bg-tertiary" />)}
                  </div>
                  <div className="h-8 w-20 bg-bg-tertiary rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!data?.events || data.events.length === 0) && (
          <motion.div variants={fadeUp} className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-bg-tertiary flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-[13px] text-zinc-500 text-center max-w-[260px]">
              No events coming up yet. Stay tuned — something's always brewing.
            </p>
          </motion.div>
        )}

        {/* Featured Hero Event (next upcoming) */}
        {data?.events?.[0] && !isLoading && (
          <motion.div variants={fadeUp}>
            <button
              onClick={() => navigate(`/events/${data.events[0].id}`)}
              className="w-full text-left rounded-2xl overflow-hidden border border-accent/20 bg-gradient-to-br from-accent/15 via-bg-secondary to-bg-primary p-5 space-y-3 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent">Featured Event</span>
                <CountdownBadge date={data.events[0].date} time={data.events[0].time} />
              </div>
              <h2 className="font-heading text-[18px] font-bold text-white leading-snug">{data.events[0].title}</h2>
              <p className="text-[12px] text-zinc-400">{data.events[0].location_name}</p>
              <div className="flex items-center justify-between pt-2">
                <AttendeeAvatars attendees={data.events[0].attendees} count={data.events[0].attendee_count} />
                {data.events[0].max_attendees && (
                  <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                    {Math.max(0, data.events[0].max_attendees - (data.events[0].attendee_count || 0))} spots left
                  </span>
                )}
              </div>
            </button>
          </motion.div>
        )}

        {/* Event cards */}
        {data?.events?.slice(1).map((event: any) => (
          <motion.div key={event.id} variants={fadeUp}>
            <EventCard event={event} onClick={() => navigate(`/events/${event.id}`)} />
          </motion.div>
        ))}
      </motion.div>
    </AppShell>
  );
}

function CountdownBadge({ date, time }: { date: string; time: string }) {
  const eventDate = new Date(date + 'T' + (time || '00:00'));
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full animate-pulse">TODAY!</span>;
  if (diffDays === 1) return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Tomorrow</span>;
  if (diffDays <= 3) return <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{diffDays} days</span>;
  if (diffDays <= 7) return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{diffDays} days</span>;
  return <span className="text-[10px] font-semibold text-zinc-500 bg-bg-tertiary px-2 py-0.5 rounded-full">{diffDays} days</span>;
}

function AttendeeAvatars({ attendees, count }: { attendees?: any[]; count?: number }) {
  const avatars = attendees?.slice(0, 4) || [];
  const remaining = (count || 0) - avatars.length;

  if (!count || count === 0) return <span className="text-[10px] text-zinc-600">Be the first!</span>;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {avatars.map((a: any, i: number) => (
          <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-primary overflow-hidden bg-bg-tertiary">
            {a.profile_image_url ? (
              <img src={a.profile_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-zinc-500">
                {a.name?.[0] || '?'}
              </div>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="w-6 h-6 rounded-full border-2 border-bg-primary bg-bg-tertiary flex items-center justify-center">
            <span className="text-[8px] font-bold text-zinc-400">+{remaining}</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-zinc-500 ml-2">{count} going</span>
    </div>
  );
}
