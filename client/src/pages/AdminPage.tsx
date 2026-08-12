import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SSAura } from '../components/ss/SSAura';
import { SSSeg } from '../components/ss/SSSeg';
import { Flame, Pin, Check, Hand, Dumbbell, Medal, Bolt, Plus } from '../components/ss/icons';

type Tab = 'overview' | 'runners' | 'events' | 'communities' | 'sessions' | 'announcements' | 'analytics' | 'flags' | 'segments' | 'notifications' | 'content' | 'audit' | 'engineering' | 'email' | 'moderation' | 'backup';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

// --- ss admin atoms ---
const adminInput: React.CSSProperties = {
  width: '100%', padding: '12px 13px', borderRadius: 12,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13px var(--body)', color: 'var(--fg)', outline: 'none',
};
const secLbl: React.CSSProperties = {
  font: '600 10px var(--body)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted-2)',
};
const countLine: React.CSSProperties = { font: '500 12px var(--body)', color: 'var(--muted)', margin: 0 };
const ghostDanger: React.CSSProperties = {
  font: '500 11px var(--body)', color: 'var(--muted-2)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
};

function LoadingRow() {
  return <div style={{ padding: '40px 0', textAlign: 'center', font: '500 12.5px var(--body)', color: 'var(--muted-2)' }}>Loading…</div>;
}

function SoftBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="ss-btn ss-btn-soft" onClick={onClick} disabled={disabled}
      style={{ height: 34, padding: '0 13px', fontSize: 12, flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {children}
    </button>
  );
}

function SubmitBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="ss-btn ss-btn-primary" onClick={onClick} disabled={disabled}
      style={{ height: 46, fontSize: 13.5, width: '100%', flex: 'none' }}>
      {children}
    </button>
  );
}

