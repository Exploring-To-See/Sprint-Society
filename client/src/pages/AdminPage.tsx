import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Button } from '../components/ui/Button';

type Tab = 'overview' | 'runners' | 'sessions' | 'announcements';

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
    { key: 'sessions', label: 'Sessions' },
    { key: 'announcements', label: 'Posts' },
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
        <div className="flex gap-1 border-b border-bg-tertiary">
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
        {tab === 'sessions' && <SessionsTab sessions={sessions} queryClient={queryClient} />}
        {tab === 'announcements' && <AnnouncementsTab announcements={announcements} queryClient={queryClient} />}
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
