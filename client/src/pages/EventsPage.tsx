// Events (/events) — SSScreen shell + ss surfaces (reference: events.html).
// Hooks preserved: GET /events {type}, GET /events/my, GET /events/nearby
// {lat,lng,radius} with the geolocation prompt + graceful denial story.
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getCurrentPosition } from '../lib/geolocation';
import { SSScreen } from '../components/ss/SSScreen';
import { EventCard } from '../components/events/EventCard';
import { EventMapView } from '../components/events/EventMapView';
import { SSSeg, type SegItem } from '../components/ss/SSSeg';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import { Calendar, Flag, Target, Pin, Check, RunGlyph } from '../components/ss/icons';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

// The server filters generically by event_type (GET /events?type=X), so every
// category is live — an empty category simply shows the empty state.
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'group_run', label: 'Runs' },
  { key: 'social', label: 'Social' },
  // Maps to the 'workout' event_type — 'health_fitness' is not a valid type per
  // the events.event_type CHECK constraint, so that tab was permanently empty.
  { key: 'workout', label: 'Health & Fitness' },
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
  { key: 'upcoming', label: 'Upcoming', icon: <Calendar width={14} height={14} /> },
  { key: 'my', label: 'My events', icon: <Flag width={14} height={14} /> },
  { key: 'nearby', label: 'Nearby', icon: <Target width={14} height={14} /> },
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
  // getCurrentPosition triggers the real system permission popup on native (APK/iOS).
  useEffect(() => {
    if (tab !== 'nearby' || geo.status !== 'idle') return;
    setGeo({ status: 'locating' });
    getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })
      .then((pos) => setGeo({ status: 'ready', lat: pos.latitude, lng: pos.longitude }))
      .catch((err: { code?: string }) =>
        setGeo({ status: 'denied', reason: err?.code === 'UNSUPPORTED' ? 'unsupported' : 'denied' }));
  }, [tab, geo.status]);

  const retryLocation = () => setGeo({ status: 'idle' });

  return (
    <SSScreen active="events" bodyLabel="Events">
      <motion.div variants={stagger} initial="hidden" animate="show" className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 13, paddingBottom: 24 }}>
        <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em' }}>Events</h1>
            <p style={{ font: '500 11.5px var(--body)', color: 'var(--muted)', marginTop: 2 }}>Meet up, run together, vibe</p>
          </div>
          {tab === 'upcoming' && (
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className={`ss-tab${viewMode === 'map' ? ' on' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 34 }}
              aria-label={viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'}
              aria-pressed={viewMode === 'map'}
            >
              <Pin width={13} height={13} />
              Map
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
    </SSScreen>
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
      {/* Category filter pills */}
      <motion.div variants={fadeUp} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`ss-tab${activeFilter === f.key ? ' on' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            aria-pressed={activeFilter === f.key}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Map View */}
      {viewMode === 'map' && (
        <motion.div variants={fadeUp} className="ss-surface ss-recess" style={{ borderRadius: 20, overflow: 'hidden', height: 400, padding: 0 }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            <EventMapView events={events} onEventClick={onEventClick} />
          </div>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {viewMode === 'list' && isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SSSkeleton height={168} style={{ borderRadius: 22 }} />
          {[0, 1].map((i) => <SSSkeleton key={i} height={112} style={{ borderRadius: 18 }} />)}
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
            className="ss-surface ss-hero"
            style={{ width: '100%', textAlign: 'left', borderRadius: 22, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
            data-testid="events-featured"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ font: '700 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: '.2em', color: 'var(--accent-2)' }}>Featured event</span>
              <span style={{ marginLeft: 'auto' }}><CountdownBadge date={events[0].date} time={events[0].time} /></span>
            </span>
            <span style={{ font: '500 22px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', lineHeight: 1.25 }}>{events[0].title}</span>
            {events[0].location_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pin width={13} height={13} style={{ color: 'var(--muted-2)', flex: 'none' }} />
                <span style={{ font: '500 11.5px var(--body)', color: 'var(--muted)' }}>{events[0].location_name}</span>
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
              <AttendeeAvatars attendees={events[0].friends_going} count={events[0].attendee_count} />
              {events[0].max_attendees && (
                <span className="ss-dchip warn">
                  {Math.max(0, events[0].max_attendees - (events[0].attendee_count || 0))} spots left
                </span>
              )}
            </span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="events-my-panel">
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
        <p style={{ font: '500 11px var(--body)', color: 'var(--muted)', marginBottom: 10 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="events-nearby-panel">
      {events.map((event) => (
        <motion.div key={event.id} variants={fadeUp} style={{ position: 'relative' }}>
          {typeof event.distance_km === 'number' && (
            <span
              className="ss-dchip neutral"
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Pin width={10} height={10} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <SSSkeleton key={i} height={112} style={{ borderRadius: 18 }} />
      ))}
    </div>
  );
}

function CountdownBadge({ date, time }: { date: string; time: string }) {
  const eventDate = new Date(date + 'T' + (time || '00:00'));
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return <span className="ss-tag go">Today</span>;
  if (diffDays === 1) return <span className="ss-tag maybe">Tomorrow</span>;
  if (diffDays <= 3) return <span className="ss-tag now">{diffDays} days</span>;
  if (diffDays <= 7) return <span className="ss-tag maybe">{diffDays} days</span>;
  return <span className="ss-tag full">{diffDays} days</span>;
}

function AttendeeAvatars({ attendees, count }: { attendees?: SSEvent['friends_going']; count?: number }) {
  const avatars = attendees?.slice(0, 4) ?? [];
  const remaining = (count || 0) - avatars.length;

  if (!count || count === 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 10.5px var(--body)', color: 'var(--muted-2)' }}>
        <RunGlyph width={11} height={11} /> Be the first!
      </span>
    );
  }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ display: 'flex' }} aria-hidden="true">
        {avatars.map((a, i) => (
          <span key={a.id ?? i} className="ss-puck" style={{ marginLeft: i === 0 ? 0 : -8, overflow: 'hidden' }}>
            {a.profile_image_url ? (
              <img src={a.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              a.name?.[0]?.toUpperCase() || '?'
            )}
          </span>
        ))}
        {remaining > 0 && <span className="ss-puck more" style={{ marginLeft: -8 }}>+{remaining}</span>}
      </span>
      <span className="num" style={{ font: '600 10.5px var(--mono)', color: 'var(--muted)' }}>{count} going</span>
    </span>
  );
}