function formatPace(seconds: number) {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  });

  const { data: runners } = useQuery({
    queryKey: ['admin-runners'],
    queryFn: () => api.get('/admin/runners?limit=100').then(r => r.data.runners),
    enabled: tab === 'runners' || tab === 'overview',
  });

  const { data: events } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => api.get('/admin/events?limit=100').then(r => r.data.events),
    enabled: tab === 'events',
  });

  const { data: communities } = useQuery({
    queryKey: ['admin-communities'],
    queryFn: () => api.get('/admin/communities?limit=100').then(r => r.data.communities),
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
    { key: 'email', label: 'Outreach' },
    { key: 'moderation', label: 'Moderation' },
    { key: 'backup', label: 'Backup' },
  ];

  return (
    <div className="ss-screen" style={{ minHeight: '100dvh' }} aria-label="Admin panel">
      <SSAura />
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 672, margin: '0 auto', padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <img src="/icons/logo.png" alt="" style={{ width: 30, height: 30, borderRadius: 9, objectFit: 'cover' }} />
          <h1 style={{ font: '600 16px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)', margin: 0 }}>
            <span style={{ color: 'var(--accent-2)' }}>Sprint</span> Society
          </h1>
          <span className="ss-tag now">Admin</span>
          <button onClick={logout} style={{ ...ghostDanger, marginLeft: 'auto', fontSize: 11.5 }}>
            Log out
          </button>
        </div>

        {/* Tabs — wrap so every tab (incl. Outreach) is visible; a horizontal
            scroll strip hid later tabs behind a hidden scrollbar. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 10 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`ss-tab ${tab === t.key ? 'on' : ''}`}
              style={{ flex: 'none', minHeight: 32, padding: '0 13px', fontSize: 12 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ position: 'relative', zIndex: 2, maxWidth: 672, margin: '0 auto', padding: '16px 20px 40px' }}>
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
        {tab === 'email' && <EmailTab />}
        {tab === 'moderation' && <ModerationTab />}
        {tab === 'backup' && <BackupTab />}
      </main>
    </div>
  );
}

function OverviewTab({ stats, runners }: { stats: any; runners: any[] }) {
  const { data: streakData } = useQuery({
    queryKey: ['admin-streaks'],
    queryFn: () => api.get('/admin/streak-health').then(r => r.data).catch(() => null),
  });

  if (!stats) return <LoadingRow />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 9 }}>
        {[
          { label: 'Runners', value: stats.total_runners },
          { label: 'Total Runs', value: stats.total_runs },
          { label: 'Distance', value: `${stats.total_distance_km} km` },
          { label: 'This Week', value: stats.runs_this_week },
        ].map(s => (
          <div key={s.label} className="tile recess" style={{ padding: '14px 12px', alignItems: 'center' }}>
            <p className="num" style={{ font: '700 20px var(--mono)', color: 'var(--fg)', margin: 0 }}>{s.value}</p>
            <p style={{ ...secLbl, marginTop: 5 }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Streak Health */}
      {streakData && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16 }}>
          <p style={{ ...secLbl, marginBottom: 11 }}>Streak Health</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 9, marginBottom: 13 }}>
            {[
              { v: streakData.active_streaks, l: 'Active', c: 'var(--green)', bg: 'rgba(52,211,153,.07)', bd: 'rgba(52,211,153,.16)' },
              { v: streakData.at_risk, l: 'At Risk', c: 'var(--amber)', bg: 'rgba(251,191,36,.07)', bd: 'rgba(251,191,36,.16)' },
              { v: streakData.lost_today, l: 'Lost Today', c: 'var(--muted)', bg: 'rgba(255,255,255,.04)', bd: 'var(--hair)' },
            ].map(x => (
              <div key={x.l} style={{ textAlign: 'center', padding: '9px 6px', borderRadius: 12, background: x.bg, border: `1px solid ${x.bd}` }}>
                <p className="num" style={{ font: '700 16px var(--mono)', color: x.c, margin: 0 }}>{x.v}</p>
                <p style={{ ...secLbl, marginTop: 3 }}>{x.l}</p>
              </div>
            ))}
          </div>
          {streakData.at_risk_runners?.length > 0 && (
            <div>
              <p style={{ ...secLbl, marginBottom: 7 }}>At-risk runners (no run today)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {streakData.at_risk_runners.slice(0, 5).map((r: any) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 9px', borderRadius: 9, background: 'rgba(255,255,255,.03)', border: '1px solid var(--hair)' }}>
                    <span style={{ font: '500 11.5px var(--body)', color: 'var(--muted)' }}>{r.name}</span>
                    <span className="num" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '600 10.5px var(--mono)', color: 'var(--amber)' }}>
                      <Flame width={10} height={10} /> {r.streak}d streak
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {stats.tier_breakdown && stats.tier_breakdown.length > 0 && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16 }}>
          <p style={{ ...secLbl, marginBottom: 11 }}>Tier Distribution</p>
          <div style={{ display: 'flex', gap: 14 }}>
            {stats.tier_breakdown.map((t: any) => (
              <div key={t.tier} style={{ flex: 1, textAlign: 'center' }}>
                <p className="num" style={{ font: '700 20px var(--mono)', color: 'var(--fg)', margin: 0 }}>{t.count}</p>
                <p style={{
                  font: '600 11px var(--body)', textTransform: 'capitalize', marginTop: 3,
                  color: t.tier === 'advanced' ? 'var(--amber)' : t.tier === 'intermediate' ? 'var(--accent-2)' : 'var(--green)',
                }}>{t.tier}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {runners && runners.length > 0 && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16 }}>
          <p style={{ ...secLbl, marginBottom: 11 }}>Top Runners</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {runners.slice(0, 5).map((r: any, i: number) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,.03)', border: '1px solid var(--hair)' }}>
                <span className="num" style={{ font: '600 11px var(--mono)', color: 'var(--muted-2)', width: 14 }}>{i + 1}</span>
                <span style={{ flex: 1, font: '600 13px var(--body)', color: 'var(--fg)' }}>{r.name}</span>
                <span className="num" style={{ font: '600 11.5px var(--mono)', color: 'var(--muted)' }}>{r.total_xp || 0} XP</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const TIER_TAG: Record<string, string> = { beginner: 'go', intermediate: 'now', advanced: 'maybe' };

function RunnersTab({ runners }: { runners: any[] }) {
  if (!runners) return <LoadingRow />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <motion.p variants={fadeUp} style={countLine}>{runners.length} runners</motion.p>
      {runners.map((runner: any) => (
        <motion.div key={runner.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <div>
              <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{runner.name}</p>
              <p style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>{runner.email}</p>
            </div>
            <span className={`ss-tag ${TIER_TAG[runner.current_tier] || 'full'}`} style={{ textTransform: 'capitalize' }}>
              {runner.current_tier || 'new'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6, textAlign: 'center' }}>
            {[
              { v: runner.total_runs, l: 'runs' },
              { v: runner.total_distance ? (runner.total_distance / 1000).toFixed(1) : '0', l: 'km' },
              { v: runner.avg_pace > 0 ? formatPace(runner.avg_pace) : '--', l: 'pace' },
              { v: runner.current_level || 1, l: 'level' },
            ].map(x => (
              <div key={x.l}>
                <p className="num" style={{ font: '700 13px var(--mono)', color: 'var(--fg)', margin: 0 }}>{x.v}</p>
                <p style={{ font: '500 10.5px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>{x.l}</p>
              </div>
            ))}
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

  const EVENT_TAG: Record<string, string> = { upcoming: 'soon', live: 'go', completed: 'full' };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={countLine}>{events?.length || 0} events</p>
        <SoftBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus width={12} height={12} /> New Event</>}
        </SoftBtn>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 9 }}>
          <input type="text" placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={adminInput} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...adminInput, resize: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} style={adminInput}>
              <option value="group_run">Group Run</option>
              <option value="coffee_meetup">Coffee Meetup</option>
              <option value="workout">Workout</option>
              <option value="social">Social</option>
              <option value="custom">Custom</option>
            </select>
            <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} style={adminInput}>
              <option value="public">Public</option>
              <option value="followers_only">Followers Only</option>
              <option value="invite_only">Invite Only</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={adminInput} />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={adminInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <input type="number" placeholder="Duration (min)" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} style={adminInput} />
            <input type="number" placeholder="Max attendees" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} style={adminInput} />
          </div>
          <input type="text" placeholder="Location" value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} style={adminInput} />
          <SubmitBtn onClick={() => createMutation.mutate({
            ...form,
            duration_minutes: Number(form.duration_minutes),
            max_attendees: Number(form.max_attendees) || null,
          })} disabled={!form.title || !form.date || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Event'}
          </SubmitBtn>
        </motion.div>
      )}

      {events?.map((e: any) => (
        <motion.div key={e.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{e.title}</p>
                <span className={`ss-tag ${EVENT_TAG[e.status] || 'maybe'}`}>{e.status}</span>
              </div>
              <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '4px 0 0' }}>
                {e.date} at {e.time} · {e.location_name || 'No location'}
              </p>
              <p style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>
                {e.attendee_count || 0} going · {e.event_type} · {e.visibility}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 11, alignItems: 'flex-end' }}>
              {e.status === 'upcoming' && (
                <button onClick={() => setGoLiveId(goLiveId === e.id ? null : e.id)} style={{ ...ghostDanger, color: 'var(--green)', fontWeight: 600 }}>
                  Go Live
                </button>
              )}
              {e.status === 'live' && (
                <button onClick={() => completeMutation.mutate(e.id)} style={{ ...ghostDanger, color: 'var(--accent-2)', fontWeight: 600 }}>
                  Complete
                </button>
              )}
              {e.status === 'upcoming' && (
                <button onClick={() => deleteMutation.mutate(e.id)} style={ghostDanger}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Go Live form */}
          {goLiveId === e.id && (
            <div style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--hair)', display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={liveCode}
                onChange={ev => setLiveCode(ev.target.value.toUpperCase())}
                placeholder="CHECK-IN CODE (e.g. SPRINT31)"
                className="num"
                style={{ ...adminInput, flex: 1, width: 'auto', font: '600 12px var(--mono)', textTransform: 'uppercase' }}
              />
              <button
                onClick={() => goLiveMutation.mutate({ id: e.id, code: liveCode })}
                disabled={!liveCode.trim() || goLiveMutation.isPending}
                className="ss-btn ss-btn-primary"
                style={{ height: 42, padding: '0 16px', fontSize: 12, flex: 'none' }}
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
    queryFn: () => api.get('/admin/communities?limit=100').then(r => r.data.communities),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['admin-community-requests'],
    queryFn: () => api.get('/communities/requests').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/communities/requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-communities'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.post(`/communities/requests/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-community-requests'] }),
  });

  const displayCommunities = communities || allCommunities;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {/* Pending Requests */}
      {requests.length > 0 && (
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <p style={{ ...secLbl, color: 'var(--accent-2)' }}>Pending Requests ({requests.length})</p>
          {requests.map((r: any) => (
            <div key={r.id} className="tile" style={{ padding: 14, gap: 7, borderColor: 'rgba(249,115,22,.25)', background: 'rgba(249,115,22,.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{r.name}</p>
                  <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '2px 0 0' }}>{r.purpose}</p>
                </div>
                <span className="ss-tag now" style={{ textTransform: 'capitalize' }}>{r.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, font: '400 10.5px var(--body)', color: 'var(--muted-2)' }}>
                <span>By: {r.user_name} ({r.user_email})</span>
                <span>Balance: <span className="num" style={{ font: '600 10.5px var(--mono)', color: (r.user_balance ?? 0) >= 1000 ? 'var(--green)' : 'var(--amber)' }}>{r.user_balance ?? 0} K</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, font: '400 10.5px var(--body)', color: 'var(--muted-2)' }}>
                <span>Leader: {r.leader_name}</span>
                <span>Contact: {r.contact}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button
                  onClick={() => approveMutation.mutate(r.id)}
                  disabled={approveMutation.isPending}
                  className="ss-btn ss-btn-soft"
                  style={{ flex: 1, height: 38, fontSize: 11.5, color: 'var(--green)' }}
                >
                  Approve (charges 1000 K)
                </button>
                <button
                  onClick={() => rejectMutation.mutate(r.id)}
                  disabled={rejectMutation.isPending}
                  className="ss-btn ss-btn-ghost"
                  style={{ flex: 1, height: 38, fontSize: 11.5, color: 'var(--amber)' }}
                >
                  Reject
                </button>
              </div>
              {approveMutation.isError && (
                <p style={{ font: '500 10.5px var(--body)', color: 'var(--amber)', margin: 0 }}>{(approveMutation.error as any)?.message || 'Failed'}</p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Existing communities */}
      <motion.div variants={fadeUp}>
        <p style={countLine}>{displayCommunities?.length || 0} communities</p>
      </motion.div>

      {isLoading && <LoadingRow />}

      {displayCommunities?.map((c: any) => (
        <motion.div key={c.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{c.name}</p>
                {c.is_verified && <Check width={11} height={11} style={{ color: 'var(--accent-2)' }} />}
              </div>
              <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '2px 0 0' }}>{c.description || 'No description'}</p>
              <p style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', margin: '4px 0 0' }}>
                {c.member_count || 0} members · {c.category} · Owner: {c.owner_name || 'Unknown'}
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={countLine}>{sessions?.length || 0} sessions</p>
        <SoftBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus width={12} height={12} /> New</>}
        </SoftBtn>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 9 }}>
          <input type="text" placeholder="Session title (e.g. Sunday 5K)" value={title} onChange={e => setTitle(e.target.value)} style={adminInput} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <input type="number" placeholder="Distance (m)" value={distance} onChange={e => setDistance(e.target.value)} style={adminInput} />
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={adminInput} />
          </div>
          <input type="text" placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} style={adminInput} />
          <SubmitBtn onClick={() => createMutation.mutate({ title, target_distance_meters: Number(distance), session_date: date, location })}
            disabled={!title || !date || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Session'}
          </SubmitBtn>
        </motion.div>
      )}

      {sessions?.map((s: any) => (
        <motion.div key={s.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{s.title}</p>
              <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '3px 0 0' }}>
                {new Date(s.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}{(s.target_distance_meters / 1000).toFixed(1)} km
              </p>
              {s.location && <p style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>{s.location}</p>}
            </div>
            <span className="ss-tag full">{s.attendee_count || 0} attended</span>
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={countLine}>{announcements?.length || 0} posts</p>
        <SoftBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus width={12} height={12} /> New Post</>}
        </SoftBtn>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 9 }}>
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={adminInput} />
          <textarea placeholder="Write your announcement..." value={body} onChange={e => setBody(e.target.value)} rows={4}
            style={{ ...adminInput, resize: 'none' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 12.5px var(--body)', color: 'var(--muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Pin to top
          </label>
          <SubmitBtn onClick={() => createMutation.mutate({ title, body, pinned })}
            disabled={!title || !body || createMutation.isPending}>
            {createMutation.isPending ? 'Posting...' : 'Post'}
          </SubmitBtn>
        </motion.div>
      )}

      {announcements?.map((a: any) => (
        <motion.div key={a.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {a.pinned && <Pin width={11} height={11} style={{ color: 'var(--amber)', flexShrink: 0 }} />}
                <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{a.title}</p>
              </div>
              <p style={{
                font: '400 12.5px/1.5 var(--body)', color: 'var(--muted)', margin: '4px 0 0',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{a.body}</p>
              <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', margin: '7px 0 0' }}>
                {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <button onClick={() => deleteMutation.mutate(a.id)} style={{ ...ghostDanger, marginLeft: 11 }}>
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

  if (!dashboard) return <LoadingRow />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 9 }}>
        {[
          { label: 'DAU', value: dashboard.dau ?? 0 },
          { label: 'New This Week', value: dashboard.new_users_week ?? 0 },
          { label: 'Runs Today', value: dashboard.total_runs_today ?? 0 },
          { label: 'Active Runners', value: dashboard.active_runners_today ?? 0 },
        ].map(s => (
          <div key={s.label} className="tile recess" style={{ padding: '14px 12px', alignItems: 'center' }}>
            <p className="num" style={{ font: '700 20px var(--mono)', color: 'var(--fg)', margin: 0 }}>{s.value}</p>
            <p style={{ ...secLbl, marginTop: 5 }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {Array.isArray(metrics) && metrics.length > 0 && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16 }}>
          <p style={{ ...secLbl, marginBottom: 11 }}>DAU — Last 30 Days</p>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              {/* /admin/analytics/metrics returns the daily_metrics rows directly
                  (date, dau, ...) — there is no dau_history wrapper object. */}
              <LineChart data={[...metrics].reverse()}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-2)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-2)' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: 'rgba(12,12,18,.94)', border: '1px solid var(--hair)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: 'var(--muted)' }} />
                <Line type="monotone" dataKey="dau" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {recentEvents && recentEvents.length > 0 && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16 }}>
          <p style={{ ...secLbl, marginBottom: 11 }}>Recent Events</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentEvents.slice(0, 10).map((ev: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,.03)', border: '1px solid var(--hair)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ font: '600 12px var(--body)', color: 'var(--fg)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.event_name || ev.action}</p>
                  <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>{ev.user_name || `User #${ev.user_id}`}</p>
                </div>
                <span style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', marginLeft: 8, flexShrink: 0 }}>
                  {ev.created_at ? new Date(ev.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <EngagementMetrics />
    </motion.div>
  );
}

function EngagementMetrics() {
  const { data } = useQuery({
    queryKey: ['admin-engagement'],
    queryFn: () => api.get('/admin/analytics/engagement').then(r => r.data).catch(() => null),
  });

  if (!data) return null;

  const REACTION_ICONS: Record<string, typeof Hand> = { high_five: Hand, fire: Flame, impressive: Dumbbell, respect: Medal, lets_go: Bolt };

  return (
    <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <p style={secLbl}>Engagement (P2 Features)</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 9 }}>
        {[
          { v: data.badges.total_earned, l: 'Badges Earned', c: 'var(--amber)' },
          { v: data.reactions.total, l: 'Reactions', c: 'var(--accent-2)' },
          { v: `${data.streaks.top?.[0]?.streak || 0}d`, l: 'Top Streak', c: 'var(--green)' },
          { v: data.communities.active_this_week, l: 'Active Clubs', c: 'var(--fg)' },
        ].map(x => (
          <div key={x.l} className="tile recess" style={{ padding: '12px 10px', alignItems: 'center' }}>
            <p className="num" style={{ font: '700 16px var(--mono)', color: x.c, margin: 0 }}>{x.v}</p>
            <p style={{ ...secLbl, marginTop: 4 }}>{x.l}</p>
          </div>
        ))}
      </div>

      {/* Reaction breakdown */}
      {data.reactions.breakdown?.length > 0 && (
        <div className="tile" style={{ padding: 14 }}>
          <p style={{ ...secLbl, marginBottom: 9 }}>Reaction Types</p>
          <div style={{ display: 'flex', gap: 14 }}>
            {data.reactions.breakdown.map((r: any) => {
              const RIcon = REACTION_ICONS[r.type] || Hand;
              return (
                <div key={r.type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RIcon width={13} height={13} style={{ color: 'var(--muted)' }} />
                  <span className="num" style={{ font: '600 11px var(--mono)', color: 'var(--muted)' }}>{r.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top streaks */}
      {data.streaks.top?.length > 0 && (
        <div className="tile" style={{ padding: 14 }}>
          <p style={{ ...secLbl, marginBottom: 9 }}>Top Streaks</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.streaks.top.map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', borderRadius: 9, background: 'rgba(255,255,255,.03)', border: '1px solid var(--hair)' }}>
                <span style={{ font: '500 11.5px var(--body)', color: 'var(--muted)' }}>{s.name}</span>
                <span className="num" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '600 10.5px var(--mono)', color: 'var(--accent-2)' }}>
                  <Flame width={10} height={10} /> {s.streak}d
                </span>
              </div>
            ))}
          </div>
        </div>
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={countLine}>{flags?.length || 0} flags</p>
        <SoftBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus width={12} height={12} /> New Flag</>}
        </SoftBtn>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 9 }}>
          <input type="text" placeholder="Flag key (e.g. enable_dark_mode)" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} style={adminInput} />
          <input type="text" placeholder="Display name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={adminInput} />
          <input type="text" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={adminInput} />
          <SubmitBtn onClick={() => createMutation.mutate(form)} disabled={!form.key || !form.name || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Flag'}
          </SubmitBtn>
        </motion.div>
      )}

      {flags?.map((flag: any) => (
        <motion.div key={flag.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{flag.name}</p>
                <span className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>{flag.key}</span>
              </div>
              {flag.description && <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '2px 0 0' }}>{flag.description}</p>}
              {flag.rollout_percentage != null && (
                <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>Rollout: {flag.rollout_percentage}%</p>
              )}
            </div>
            <button
              onClick={() => toggleMutation.mutate({ id: flag.id, enabled: !flag.enabled })}
              aria-label={flag.enabled ? 'Disable flag' : 'Enable flag'}
              style={{
                position: 'relative', width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: flag.enabled ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : 'rgba(255,255,255,.12)',
                transition: 'background .2s var(--ease)', flex: 'none',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transform: flag.enabled ? 'translateX(18px)' : 'translateX(0)', transition: 'transform .2s var(--ease)',
              }} />
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={countLine}>{segments?.length || 0} segments</p>
        <SoftBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus width={12} height={12} /> New Segment</>}
        </SoftBtn>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 9 }}>
          <input type="text" placeholder="Segment name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={adminInput} />
          <input type="text" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={adminInput} />
          <textarea placeholder='Criteria (JSON, e.g. {"tier": "advanced", "min_runs": 10})' value={form.criteria} onChange={e => setForm(f => ({ ...f, criteria: e.target.value }))} rows={4}
            className="num" style={{ ...adminInput, resize: 'none', font: '500 11.5px var(--mono)' }} />
          <SubmitBtn onClick={() => createMutation.mutate({ ...form, criteria: form.criteria ? JSON.parse(form.criteria) : {} })} disabled={!form.name || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Segment'}
          </SubmitBtn>
        </motion.div>
      )}

      {segments?.map((seg: any) => (
        <motion.div key={seg.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{seg.name}</p>
              {seg.description && <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '2px 0 0' }}>{seg.description}</p>}
              <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>{seg.member_count ?? 0} members</p>
            </div>
            <SoftBtn onClick={() => evaluateMutation.mutate(seg.id)} disabled={evaluateMutation.isPending}>
              {evaluateMutation.isPending ? '...' : 'Evaluate'}
            </SoftBtn>
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

  const PUSH_TAG: Record<string, string> = { sent: 'go', scheduled: 'soon' };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={countLine}>{notifications?.length || 0} notifications</p>
        <SoftBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus width={12} height={12} /> New Notification</>}
        </SoftBtn>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 9 }}>
          <input type="text" placeholder="Notification title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={adminInput} />
          <textarea placeholder="Notification body" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={3} style={{ ...adminInput, resize: 'none' }} />
          <select value={form.target_type} onChange={e => setForm(f => ({ ...f, target_type: e.target.value }))} style={adminInput}>
            <option value="all">All Users</option>
            <option value="segment">Segment</option>
            <option value="user">Specific User</option>
          </select>
          <SubmitBtn onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.body || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Notification'}
          </SubmitBtn>
        </motion.div>
      )}

      {notifications?.map((n: any) => (
        <motion.div key={n.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{n.title}</p>
                <span className={`ss-tag ${PUSH_TAG[n.status] || 'full'}`}>{n.status}</span>
              </div>
              <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>
              <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>Target: {n.target_type}</p>
            </div>
            {n.status === 'draft' && (
              <SoftBtn onClick={() => sendMutation.mutate(n.id)} disabled={sendMutation.isPending}>
                {sendMutation.isPending ? '...' : 'Send'}
              </SoftBtn>
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

  const TYPE_TAG: Record<string, string> = { tip: 'now', article: 'soon', quote: 'maybe', coaching_message: 'go' };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={countLine}>{content?.length || 0} content blocks</p>
        <SoftBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus width={12} height={12} /> New Content</>}
        </SoftBtn>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 9 }}>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={adminInput}>
            <option value="tip">Tip</option>
            <option value="article">Article</option>
            <option value="quote">Quote</option>
            <option value="coaching_message">Coaching Message</option>
          </select>
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={adminInput} />
          <textarea placeholder="Body content" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} style={{ ...adminInput, resize: 'none' }} />
          <select value={form.target_tier} onChange={e => setForm(f => ({ ...f, target_tier: e.target.value }))} style={adminInput}>
            <option value="">All Tiers</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <SubmitBtn onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.body || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Content'}
          </SubmitBtn>
        </motion.div>
      )}

      {content?.map((item: any) => (
        <motion.div key={item.id} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>{item.title}</p>
                <span className={`ss-tag ${TYPE_TAG[item.type] || 'full'}`}>{item.type}</span>
              </div>
              <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.body}</p>
              {item.target_tier && <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', margin: '2px 0 0' }}>Tier: {item.target_tier}</p>}
            </div>
            <button
              onClick={() => togglePublishMutation.mutate({ id: item.id, published: !item.published })}
              className={`ss-tag ${item.published ? 'go' : 'full'}`}
              style={{ border: 'none', cursor: 'pointer', flex: 'none' }}
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

  if (!auditLog) return <LoadingRow />;

  const th: React.CSSProperties = { padding: '11px 14px', ...secLbl, textAlign: 'left' as const };
  const td: React.CSSProperties = { padding: '11px 14px', font: '400 12px var(--body)' };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.p variants={fadeUp} style={countLine}>{auditLog.length} entries</motion.p>

      <motion.div variants={fadeUp} className="tile" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hair)' }}>
                <th style={th}>Admin</th>
                <th style={th}>Action</th>
                <th style={th}>Target</th>
                <th style={th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry: any, i: number) => (
                <tr key={i} style={{ borderBottom: i < auditLog.length - 1 ? '1px solid var(--hair)' : 'none' }}>
                  <td className="num" style={{ ...td, font: '500 11.5px var(--mono)', color: 'var(--muted)' }}>{entry.admin_name || `#${entry.admin_id}`}</td>
                  <td style={{ ...td, color: 'var(--fg)' }}>{entry.action}</td>
                  <td style={{ ...td, color: 'var(--muted)' }}>{entry.target_type ? `${entry.target_type}${entry.target_id ? ` #${entry.target_id}` : ''}` : '-'}</td>
                  <td style={{ ...td, font: '400 10px var(--body)', color: 'var(--muted-2)' }}>
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
function EmailTab() {
  const [mode, setMode] = useState<'manual' | 'users'>('manual');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailCfg, setEmailCfg] = useState<any>(null);
  const [recipients, setRecipients] = useState<{ id: number; name: string; email: string }[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/engineering/email-config').then(r => setEmailCfg(r.data)).catch(() => {});
  }, []);
  useEffect(() => {
    if (mode === 'users' && recipients === null) {
      api.get('/admin/engineering/outreach/recipients')
        .then(r => setRecipients(r.data.recipients || []))
        .catch(() => setRecipients([]));
    }
  }, [mode, recipients]);

  const toggle = (email: string) => setSelected(prev => {
    const n = new Set(prev);
    if (n.has(email)) n.delete(email); else n.add(email);
    return n;
  });

  const q = search.trim().toLowerCase();
  const filtered = (recipients || []).filter(u =>
    !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));

  const targets = mode === 'users'
    ? Array.from(selected)
    : to.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  const overCap = targets.length > 25;
  const canSend = !sending && !!subject && !!message && targets.length > 0 && !overCap;

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const r = await api.post('/admin/engineering/email-send', { to: targets.join(','), subject, message });
      const d = r.data;
      const fails = (d.results || []).filter((x: any) => !x.ok);
      const failNote = fails.length ? ` Failed: ${fails.map((x: any) => `${x.to} (${x.error})`).join('; ')}` : '';
      setResult({ ok: d.sent > 0, text: `Sent ${d.sent}/${d.requested} via ${d.provider}.${failNote}` });
      if (d.sent === d.requested) { setMessage(''); setSelected(new Set()); }
    } catch (err: any) {
      setResult({ ok: false, text: err?.message || 'Send failed' });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {emailCfg && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: '11px 14px', flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ font: '400 11.5px var(--body)', color: 'var(--muted)' }}>Provider:</span>
          <span style={{ font: '600 11.5px var(--body)', color: 'var(--fg)' }}>{emailCfg.provider}</span>
          {emailCfg.provider === 'gmail' ? (
            <>
              <span style={{ font: '400 11.5px var(--body)', color: 'var(--muted-2)' }}>· Gmail:</span>
              <span className={`ss-tag ${emailCfg.gmail_user_set && emailCfg.gmail_app_password_set ? 'go' : 'maybe'}`}>
                {emailCfg.gmail_user_set && emailCfg.gmail_app_password_set ? 'Configured' : 'Missing creds'}
              </span>
            </>
          ) : (
            <>
              <span style={{ font: '400 11.5px var(--body)', color: 'var(--muted-2)' }}>· Resend key:</span>
              <span className={`ss-tag ${emailCfg.resend_api_key_set ? 'go' : 'maybe'}`}>{emailCfg.resend_api_key_set ? 'Set' : 'Missing'}</span>
              <span style={{ font: '400 11.5px var(--body)', color: 'var(--muted-2)' }}>· From: {emailCfg.email_from || '—'}</span>
            </>
          )}
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 10 }}>
        <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>Custom outreach</p>

        <SSSeg
          items={[{ key: 'manual', label: 'Type emails' }, { key: 'users', label: 'Pick users' }]}
          value={mode}
          onChange={setMode}
          ariaLabel="Recipient mode"
        />

        {mode === 'manual' ? (
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="Recipient email(s) — comma-separated" style={adminInput} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" style={adminInput} />
            <div style={{ maxHeight: 208, overflowY: 'auto', borderRadius: 12, border: '1px solid var(--hair)' }}>
              {recipients === null && <p style={{ font: '400 11.5px var(--body)', color: 'var(--muted-2)', padding: 13, margin: 0 }}>Loading users…</p>}
              {recipients && filtered.length === 0 && <p style={{ font: '400 11.5px var(--body)', color: 'var(--muted-2)', padding: 13, margin: 0 }}>No matching users.</p>}
              {filtered.map((u, i) => (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', cursor: 'pointer',
                  borderTop: i > 0 ? '1px solid var(--hair)' : 'none',
                }}>
                  <input type="checkbox" checked={selected.has(u.email)} onChange={() => toggle(u.email)} style={{ accentColor: 'var(--accent)' }} />
                  <span style={{ font: '500 11.5px var(--body)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || 'Runner'}</span>
                  <span style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{u.email}</span>
                </label>
              ))}
            </div>
            <p style={{ font: '400 10.5px var(--body)', color: 'var(--muted-2)', margin: 0 }}>{selected.size} selected</p>
          </div>
        )}

        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" style={adminInput} />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" rows={6} style={{ ...adminInput, resize: 'vertical' }} />

        {overCap && <p style={{ font: '500 11.5px var(--body)', color: 'var(--amber)', margin: 0 }}>Max 25 recipients per send — you have {targets.length}. Remove {targets.length - 25}.</p>}
        <SubmitBtn onClick={handleSend} disabled={!canSend}>
          {sending ? 'Sending…' : `Send${targets.length ? ` to ${targets.length}` : ''}`}
        </SubmitBtn>
        {result && <p style={{ font: '500 11.5px var(--body)', color: result.ok ? 'var(--green)' : 'var(--amber)', margin: 0 }}>{result.text}</p>}
        <p style={{ font: '400 10.5px var(--body)', color: 'var(--muted-2)', margin: 0 }}>Sent via {emailCfg?.provider || '…'} using the branded template, with an unsubscribe header.</p>
      </motion.div>
    </motion.div>
  );
}

