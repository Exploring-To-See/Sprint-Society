import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { formatPace, formatDistance } from '../../lib/formatters';
import { ProgressBar } from '../ui/ProgressBar';
import { PaceChart } from './PaceChart';
import { ChallengeList } from './ChallengeList';

export function Dashboard() {
  const { data: xp } = useQuery({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['weekly-summary'],
    queryFn: () => api.get('/runs/weekly-summary').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['run-stats'],
    queryFn: () => api.get('/runs/stats').then(r => r.data),
  });

  const tierColors: Record<string, string> = {
    beginner: 'text-tier-beginner',
    intermediate: 'text-tier-intermediate',
    advanced: 'text-tier-advanced',
  };

  return (
    <div className="space-y-5">
      {/* Level & XP Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center">
              <span className="text-2xl font-mono font-bold text-accent-green">
                {xp?.current_level || 1}
              </span>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Level</p>
              <p className={`font-heading font-bold text-lg capitalize ${tierColors[tier?.tier || 'beginner']}`}>
                {tier?.tier || 'beginner'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">Streak</p>
            <p className="font-mono font-bold text-lg">
              {xp?.current_streak_days || 0} <span className="text-sm">🔥</span>
            </p>
          </div>
        </div>
        <ProgressBar
          value={xp?.level_progress_percent || 0}
          color="green"
          height="sm"
          showLabel
          label={`${xp?.total_xp || 0} XP — ${xp?.xp_to_next_level || 100} to next level`}
        />
      </motion.div>

      {/* Weekly Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">This Week</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-mono text-xl font-bold">{summary.total_distance_km}</p>
              <p className="text-xs text-white/40">km</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-xl font-bold">{summary.total_runs}</p>
              <p className="text-xs text-white/40">runs</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-xl font-bold">{formatPace(summary.average_pace_per_km)}</p>
              <p className="text-xs text-white/40">avg pace</p>
            </div>
          </div>
          {summary.improvement_percent !== 0 && (
            <p className={`text-center text-xs mt-3 ${summary.improvement_percent > 0 ? 'text-accent-green' : 'text-accent-pink'}`}>
              {summary.improvement_percent > 0 ? '↑' : '↓'} {Math.abs(summary.improvement_percent)}% vs last week
            </p>
          )}
        </motion.div>
      )}

      {/* Pace Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">Pace Trend</h3>
        <PaceChart />
      </motion.div>

      {/* Challenges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ChallengeList />
      </motion.div>

      {/* All-time Stats */}
      {stats && stats.total_runs > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">All Time</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-lg font-bold">{formatDistance(stats.total_distance)}</p>
              <p className="text-xs text-white/40">total distance</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold">{stats.total_runs}</p>
              <p className="text-xs text-white/40">total runs</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold">{formatPace(stats.best_pace)}</p>
              <p className="text-xs text-white/40">best pace</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold">{formatDistance(stats.longest_run)}</p>
              <p className="text-xs text-white/40">longest run</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="text-center py-4">
        <p className="text-white/20 text-xs">A product by Kendu Entertainment</p>
      </div>
    </div>
  );
}
