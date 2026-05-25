import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

function formatPace(seconds: number) {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function RunHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => api.get('/runs?limit=30').then(r => r.data),
  });

  const runs = data?.runs || [];
  const totalDistance = runs.reduce((s: number, r: any) => s + (r.distance_meters || 0), 0);
  const totalRuns = runs.length;
  const bestPace = runs.length > 0 ? Math.min(...runs.map((r: any) => r.average_pace_per_km || 999)) : 0;

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Activity</p>
          <h1 className="font-heading text-xl font-bold mt-0.5">Run History</h1>
        </motion.div>

        {/* Summary stats */}
        {totalRuns > 0 && (
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="font-mono font-bold text-lg text-white">{totalRuns}</p>
              <p className="text-[10px] text-zinc-500">runs</p>
            </div>
            <div className="card p-3 text-center">
              <p className="font-mono font-bold text-lg text-white">{(totalDistance / 1000).toFixed(1)}</p>
              <p className="text-[10px] text-zinc-500">km total</p>
            </div>
            <div className="card p-3 text-center">
              <p className="font-mono font-bold text-lg text-accent">{formatPace(bestPace)}</p>
              <p className="text-[10px] text-zinc-500">best pace</p>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-16 text-zinc-600 text-sm">Loading runs...</div>
        )}

        {/* Empty state */}
        {!isLoading && runs.length === 0 && (
          <motion.div variants={fadeUp} className="text-center py-16">
            <p className="text-3xl mb-3">🏃</p>
            <p className="text-zinc-500 text-sm">No runs yet</p>
            <p className="text-zinc-600 text-xs mt-1">Use the GPS tracker to log your first run</p>
          </motion.div>
        )}

        {/* Run list */}
        {runs.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-2">
            {runs.map((run: any) => (
              <div key={run.id} className="card p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] text-zinc-500">{formatDate(run.start_date)}</p>
                  {run.elevation_gain > 0 && (
                    <span className="text-[10px] text-zinc-600">↑{Math.round(run.elevation_gain)}m</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="font-mono text-[17px] font-bold">{(run.distance_meters / 1000).toFixed(1)}</p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-0.5">km</p>
                  </div>
                  <div>
                    <p className="font-mono text-[17px] font-bold">{formatPace(run.average_pace_per_km)}</p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-0.5">pace</p>
                  </div>
                  <div>
                    <p className="font-mono text-[17px] font-bold">{Math.floor(run.moving_time_seconds / 60)}</p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-0.5">min</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
