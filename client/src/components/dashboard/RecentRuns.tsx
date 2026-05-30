import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

function formatPace(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function RecentRuns() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['recent-runs'],
    queryFn: () => api.get('/runs?limit=3').then(r => r.data),
  });

  if (isLoading) {
    return (
      <motion.div variants={fadeUp} className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[56px] rounded-xl bg-bg-secondary border border-bg-tertiary animate-pulse" />
        ))}
      </motion.div>
    );
  }

  const runs = Array.isArray(data) ? data : data?.runs || [];

  if (runs.length === 0) {
    return (
      <motion.div variants={fadeUp} className="card p-5 text-center">
        <p className="text-[13px] text-zinc-500">No runs yet</p>
        <button
          onClick={() => navigate('/run/track')}
          className="mt-2 text-[12px] font-semibold text-accent"
        >
          Start your first run →
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-heading font-semibold text-[14px]">Recent Runs</h3>
        <button onClick={() => navigate('/runs')} className="text-[11px] text-accent font-semibold">
          See all
        </button>
      </div>
      {runs.slice(0, 3).map((run: any) => {
        const km = (run.distance_meters / 1000).toFixed(1);
        const pace = run.moving_time_seconds && run.distance_meters
          ? run.moving_time_seconds / (run.distance_meters / 1000)
          : 0;
        return (
          <button
            key={run.id}
            onClick={() => navigate(`/runs`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-bg-tertiary hover:border-accent/20 transition-colors active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-lg bg-accent/8 flex items-center justify-center text-[14px]">
              🏃
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-medium text-zinc-200 truncate">
                {km} km · {formatPace(pace)}/km
              </p>
              <p className="text-[11px] text-zinc-600">{formatDate(run.start_date)}</p>
            </div>
            <div className="text-[11px] text-zinc-600 font-mono">
              {Math.floor(run.moving_time_seconds / 60)}m
            </div>
          </button>
        );
      })}
    </motion.div>
  );
}
