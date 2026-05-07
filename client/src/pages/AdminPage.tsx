import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { formatDistance, formatPace, formatDate } from '../lib/formatters';
import { Button } from '../components/ui/Button';

type Tab = 'overview' | 'runners' | 'sessions' | 'announcements';

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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'runners', label: 'Runners', icon: '🏃' },
    { key: 'sessions', label: 'Sessions', icon: '📅' },
    { key: 'announcements', label: 'Posts', icon: '📢' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-accent-green text-xl">⚡</span>
            <h1 className="font-heading font-bold text-lg">
              Sprint <span className="text-accent-green">Society</span>
              <span className="text-xs text-white/30 ml-2">ADMIN</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${tab === t.key ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 'bg-bg-secondary text-white/50 border border-transparent'}`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'overview' && <OverviewTab stats={stats} runners={runners} />}
        {tab === 'runners' && <RunnersTab runners={runners} />}
        {tab === 'sessions' && <SessionsTab sessions={sessions} queryClient={queryClient} />}
        {tab === 'announcements' && <AnnouncementsTab announcements={announcements} queryClient={queryClient} />}
      </main>

      <footer className="text-center py-6 text-white/15 text-xs">
        Kendu Entertainment
      </footer>
    </div>
  );
}

function OverviewTab({ stats, runners }: { stats: any; runners: any[] }) {
  if (!stats) return <div className="text-white/30">Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Runners', value: stats.total_runners, icon: '🏃' },
          { label: 'Total Runs', value: stats.total_runs, icon: '📍' },
          { label: 'Total km', value: `${stats.total_distance_km}`, icon: '🗺️' },
          { label: 'This Week', value: stats.runs_this_week, icon: '📈' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 text-center">
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="font-mono text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {stats.tier_breakdown && stats.tier_breakdown.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">Tier Breakdown</h3>
          <div className="flex gap-4">
            {stats.tier_breakdown.map((t: any) => (
              <div key={t.tier} className="flex-1 text-center">
                <p className="font-mono text-xl font-bold">{t.count}</p>
                <p className={`text-xs capitalize ${t.tier === 'advanced' ? 'text-tier-advanced' : t.tier === 'intermediate' ? 'text-tier-intermediate' : 'text-tier-beginner'}`}>
                  {t.tier}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {runners && runners.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">Top Runners</h3>
          <div className="space-y-2">
            {runners.slice(0, 5).map((r: any, i: number) => (
              <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary/30">
                <span className="text-sm text-white/30 w-5">{i + 1}</span>
                <span className="flex-1 text-sm font-medium">{r.name}</span>
                <span className="font-mono text-xs text-white/50">{r.total_xp || 0} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RunnersTab({ runners }: { runners: any[] }) {
  if (!runners) return <div className="text-white/30">Loading...</div>;

  return (
    <div className="space-y-3">
      <p className="text-white/40 text-sm">{runners.length} registered runners</p>
      {runners.map((runner: any) => (
        <div key={runner.id} className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">{runner.name}</p>
              <p className="text-xs text-white/40">{runner.email}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
              runner.current_tier === 'advanced' ? 'bg-tier-advanced/10 text-tier-advanced' :
              runner.current_tier === 'intermediate' ? 'bg-tier-intermediate/10 text-tier-intermediate' :
              'bg-tier-beginner/10 text-tier-beginner'
            }`}>
              {runner.current_tier || 'new'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="font-mono text-sm font-bold">{runner.total_runs}</p>
              <p className="text-[9px] text-white/30">runs</p>
            </div>
            <div>
              <p className="font-mono text-sm font-bold">{(runner.total_distance / 1000).toFixed(1)}</p>
              <p className="text-[9px] text-white/30">km</p>
            </div>
            <div>
              <p className="font-mono text-sm font-bold">{runner.avg_pace > 0 ? formatPace(runner.avg_pace) : '--'}</p>
              <p className="text-[9px] text-white/30">pace</p>
            </div>
            <div>
              <p className="font-mono text-sm font-bold">{runner.current_level || 1}</p>
              <p className="text-[9px] text-white/30">level</p>
            </div>
          </div>
        </div>
      ))}
    </div>
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-white/40 text-sm">{sessions?.length || 0} sessions</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Session'}
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-5 space-y-3">
          <input type="text" placeholder="Session title (e.g. Sunday 5K)" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-white/10 text-white placeholder:text-white/30 focus:border-accent-green/50 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Distance (meters)" value={distance} onChange={e => setDistance(e.target.value)}
              className="px-4 py-3 rounded-xl bg-bg-tertiary border border-white/10 text-white placeholder:text-white/30 focus:border-accent-green/50 focus:outline-none" />
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
              className="px-4 py-3 rounded-xl bg-bg-tertiary border border-white/10 text-white placeholder:text-white/30 focus:border-accent-green/50 focus:outline-none" />
          </div>
          <input type="text" placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-white/10 text-white placeholder:text-white/30 focus:border-accent-green/50 focus:outline-none" />
          <Button fullWidth onClick={() => createMutation.mutate({ title, target_distance_meters: Number(distance), session_date: date, location })}
            disabled={!title || !date || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Session'}
          </Button>
        </motion.div>
      )}

      {sessions?.map((s: any) => (
        <div key={s.id} className="glass-card p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-white/40">{formatDate(s.session_date)} • {formatDistance(s.target_distance_meters)}</p>
              {s.location && <p className="text-xs text-white/30 mt-1">{s.location}</p>}
            </div>
            <span className="text-xs bg-bg-tertiary px-2 py-1 rounded-full">{s.attendee_count || 0} attended</span>
          </div>
        </div>
      ))}
    </div>
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-white/40 text-sm">{announcements?.length || 0} announcements</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Post'}
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-5 space-y-3">
          <input type="text" placeholder="Announcement title" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-white/10 text-white placeholder:text-white/30 focus:border-accent-green/50 focus:outline-none" />
          <textarea placeholder="Write your announcement..." value={body} onChange={e => setBody(e.target.value)} rows={4}
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-white/10 text-white placeholder:text-white/30 focus:border-accent-green/50 focus:outline-none resize-none" />
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded" />
            Pin to top
          </label>
          <Button fullWidth onClick={() => createMutation.mutate({ title, body, pinned })}
            disabled={!title || !body || createMutation.isPending}>
            {createMutation.isPending ? 'Posting...' : 'Post Announcement'}
          </Button>
        </motion.div>
      )}

      {announcements?.map((a: any) => (
        <div key={a.id} className="glass-card p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {a.pinned ? <span className="text-xs">📌</span> : null}
                <p className="font-medium">{a.title}</p>
              </div>
              <p className="text-sm text-white/60 mt-1">{a.body}</p>
              <p className="text-xs text-white/30 mt-2">{formatDate(a.created_at)}</p>
            </div>
            <button onClick={() => deleteMutation.mutate(a.id)} className="text-white/20 hover:text-red-400 text-xs ml-3">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
