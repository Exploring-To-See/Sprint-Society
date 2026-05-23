import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { Button } from '../components/ui/Button';

type Tab = 'overview' | 'runners' | 'events' | 'communities' | 'sessions' | 'announcements' | 'analytics' | 'flags' | 'segments' | 'notifications' | 'content' | 'audit' | 'engineering' | 'moderation';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

function formatPace(seconds: number) {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  });

  const { data: runners } = useQuery({
    queryKey: ['admin-runners'],
    queryFn: () => api.get('/admin/runners').then(r => r.data),
    enabled: tab === 'runners' || tab === 'overview',
  });

  const { data: events } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => api.get('/admin/events').then(r => r.data),
    enabled: tab === 'events',
  });

  const { data: communities } = useQuery({
    queryKey: ['admin-communities'],
    queryFn: () => api.get('/admin/communities').then(r => r.data),
    enabled: tab === 'communities',
  });

  const { data: sessions } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => api.get('/admin/sessions').then(r => r.data),
    enabled: tab === 'sessions',
  });

  const { data: announcements } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => api.get('/admin/announcements').then(r => r.data),
    enabled: tab === 'announcements',
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'runners', label: 'Runners' },
    { key: 'events', label: 'Events' },
    { key: 'communities', label: 'Communities' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'announcements', label: 'Posts' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'flags', label: 'Flags' },
    { key: 'segments', label: 'Segments' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'content', label: 'Content' },
    { key: 'audit', label: 'Audit' },
    { key: 'engineering', label: 'Engineering' },
    { key: 'moderation', label: 'Moderation' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-sm font-heading font-bold text-black">K</span>
          </div>
          <h1 className="font-heading text-lg font-bold">
            Sprint <span className="text-accent">Society</span>
          </h1>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-bg-tertiary text-zinc-400 ml-1">ADMIN</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-bg-tertiary overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'text-white border-accent'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-5 py-5">
        {tab === 'overview' && <OverviewTab stats={stats} runners={runners} />}
        {tab === 'runners' && <RunnersTab runners={runners} />}
        {tab === 'events' && <EventsTab events={events} queryClient={queryClient} />}
        {tab === 'communities' && <CommunitiesTab communities={communities} queryClient={queryClient} />}
        {tab === 'sessions' && <SessionsTab sessions={sessions} queryClient={queryClient} />}
        {tab === 'announcements' && <AnnouncementsTab announcements={announcements} queryClient={queryClient} />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'flags' && <FlagsTab />}
        {tab === 'segments' && <SegmentsTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'content' && <ContentTab />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'engineering' && <EngineeringTab />}
        {tab === 'moderation' && <ModerationTab />}
      </main>
    </div>
  );
}

