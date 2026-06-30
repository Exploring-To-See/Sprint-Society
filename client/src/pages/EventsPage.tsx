import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { EventCard } from '../components/events/EventCard';
import { EventMapView } from '../components/events/EventMapView';
import { SSSeg, type SegItem } from '../components/ss/SSSeg';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import { Calendar, Flag, Target, ChevronRight } from '../components/ss/icons';

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

// Shape mirrors server/src/routes/events.routes.ts. `/events` returns the richest
// row (friends_going + is_full); `/events/my` adds user_rsvp; `/events/nearby` adds
// distance_km. All optional fields are guarded by EventCard, so one interface covers all.
interface SSEvent {
  id: number;
  event_type: string;
  title: string;
  date: string;
  time: string;
  status?: string;
  location_name?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  creator_name?: string;
  creator_image?: string | null;
  attendee_count?: number;
  maybe_count?: number;
  max_attendees?: number | null;
  is_full?: boolean;
  user_rsvp?: 'going' | 'maybe' | null;
  friends_going?: Array<{ id: number; name?: string; profile_image_url?: string | null }>;
  friends_going_count?: number;
  distance_km?: number;
  [key: string]: unknown;
}

interface EventsResponse {
  events: SSEvent[];
  page?: number;
  has_more?: boolean;
}
interface MyEventsResponse {
  attending: SSEvent[];
}
interface NearbyResponse {
  events: SSEvent[];
  radius_km: number;
}

type TabKey = 'upcoming' | 'my' | 'nearby';

const TABS: SegItem<TabKey>[] = [
  { key: 'upcoming', label: 'Upcoming', icon: <Calendar /> },
  { key: 'my', label: 'My events', icon: <Flag /> },
  { key: 'nearby', label: 'Nearby', icon: <Target /> },
];

const NEARBY_RADIUS_KM = 10;

type GeoState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ready'; lat: number; lng: number }
  | { status: 'denied'; reason: string };

export function EventsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('upcoming');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });

  const goToEvent = (id: number) => navigate(`/events/${id}`);

  // --- Upcoming (existing behavior, preserved) ---
  const upcoming = useQuery<EventsResponse>({
    queryKey: ['events', activeFilter],
    queryFn: () =>
      api
        .get('/events', { params: { type: activeFilter === 'all' ? undefined : activeFilter } })
        .then((r) => r.data),
  });

  // --- My events (going/maybe or hosting) ---
  const my = useQuery<MyEventsResponse>({
    queryKey: ['events', 'my'],
    queryFn: () => api.get('/events/my').then((r) => r.data),
    enabled: tab === 'my',
  });

  // --- Nearby (needs coords; only enabled once geolocation resolves) ---
  const nearby = useQuery<NearbyResponse>({
    queryKey: ['events', 'nearby', geo.status === 'ready' ? geo.lat : null, geo.status === 'ready' ? geo.lng : null],
    queryFn: () => {
      if (geo.status !== 'ready') return Promise.reject(new Error('Location not available'));
      return api
        .get('/events/nearby', { params: { lat: geo.lat, lng: geo.lng, radius: NEARBY_RADIUS_KM, radius_km: NEARBY_RADIUS_KM } })
        .then((r) => r.data);
    },
    enabled: tab === 'nearby' && geo.status === 'ready',
  });

  // Ask for location the first time the Nearby tab is opened.
  useEffect(() => {
    if (tab !== 'nearby' || geo.status !== 'idle') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({ status: 'denied', reason: 'unsupported' });
      return;
    }
    setGeo({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: 'ready', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ status: 'denied', reason: 'denied' }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, [tab, geo.status]);

  const retryLocation = () => setGeo({ status: 'idle' });

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 pb-6">
        <motion.div variants={fadeUp} className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-[22px] font-bold">Events</h1>
            <p className="text-[11px] text-zinc-600 mt-0.5">Meet up, run together, vibe</p>
          </div>
          {tab === 'upcoming' && (
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary border border-bg-tertiary text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors"
              aria-label={viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'}
            >
              {viewMode === 'list' ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12M2 6.5h12M2 10h12M2 13.5h8"/></svg>
                  Map
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M6 2v12M10 2v12"/></svg>
                  List
                </>
              )}
            </button>
          )}
        </motion.div>

        {/* Primary tabs — neutral glide-pill segmented control */}
        <motion.div variants={fadeUp}>
          <SSSeg<TabKey>
            items={TABS}
            value={tab}
            onChange={setTab}
            layoutId="events-tab-pill"
            ariaLabel="Event lists"
            testid="events-tab"
          />
        </motion.div>

        {tab === 'upcoming' && (
          <UpcomingTab
            query={upcoming}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            viewMode={viewMode}
            onEventClick={goToEvent}
          />
        )}

        {tab === 'my' && <MyEventsTab query={my} onEventClick={goToEvent} />}

        {tab === 'nearby' && (
          <NearbyTab
            query={nearby}
            geo={geo}
            onEventClick={goToEvent}
            onRetryLocation={retryLocation}
          />
        )}
      </motion.div>
    </AppShell>
  );
}

