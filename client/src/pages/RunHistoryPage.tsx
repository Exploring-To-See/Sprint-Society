import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { formatPace, formatDistance, formatDuration, formatRelativeDate } from '../lib/formatters';
import { AppShell } from '../components/layout/AppShell';

export function RunHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => api.get('/runs?limit=30').then(r => r.data),
  });

  return (
    <AppShell>
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold">Run History</h2>

        {isLoading && (
          <div className="text-center py-10 text-white/30">Loading runs...</div>
        )}

        {data && data.runs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🏃</p>
            <p className="text-white/50 text-sm">No runs yet. Connect Strava to sync your activities!</p>
          </div>
        )}

        <div className="space-y-3">
          {data?.runs.map((run: any, i: number) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-white/40">{formatRelativeDate(run.start_date)}</p>
                {run.elevation_gain > 0 && (
                  <span className="text-xs text-white/30">↑ {Math.round(run.elevation_gain)}m</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="font-mono text-lg font-bold">{formatDistance(run.distance_meters)}</p>
                  <p className="text-[10px] text-white/40 uppercase">Distance</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-bold">{formatDuration(run.moving_time_seconds)}</p>
                  <p className="text-[10px] text-white/40 uppercase">Time</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-bold">{formatPace(run.average_pace_per_km)}</p>
                  <p className="text-[10px] text-white/40 uppercase">Pace</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