function OverviewTab({ stats, runners }: { stats: any; runners: any[] }) {
  if (!stats) return <div className="text-zinc-600 text-sm py-10 text-center">Loading...</div>;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Runners', value: stats.total_runners },
          { label: 'Total Runs', value: stats.total_runs },
          { label: 'Distance', value: `${stats.total_distance_km} km` },
          { label: 'This Week', value: stats.runs_this_week },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="font-mono text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {stats.tier_breakdown && stats.tier_breakdown.length > 0 && (
        <motion.div variants={fadeUp} className="card p-5">
          <p className="label mb-3">Tier Distribution</p>
          <div className="flex gap-4">
            {stats.tier_breakdown.map((t: any) => (
              <div key={t.tier} className="flex-1 text-center">
                <p className="font-mono text-xl font-bold">{t.count}</p>
                <p className={`text-[11px] capitalize ${
                  t.tier === 'advanced' ? 'text-accent-gold' :
                  t.tier === 'intermediate' ? 'text-accent' : 'text-accent-green'
                }`}>{t.tier}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {runners && runners.length > 0 && (
        <motion.div variants={fadeUp} className="card p-5">
          <p className="label mb-3">Top Runners</p>
          <div className="space-y-2">
            {runners.slice(0, 5).map((r: any, i: number) => (
              <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-primary">
                <span className="text-[11px] text-zinc-600 w-4">{i + 1}</span>
                <span className="flex-1 text-[13px] font-medium">{r.name}</span>
                <span className="font-mono text-xs text-zinc-500">{r.total_xp || 0} XP</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function RunnersTab({ runners }: { runners: any[] }) {
  if (!runners) return <div className="text-zinc-600 text-sm py-10 text-center">Loading...</div>;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      <motion.p variants={fadeUp} className="text-zinc-500 text-sm">{runners.length} runners</motion.p>
      {runners.map((runner: any) => (
        <motion.div key={runner.id} variants={fadeUp} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[14px] font-medium">{runner.name}</p>
              <p className="text-[11px] text-zinc-500">{runner.email}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
              runner.current_tier === 'advanced' ? 'bg-accent-gold/10 text-accent-gold' :
              runner.current_tier === 'intermediate' ? 'bg-accent/10 text-accent' :
              'bg-accent-green/10 text-accent-green'
            }`}>
              {runner.current_tier || 'new'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="font-mono text-sm font-bold">{runner.total_runs}</p>
              <p className="text-[9px] text-zinc-600">runs</p>
            </div>
            <div>
              <p className="font-mono text-sm font-bold">{runner.total_distance ? (runner.total_distance / 1000).toFixed(1) : '0'}</p>
              <p className="text-[9px] text-zinc-600">km</p>
            </div>
            <div>
              <p className="font-mono text-sm font-bold">{runner.avg_pace > 0 ? formatPace(runner.avg_pace) : '--'}</p>
              <p className="text-[9px] text-zinc-600">pace</p>
            </div>
            <div>
              <p className="font-mono text-sm font-bold">{runner.current_level || 1}</p>
              <p className="text-[9px] text-zinc-600">level</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function EventsTab({ events, queryClient }: { events: any[]; queryClient: any }) {
  const [showForm, setShowForm] = useState(false);
  const [goLiveId, setGoLiveId] = useState<number | null>(null);
  const [liveCode, setLiveCode] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'group_run', date: '', time: '06:00',
    duration_minutes: '60', location_name: '', max_attendees: '50', visibility: 'public',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setShowForm(false);
      setForm({ title: '', description: '', event_type: 'group_run', date: '', time: '06:00', duration_minutes: '60', location_name: '', max_attendees: '50', visibility: 'public' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  });

  const goLiveMutation = useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) => api.post(`/admin/events/${id}/go-live`, { check_in_code: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setGoLiveId(null);
      setLiveCode('');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/events/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  });

  const inputClass = "w-full px-4 py-3 rounded-lg bg-bg-primary border border-bg-tertiary text-white text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex justify-between items-center">
        <p className="text-zinc-500 text-sm">{events?.length || 0} events</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Event'}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="card p-5 space-y-3">
          <input type="text" placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} className={inputClass}>
              <option value="group_run">Group Run</option>
              <option value="coffee_meetup">Coffee Meetup</option>
              <option value="workout">Workout</option>
              <option value="social">Social</option>
              <option value="custom">Custom</option>
            </select>
            <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} className={inputClass}>
              <option value="public">Public</option>
              <option value="followers_only">Followers Only</option>
              <option value="invite_only">Invite Only</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputClass} />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Duration (min)" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} className={inputClass} />
            <input type="number" placeholder="Max attendees" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} className={inputClass} />
          </div>
          <input type="text" placeholder="Location" value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} className={inputClass} />
          <Button fullWidth onClick={() => createMutation.mutate({
            ...form,
            duration_minutes: Number(form.duration_minutes),
            max_attendees: Number(form.max_attendees) || null,
          })} disabled={!form.title || !form.date || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Event'}
          </Button>
        </motion.div>
      )}

      {events?.map((e: any) => (
        <motion.div key={e.id} variants={fadeUp} className="card p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-medium">{e.title}</p>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                  e.status === 'upcoming' ? 'bg-accent/10 text-accent' :
                  e.status === 'live' ? 'bg-green-500/10 text-green-400' :
                  e.status === 'completed' ? 'bg-zinc-500/10 text-zinc-400' :
                  'bg-red-500/10 text-red-400'
                }`}>{e.status}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {e.date} at {e.time} • {e.location_name || 'No location'}
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {e.attendee_count || 0} going • {e.event_type} • {e.visibility}
              </p>
            </div>
            <div className="flex flex-col gap-1 ml-3">
              {e.status === 'upcoming' && (
                <button onClick={() => setGoLiveId(goLiveId === e.id ? null : e.id)} className="text-green-400 hover:text-green-300 text-[11px] font-medium transition-colors">
                  Go Live
                </button>
              )}
              {e.status === 'live' && (
                <button onClick={() => completeMutation.mutate(e.id)} className="text-accent hover:text-accent/80 text-[11px] font-medium transition-colors">
                  Complete
                </button>
              )}
              {e.status === 'upcoming' && (
                <button onClick={() => deleteMutation.mutate(e.id)} className="text-zinc-600 hover:text-red-400 text-[11px] transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Go Live form */}
          {goLiveId === e.id && (
            <div className="mt-3 pt-3 border-t border-bg-tertiary flex gap-2">
              <input
                type="text"
                value={liveCode}
                onChange={ev => setLiveCode(ev.target.value.toUpperCase())}
                placeholder="CHECK-IN CODE (e.g. SPRINT31)"
                className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-bg-tertiary text-[12px] font-mono text-white placeholder:text-zinc-600 focus:border-green-500/50 focus:outline-none uppercase"
              />
              <button
                onClick={() => goLiveMutation.mutate({ id: e.id, code: liveCode })}
                disabled={!liveCode.trim() || goLiveMutation.isPending}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-[11px] font-semibold disabled:opacity-40 active:scale-95"
              >
                {goLiveMutation.isPending ? '...' : 'Activate'}
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

function CommunitiesTab({ communities, queryClient }: { communities: any[]; queryClient: any }) {
  const { data: allCommunities, isLoading } = useQuery({
    queryKey: ['admin-all-communities'],
    queryFn: () => api.get('/admin/communities').then(r => r.data),
  });

  const displayCommunities = communities || allCommunities;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <p className="text-zinc-500 text-sm">{displayCommunities?.length || 0} communities</p>
      </motion.div>

      {isLoading && <div className="text-zinc-600 text-sm py-10 text-center">Loading...</div>}

      {displayCommunities?.map((c: any) => (
        <motion.div key={c.id} variants={fadeUp} className="card p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-medium">{c.name}</p>
                {c.is_verified && <span className="text-[10px]">✓</span>}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">{c.description || 'No description'}</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                {c.member_count || 0} members • {c.category} • Owner: {c.owner_name || 'Unknown'}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function SessionsTab({ sessions, queryClient }: { sessions: any[]; queryClient: any }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('5000');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      setShowForm(false);
      setTitle(''); setDistance('5000'); setDate(''); setLocation('');
    },
  });

  const inputClass = "w-full px-4 py-3 rounded-lg bg-bg-primary border border-bg-tertiary text-white text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex justify-between items-center">
        <p className="text-zinc-500 text-sm">{sessions?.length || 0} sessions</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New'}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="card p-5 space-y-3">
          <input type="text" placeholder="Session title (e.g. Sunday 5K)" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Distance (m)" value={distance} onChange={e => setDistance(e.target.value)} className={inputClass} />
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
          <input type="text" placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} />
          <Button fullWidth onClick={() => createMutation.mutate({ title, target_distance_meters: Number(distance), session_date: date, location })}
            disabled={!title || !date || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Session'}
          </Button>
        </motion.div>
      )}

      {sessions?.map((s: any) => (
        <motion.div key={s.id} variants={fadeUp} className="card p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[14px] font-medium">{s.title}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {new Date(s.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' • '}{(s.target_distance_meters / 1000).toFixed(1)} km
              </p>
              {s.location && <p className="text-[11px] text-zinc-600 mt-0.5">{s.location}</p>}
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-bg-tertiary text-zinc-400">
              {s.attendee_count || 0} attended
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function AnnouncementsTab({ announcements, queryClient }: { announcements: any[]; queryClient: any }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/announcements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setShowForm(false);
      setTitle(''); setBody(''); setPinned(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/announcements/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
  });

  const inputClass = "w-full px-4 py-3 rounded-lg bg-bg-primary border border-bg-tertiary text-white text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex justify-between items-center">
        <p className="text-zinc-500 text-sm">{announcements?.length || 0} posts</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Post'}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="card p-5 space-y-3">
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
          <textarea placeholder="Write your announcement..." value={body} onChange={e => setBody(e.target.value)} rows={4}
            className={`${inputClass} resize-none`} />
          <label className="flex items-center gap-2 text-[13px] text-zinc-400">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded" />
            Pin to top
          </label>
          <Button fullWidth onClick={() => createMutation.mutate({ title, body, pinned })}
            disabled={!title || !body || createMutation.isPending}>
            {createMutation.isPending ? 'Posting...' : 'Post'}
          </Button>
        </motion.div>
      )}

      {announcements?.map((a: any) => (
        <motion.div key={a.id} variants={fadeUp} className="card p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {a.pinned && <span className="text-[11px]">📌</span>}
                <p className="text-[14px] font-medium">{a.title}</p>
              </div>
              <p className="text-[13px] text-zinc-400 mt-1 line-clamp-2">{a.body}</p>
              <p className="text-[10px] text-zinc-600 mt-2">
                {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <button
              onClick={() => deleteMutation.mutate(a.id)}
              className="text-zinc-600 hover:text-red-400 text-[11px] ml-3 transition-colors"
            >
              Delete
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ===== ANALYTICS TAB ===== */
function AnalyticsTab() {
  const { data: dashboard } = useQuery({
    queryKey: ['admin-analytics-dashboard'],
    queryFn: () => api.get('/admin/analytics/dashboard').then(r => r.data),
  });

  const { data: metrics } = useQuery({
    queryKey: ['admin-analytics-metrics'],
    queryFn: () => api.get('/admin/analytics/metrics').then(r => r.data),
  });

  const { data: recentEvents } = useQuery({
    queryKey: ['admin-analytics-events'],
    queryFn: () => api.get('/admin/analytics/events').then(r => r.data),
  });

  if (!dashboard) return <div className="text-zinc-600 text-sm py-10 text-center">Loading...</div>;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'DAU', value: dashboard.dau ?? 0 },
          { label: 'New This Week', value: dashboard.new_users_this_week ?? 0 },
          { label: 'Runs Today', value: dashboard.total_runs_today ?? 0 },
          { label: 'Active Runners', value: dashboard.active_runners ?? 0 },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="font-mono text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {metrics?.dau_history && metrics.dau_history.length > 0 && (
        <motion.div variants={fadeUp} className="card p-5">
          <p className="label mb-3">DAU — Last 30 Days</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.dau_history}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#a1a1aa' }} />
                <Line type="monotone" dataKey="value" stroke="#c8ff00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {recentEvents && recentEvents.length > 0 && (
        <motion.div variants={fadeUp} className="card p-5">
          <p className="label mb-3">Recent Events</p>
          <div className="space-y-2">
            {recentEvents.slice(0, 10).map((ev: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-bg-primary">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate">{ev.event_name || ev.action}</p>
                  <p className="text-[10px] text-zinc-600">{ev.user_name || `User #${ev.user_id}`}</p>
                </div>
                <span className="text-[10px] text-zinc-600 ml-2 shrink-0">
                  {ev.created_at ? new Date(ev.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ===== FEATURE FLAGS TAB ===== */
function FlagsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: '', name: '', description: '' });

  const { data: flags } = useQuery({
    queryKey: ['admin-flags'],
    queryFn: () => api.get('/admin/flags').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/flags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flags'] });
      setShowForm(false);
      setForm({ key: '', name: '', description: '' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => api.put(`/admin/flags/${id}`, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-flags'] }),
  });

  const inputClass = "w-full px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex justify-between items-center">
        <p className="text-zinc-500 text-sm">{flags?.length || 0} flags</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Flag'}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="card p-5 space-y-3">
          <input type="text" placeholder="Flag key (e.g. enable_dark_mode)" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} className={inputClass} />
          <input type="text" placeholder="Display name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
          <input type="text" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} />
          <Button fullWidth onClick={() => createMutation.mutate(form)} disabled={!form.key || !form.name || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Flag'}
          </Button>
        </motion.div>
      )}

      {flags?.map((flag: any) => (
        <motion.div key={flag.id} variants={fadeUp} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-medium">{flag.name}</p>
                <span className="font-mono text-[10px] text-zinc-600">{flag.key}</span>
              </div>
              {flag.description && <p className="text-[11px] text-zinc-500 mt-0.5">{flag.description}</p>}
              {flag.rollout_percentage != null && (
                <p className="text-[10px] text-zinc-600 mt-0.5">Rollout: {flag.rollout_percentage}%</p>
              )}
            </div>
            <button
              onClick={() => toggleMutation.mutate({ id: flag.id, enabled: !flag.enabled })}
              className={`relative w-10 h-5 rounded-full transition-colors ${flag.enabled ? 'bg-accent' : 'bg-bg-tertiary'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ===== SEGMENTS TAB ===== */
function SegmentsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', criteria: '' });

  const { data: segments } = useQuery({
    queryKey: ['admin-segments'],
    queryFn: () => api.get('/admin/segments').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/segments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-segments'] });
      setShowForm(false);
      setForm({ name: '', description: '', criteria: '' });
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/segments/${id}/evaluate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-segments'] }),
  });

  const inputClass = "w-full px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex justify-between items-center">
        <p className="text-zinc-500 text-sm">{segments?.length || 0} segments</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Segment'}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="card p-5 space-y-3">
          <input type="text" placeholder="Segment name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
          <input type="text" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} />
          <textarea placeholder='Criteria (JSON, e.g. {"tier": "advanced", "min_runs": 10})' value={form.criteria} onChange={e => setForm(f => ({ ...f, criteria: e.target.value }))} rows={4} className={`${inputClass} resize-none font-mono text-xs`} />
          <Button fullWidth onClick={() => createMutation.mutate({ ...form, criteria: form.criteria ? JSON.parse(form.criteria) : {} })} disabled={!form.name || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Segment'}
          </Button>
        </motion.div>
      )}

      {segments?.map((seg: any) => (
        <motion.div key={seg.id} variants={fadeUp} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium">{seg.name}</p>
              {seg.description && <p className="text-[11px] text-zinc-500 mt-0.5">{seg.description}</p>}
              <p className="text-[10px] text-zinc-600 mt-0.5">{seg.member_count ?? 0} members</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => evaluateMutation.mutate(seg.id)} disabled={evaluateMutation.isPending}>
              {evaluateMutation.isPending ? '...' : 'Evaluate'}
            </Button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ===== PUSH NOTIFICATIONS TAB ===== */
function NotificationsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', target_type: 'all' });

  const { data: notifications } = useQuery({
    queryKey: ['admin-push'],
    queryFn: () => api.get('/admin/push').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/push', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-push'] });
      setShowForm(false);
      setForm({ title: '', body: '', target_type: 'all' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/push/${id}/send`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-push'] }),
  });

  const inputClass = "w-full px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors";

  const statusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500/10 text-green-400';
      case 'scheduled': return 'bg-accent/10 text-accent';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex justify-between items-center">
        <p className="text-zinc-500 text-sm">{notifications?.length || 0} notifications</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Notification'}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="card p-5 space-y-3">
          <input type="text" placeholder="Notification title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
          <textarea placeholder="Notification body" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
          <select value={form.target_type} onChange={e => setForm(f => ({ ...f, target_type: e.target.value }))} className={inputClass}>
            <option value="all">All Users</option>
            <option value="segment">Segment</option>
            <option value="user">Specific User</option>
          </select>
          <Button fullWidth onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.body || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Notification'}
          </Button>
        </motion.div>
      )}

      {notifications?.map((n: any) => (
        <motion.div key={n.id} variants={fadeUp} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-medium">{n.title}</p>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${statusColor(n.status)}`}>
                  {n.status}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{n.body}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">Target: {n.target_type}</p>
            </div>
            {n.status === 'draft' && (
              <Button size="sm" onClick={() => sendMutation.mutate(n.id)} disabled={sendMutation.isPending}>
                {sendMutation.isPending ? '...' : 'Send'}
              </Button>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ===== CONTENT CMS TAB ===== */
function ContentTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'tip', title: '', body: '', target_tier: '' });

  const { data: content } = useQuery({
    queryKey: ['admin-content'],
    queryFn: () => api.get('/admin/content').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/content', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setShowForm(false);
      setForm({ type: 'tip', title: '', body: '', target_tier: '' });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) => api.put(`/admin/content/${id}`, { published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-content'] }),
  });

  const inputClass = "w-full px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors";

  const typeColor = (type: string) => {
    switch (type) {
      case 'tip': return 'bg-accent/10 text-accent';
      case 'article': return 'bg-blue-500/10 text-blue-400';
      case 'quote': return 'bg-purple-500/10 text-purple-400';
      case 'coaching_message': return 'bg-accent-gold/10 text-accent-gold';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex justify-between items-center">
        <p className="text-zinc-500 text-sm">{content?.length || 0} content blocks</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Content'}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="card p-5 space-y-3">
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputClass}>
            <option value="tip">Tip</option>
            <option value="article">Article</option>
            <option value="quote">Quote</option>
            <option value="coaching_message">Coaching Message</option>
          </select>
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
          <textarea placeholder="Body content" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} className={`${inputClass} resize-none`} />
          <select value={form.target_tier} onChange={e => setForm(f => ({ ...f, target_tier: e.target.value }))} className={inputClass}>
            <option value="">All Tiers</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <Button fullWidth onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.body || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Content'}
          </Button>
        </motion.div>
      )}

      {content?.map((item: any) => (
        <motion.div key={item.id} variants={fadeUp} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-medium">{item.title}</p>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${typeColor(item.type)}`}>
                  {item.type}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{item.body}</p>
              {item.target_tier && <p className="text-[10px] text-zinc-600 mt-0.5">Tier: {item.target_tier}</p>}
            </div>
            <button
              onClick={() => togglePublishMutation.mutate({ id: item.id, published: !item.published })}
              className={`text-[11px] font-medium px-3 py-1 rounded-lg transition-colors ${
                item.published ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
              }`}
            >
              {item.published ? 'Published' : 'Draft'}
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ===== AUDIT LOG TAB ===== */
function AuditTab() {
  const { data: auditLog } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => api.get('/admin/audit').then(r => r.data),
  });

  if (!auditLog) return <div className="text-zinc-600 text-sm py-10 text-center">Loading...</div>;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.p variants={fadeUp} className="text-zinc-500 text-sm">{auditLog.length} entries</motion.p>

      <motion.div variants={fadeUp} className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-bg-tertiary">
                <th className="px-4 py-3 text-[10px] font-medium text-zinc-500 uppercase">Admin</th>
                <th className="px-4 py-3 text-[10px] font-medium text-zinc-500 uppercase">Action</th>
                <th className="px-4 py-3 text-[10px] font-medium text-zinc-500 uppercase">Target</th>
                <th className="px-4 py-3 text-[10px] font-medium text-zinc-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry: any, i: number) => (
                <tr key={i} className="border-b border-bg-tertiary/50 last:border-0">
                  <td className="px-4 py-3 text-[12px] text-zinc-400 font-mono">{entry.admin_name || `#${entry.admin_id}`}</td>
                  <td className="px-4 py-3 text-[12px] text-white">{entry.action}</td>
                  <td className="px-4 py-3 text-[12px] text-zinc-500">{entry.target || '-'}</td>
                  <td className="px-4 py-3 text-[10px] text-zinc-600">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ===== ENGINEERING HUB TAB ===== */
function EngineeringTab() {
  const { data: sprints } = useQuery({
    queryKey: ['admin-engineering-sprints'],
    queryFn: () => api.get('/admin/engineering/sprints').then(r => r.data),
  });

  if (!sprints) return <div className="text-zinc-600 text-sm py-10 text-center">Loading...</div>;

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400';
      case 'in_progress': return 'bg-accent/10 text-accent';
      case 'planned': return 'bg-blue-500/10 text-blue-400';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.p variants={fadeUp} className="text-zinc-500 text-sm">{sprints.length} sprints</motion.p>

      {sprints.map((sprint: any) => (
        <motion.div key={sprint.id || sprint.date} variants={fadeUp} className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[14px] font-medium">
              {sprint.date ? new Date(sprint.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sprint'}
            </p>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${statusColor(sprint.status)}`}>
              {sprint.status}
            </span>
          </div>
          {sprint.proposed && (
            <p className="text-[11px] text-zinc-500">
              <span className="text-zinc-600">Proposed:</span> {sprint.proposed}
            </p>
          )}
          {sprint.built && (
            <p className="text-[11px] text-zinc-400 mt-0.5">
              <span className="text-zinc-600">Built:</span> {sprint.built}
            </p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ===== MODERATION TAB ===== */
function ModerationTab() {
  const queryClient = useQueryClient();

  const { data: queue } = useQuery({
    queryKey: ['admin-moderation-queue'],
    queryFn: () => api.get('/admin/moderation/queue').then(r => r.data),
  });

  const hideCommentMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/moderation/comments/${id}/hide`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] }),
  });

  const hidePostMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/moderation/posts/${id}/hide`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] }),
  });

  if (!queue) return <div className="text-zinc-600 text-sm py-10 text-center">Loading...</div>;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.p variants={fadeUp} className="text-zinc-500 text-sm">{queue.length} items in queue</motion.p>

      {queue.length === 0 && (
        <motion.div variants={fadeUp} className="card p-8 text-center">
          <p className="text-zinc-500 text-sm">Queue is empty — nothing to moderate.</p>
        </motion.div>
      )}

      {queue.map((item: any) => (
        <motion.div key={`${item.type}-${item.id}`} variants={fadeUp} className="card p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                  item.type === 'comment' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {item.type}
                </span>
                <p className="text-[11px] text-zinc-500">{item.user_name || `User #${item.user_id}`}</p>
              </div>
              <p className="text-[13px] text-zinc-300 mt-1.5 line-clamp-3">{item.content || item.body}</p>
              <p className="text-[10px] text-zinc-600 mt-1">
                {item.created_at ? new Date(item.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
            <button
              onClick={() => item.type === 'comment' ? hideCommentMutation.mutate(item.id) : hidePostMutation.mutate(item.id)}
              className="ml-3 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
            >
              Hide
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