/* ---------------------------------------------------------------- Upcoming */

function UpcomingTab({
  query,
  activeFilter,
  setActiveFilter,
  viewMode,
  onEventClick,
}: {
  query: ReturnType<typeof useQuery<EventsResponse>>;
  activeFilter: string;
  setActiveFilter: (k: string) => void;
  viewMode: 'list' | 'map';
  onEventClick: (id: number) => void;
}) {
  const { data, isLoading, isError, refetch } = query;
  const events = data?.events ?? [];

  return (
    <>
      {/* Filter tabs */}
      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {FILTERS.map((f) => (
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
            {!f.active && <span className="ml-1 text-[11px] text-zinc-700 uppercase">Soon</span>}
          </button>
        ))}
      </motion.div>

      {/* Map View */}
      {viewMode === 'map' && (
        <motion.div variants={fadeUp} className="rounded-xl overflow-hidden border border-bg-tertiary h-[400px] bg-bg-secondary">
          <EventMapView events={events} onEventClick={onEventClick} />
        </motion.div>
      )}

      {/* Loading skeleton */}
      {viewMode === 'list' && isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-bg-tertiary rounded-full" />
                <div className="h-5 w-20 bg-bg-tertiary rounded-full" />
              </div>
              <div className="h-5 w-48 bg-bg-tertiary rounded" />
              <div className="h-4 w-32 bg-bg-tertiary rounded" />
              <div className="flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((j) => <div key={j} className="w-6 h-6 rounded-full bg-bg-tertiary" />)}
                </div>
                <div className="h-8 w-20 bg-bg-tertiary rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {viewMode === 'list' && isError && (
        <SSError onRetry={() => refetch()} message="We couldn't load upcoming events. Check your connection and try again." testid="events-upcoming-error" />
      )}

      {/* Empty state */}
      {viewMode === 'list' && !isLoading && !isError && events.length === 0 && (
        <SSEmpty
          icon={<Calendar width={22} height={22} />}
          title="No events coming up yet"
          body="Stay tuned — something's always brewing. New runs and meetups will appear here the moment they're announced."
          testid="events-upcoming-empty"
        />
      )}

      {/* Featured Hero Event (next upcoming) */}
      {viewMode === 'list' && !isLoading && !isError && events[0] && (
        <motion.div variants={fadeUp}>
          <button
            onClick={() => onEventClick(events[0].id)}
            className="w-full text-left rounded-2xl overflow-hidden border border-accent/20 bg-gradient-to-br from-accent/15 via-bg-secondary to-bg-primary p-5 space-y-3 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Featured Event</span>
              <CountdownBadge date={events[0].date} time={events[0].time} />
            </div>
            <h2 className="font-heading text-[18px] font-bold text-white leading-snug">{events[0].title}</h2>
            <p className="text-[12px] text-zinc-400">{events[0].location_name}</p>
            <div className="flex items-center justify-between pt-2">
              <AttendeeAvatars attendees={events[0].friends_going} count={events[0].attendee_count} />
              {events[0].max_attendees && (
                <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                  {Math.max(0, events[0].max_attendees - (events[0].attendee_count || 0))} spots left
                </span>
              )}
            </div>
          </button>
        </motion.div>
      )}

      {/* Event cards */}
      {viewMode === 'list' && !isLoading && !isError && events.slice(1).map((event) => (
        <motion.div key={event.id} variants={fadeUp}>
          <EventCard event={event} onClick={() => onEventClick(event.id)} />
        </motion.div>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- My events */

function MyEventsTab({
  query,
  onEventClick,
}: {
  query: ReturnType<typeof useQuery<MyEventsResponse>>;
  onEventClick: (id: number) => void;
}) {
  const { data, isLoading, isError, refetch } = query;
  const events = data?.attending ?? [];

  if (isLoading) return <TabSkeleton />;
  if (isError) {
    return (
      <SSError
        onRetry={() => refetch()}
        message="We couldn't load your events. Check your connection and try again."
        testid="events-my-error"
      />
    );
  }
  if (events.length === 0) {
    return (
      <SSEmpty
        icon={<Flag width={22} height={22} />}
        title="You're not on any lists yet"
        body="RSVP to a run or host your own, and it'll show up here so you never miss a meetup."
        testid="events-my-empty"
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="events-my-panel">
      {events.map((event) => (
        <motion.div key={event.id} variants={fadeUp}>
          <EventCard event={event} onClick={() => onEventClick(event.id)} />
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Nearby */

function NearbyTab({
  query,
  geo,
  onEventClick,
  onRetryLocation,
}: {
  query: ReturnType<typeof useQuery<NearbyResponse>>;
  geo: GeoState;
  onEventClick: (id: number) => void;
  onRetryLocation: () => void;
}) {
  // Location not yet available — own the empty/loading story before the query runs.
  if (geo.status === 'locating' || geo.status === 'idle') {
    return (
      <div data-testid="events-nearby-panel">
        <p className="ss-pad text-[11px] text-zinc-500" style={{ paddingTop: 0 }}>
          Finding events around you…
        </p>
        <TabSkeleton />
      </div>
    );
  }

  if (geo.status === 'denied') {
    return (
      <SSEmpty
        icon={<Target width={22} height={22} />}
        title="Location needed for nearby"
        body={
          geo.reason === 'unsupported'
            ? "This device can't share its location, so we can't find runs near you. Try the Upcoming tab to browse everything."
            : 'Turn on location access and we’ll surface upcoming runs and live meetups close to you.'
        }
        cta={
          geo.reason === 'unsupported' ? undefined : (
            <button
              className="ss-btn ss-btn-soft"
              style={{ height: 42, padding: '0 22px', flex: 'none' }}
              onClick={onRetryLocation}
              data-testid="events-nearby-enable"
            >
              Enable location
            </button>
          )
        }
        testid="events-nearby-denied"
      />
    );
  }

  // Location ready — render the query result.
  const { data, isLoading, isError, refetch } = query;
  const events = data?.events ?? [];

  if (isLoading) return <div data-testid="events-nearby-panel"><TabSkeleton /></div>;
  if (isError) {
    return (
      <SSError
        onRetry={() => refetch()}
        message="We couldn't load nearby events. Check your connection and try again."
        testid="events-nearby-error"
      />
    );
  }
  if (events.length === 0) {
    return (
      <SSEmpty
        icon={<Target width={22} height={22} />}
        title="Nothing within reach yet"
        body={`No runs within ${data?.radius_km ?? NEARBY_RADIUS_KM} km right now. Check the Upcoming tab — there's plenty further out.`}
        testid="events-nearby-empty"
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="events-nearby-panel">
      {events.map((event) => (
        <motion.div key={event.id} variants={fadeUp} className="relative">
          {typeof event.distance_km === 'number' && (
            <span
              className="ss-dchip neutral"
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronRight width={11} height={11} />
              {event.distance_km} km
            </span>
          )}
          <EventCard event={event} onClick={() => onEventClick(event.id)} />
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- shared bits */

function TabSkeleton() {
  return (
    <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 0 }}>
      {[0, 1, 2].map((i) => (
        <SSSkeleton key={i} height={104} style={{ borderRadius: 16 }} />
      ))}
    </div>
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

function AttendeeAvatars({ attendees, count }: { attendees?: SSEvent['friends_going']; count?: number }) {
  const avatars = attendees?.slice(0, 4) ?? [];
  const remaining = (count || 0) - avatars.length;

  if (!count || count === 0) return <span className="text-[10px] text-zinc-600">Be the first!</span>;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {avatars.map((a, i) => (
          <div key={a.id ?? i} className="w-6 h-6 rounded-full border-2 border-bg-primary overflow-hidden bg-bg-tertiary">
            {a.profile_image_url ? (
              <img src={a.profile_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-zinc-500">
                {a.name?.[0] || '?'}
              </div>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="w-6 h-6 rounded-full border-2 border-bg-primary bg-bg-tertiary flex items-center justify-center">
            <span className="text-[11px] font-bold text-zinc-400">+{remaining}</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-zinc-500 ml-2">{count} going</span>
    </div>
  );
}