function EngineeringTab() {
  const { data: sprints } = useQuery({
    queryKey: ['admin-engineering-sprints'],
    queryFn: () => api.get('/admin/engineering/sprints').then(r => r.data),
  });

  if (!sprints) return <LoadingRow />;

  const SPRINT_TAG: Record<string, string> = { completed: 'go', in_progress: 'now', planned: 'soon' };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.p variants={fadeUp} style={countLine}>{sprints.length} sprints</motion.p>

      {sprints.map((sprint: any) => (
        <motion.div key={sprint.id || sprint.sprint_date} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', margin: 0 }}>
              {sprint.sprint_date ? new Date(sprint.sprint_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sprint'}
            </p>
            <span className={`ss-tag ${SPRINT_TAG[sprint.status] || 'full'}`}>{sprint.status}</span>
          </div>
          {sprint.proposed && (
            <p style={{ font: '400 11px/1.5 var(--body)', color: 'var(--muted)', margin: 0 }}>
              <span style={{ color: 'var(--muted-2)' }}>Proposed:</span> {sprint.proposed}
            </p>
          )}
          {sprint.built && (
            <p style={{ font: '400 11px/1.5 var(--body)', color: 'var(--muted)', margin: '2px 0 0' }}>
              <span style={{ color: 'var(--muted-2)' }}>Built:</span> {sprint.built}
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

  if (!queue) return <LoadingRow />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.p variants={fadeUp} style={countLine}>{queue.length} items in queue</motion.p>

      {queue.length === 0 && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: '28px 16px', alignItems: 'center' }}>
          <p style={{ font: '500 12.5px var(--body)', color: 'var(--muted)', margin: 0 }}>Queue is empty — nothing to moderate.</p>
        </motion.div>
      )}

      {queue.map((item: any) => (
        <motion.div key={`${item.content_type}-${item.id}`} variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`ss-tag ${item.content_type === 'comment' ? 'soon' : 'maybe'}`}>
                  {item.content_type === 'comment' ? 'comment' : 'post'}
                </span>
                <p style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', margin: 0 }}>{item.author_name || `User #${item.user_id}`}</p>
              </div>
              <p style={{
                font: '400 13px/1.55 var(--body)', color: 'var(--fg)', margin: '6px 0 0',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{item.content || item.body}</p>
              <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', margin: '4px 0 0' }}>
                {item.created_at ? new Date(item.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
            <button
              onClick={() => item.content_type === 'comment' ? hideCommentMutation.mutate(item.id) : hidePostMutation.mutate(item.id)}
              className="ss-btn ss-btn-ghost"
              style={{ height: 32, width: 'auto', padding: '0 13px', fontSize: 11.5, marginLeft: 11, flex: 'none', color: 'var(--amber)' }}
            >
              Hide
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ===== BACKUP TAB ===== */
function BackupTab() {
  const [downloading, setDownloading] = useState(false);
  const [lastResult, setLastResult] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['admin-backup-stats'],
    queryFn: () => api.get('/admin/backup/stats').then(r => r.data),
  });

  const { data: history } = useQuery({
    queryKey: ['admin-backup-history'],
    queryFn: () => api.get('/admin/backup/history').then(r => r.data),
  });

  const handleDownload = async () => {
    setDownloading(true);
    setLastResult('');
    try {
      const res = await api.get('/admin/backup/now', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprint-society-backup-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setLastResult('Backup downloaded successfully!');
    } catch (err: any) {
      setLastResult('Download failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setDownloading(false);
    }
  };

  // pg COUNT() comes back as strings — coerce or the reduce concatenates ("02020…")
  const totalRows = stats ? Object.values(stats.tables as Record<string, number>).reduce((a: number, b) => a + (Number(b) > 0 ? Number(b) : 0), 0) : 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <motion.div variants={fadeUp} className="tile" style={{ padding: 16, gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ font: '600 14px var(--head)', color: 'var(--fg)', margin: 0 }}>Database Backup</h3>
            <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '4px 0 0' }}>Download all tables as CSV. Auto-backup runs daily.</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="ss-btn ss-btn-primary"
            style={{ height: 40, padding: '0 16px', fontSize: 12, flex: 'none' }}
          >
            {downloading ? 'Exporting...' : 'Download Backup'}
          </button>
        </div>
        {lastResult && (
          <p style={{ font: '500 11px var(--body)', color: lastResult.includes('failed') ? 'var(--amber)' : 'var(--green)', margin: 0 }}>{lastResult}</p>
        )}
      </motion.div>

      {stats && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <p style={{ ...secLbl, marginBottom: 10 }}>Database Stats</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { v: Object.keys(stats.tables).length, l: 'Tables' },
              { v: totalRows.toLocaleString(), l: 'Total Rows' },
            ].map(x => (
              <div key={x.l} style={{ padding: '10px 11px', borderRadius: 11, background: 'rgba(255,255,255,.03)', border: '1px solid var(--hair)' }}>
                <p className="num" style={{ font: '700 17px var(--mono)', color: 'var(--accent-2)', margin: 0 }}>{x.v}</p>
                <p style={{ ...secLbl, marginTop: 3 }}>{x.l}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflowY: 'auto' }}>
            {Object.entries(stats.tables as Record<string, number>)
              .filter(([, count]) => (count as number) > 0)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([table, count]) => (
                <div key={table} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderRadius: 7 }}>
                  <span className="num" style={{ font: '500 11px var(--mono)', color: 'var(--muted)' }}>{table}</span>
                  <span style={{ font: '400 11px var(--body)', color: 'var(--muted-2)' }}>{(count as number).toLocaleString()} rows</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {history && history.length > 0 && (
        <motion.div variants={fadeUp} className="tile" style={{ padding: 14 }}>
          <p style={{ ...secLbl, marginBottom: 10 }}>Backup History (auto-daily)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.map((b: any) => (
              <div key={b.folder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 9px', borderRadius: 9, background: 'rgba(255,255,255,.03)', border: '1px solid var(--hair)' }}>
                <span style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>{b.created_at ? new Date(b.created_at).toLocaleString() : b.folder}</span>
                <span style={{ font: '400 10px var(--body)', color: 'var(--muted-2)' }}>{b.tables_exported} tables · {b.total_rows?.toLocaleString()} rows</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
