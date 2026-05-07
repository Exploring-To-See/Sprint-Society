import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { formatPace } from '../../lib/formatters';
import { ProgressBar } from '../ui/ProgressBar';

export function CoachingPanel() {
  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data),
  });

  const { data: pace } = useQuery({
    queryKey: ['ideal-pace'],
    queryFn: () => api.get('/coaching/ideal-pace').then(r => r.data),
  });

  const { data: transformation } = useQuery({
    queryKey: ['transformation'],
    queryFn: () => api.get('/coaching/transformation').then(r => r.data),
  });

  const tierConfig: Record<string, { color: string; glow: string; badge: string }> = {
    beginner: { color: 'text-tier-beginner', glow: 'glow-green', badge: '🌱' },
    intermediate: { color: 'text-tier-intermediate', glow: 'glow-blue', badge: '⚡' },
    advanced: { color: 'text-tier-advanced', glow: 'glow-gold', badge: '👑' },
  };

  const currentTier = tierConfig[tier?.tier || 'beginner'];

  return (
    <div className="space-y-5">
      {/* Tier Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass-card p-6 text-center ${currentTier.glow}`}
      >
        <span className="text-5xl block mb-2">{currentTier.badge}</span>
        <h2 className={`font-heading text-2xl font-bold capitalize ${currentTier.color}`}>
          {tier?.tier || 'Beginner'}
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Score: {tier?.score?.toFixed(0) || 0}/100
        </p>
        {tier?.breakdown && (
          <div className="grid grid-cols-2 gap-3 mt-4 text-left">
            <div className="bg-bg-tertiary/50 rounded-lg p-2">
              <p className="text-[10px] text-white/40 uppercase">Age Graded</p>
              <p className="font-mono text-sm">{tier.breakdown.age_graded_score}%</p>
            </div>
            <div className="bg-bg-tertiary/50 rounded-lg p-2">
              <p className="text-[10px] text-white/40 uppercase">VO2max</p>
              <p className="font-mono text-sm">{tier.estimated_vo2max}</p>
            </div>
            <div className="bg-bg-tertiary/50 rounded-lg p-2">
              <p className="text-[10px] text-white/40 uppercase">Distance</p>
              <p className="font-mono text-sm">{tier.breakdown.distance_score}%</p>
            </div>
            <div className="bg-bg-tertiary/50 rounded-lg p-2">
              <p className="text-[10px] text-white/40 uppercase">Consistency</p>
              <p className="font-mono text-sm">{tier.breakdown.consistency_score}%</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Ideal Pace Zones */}
      {pace && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-1">
            Your Pace Zones
          </h3>
          <p className="text-xs text-white/30 mb-4">{pace.pace_rating}</p>

          <div className="space-y-3">
            {[
              { label: 'Easy', value: pace.ideal_zones.easy_pace_per_km, color: 'bg-green-500/20 border-green-500/30' },
              { label: 'Tempo', value: pace.ideal_zones.tempo_pace_per_km, color: 'bg-blue-500/20 border-blue-500/30' },
              { label: 'Interval', value: pace.ideal_zones.interval_pace_per_km, color: 'bg-orange-500/20 border-orange-500/30' },
              { label: 'Race', value: pace.ideal_zones.race_pace_per_km, color: 'bg-red-500/20 border-red-500/30' },
            ].map(zone => (
              <div key={zone.label} className={`flex items-center justify-between p-3 rounded-xl border ${zone.color}`}>
                <span className="text-sm text-white/70">{zone.label}</span>
                <span className="font-mono font-bold">{formatPace(zone.value)}/km</span>
              </div>
            ))}
          </div>

          {pace.current_avg_pace > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-bg-tertiary/50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/50">Current avg</span>
                <span className="font-mono text-sm">{formatPace(pace.current_avg_pace)}/km</span>
              </div>
              {pace.improvement_needed_seconds > 0 && (
                <p className="text-xs text-accent-blue mt-1">
                  {pace.improvement_needed_seconds}s/km to reach tempo target
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Transformation Journey */}
      {transformation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-1">
            Transformation Journey
          </h3>
          <p className="text-xs text-white/30 mb-4">
            {formatPace(transformation.current_pace_per_km)} → {formatPace(transformation.target_pace_per_km)}/km
            in ~{transformation.estimated_weeks} weeks
          </p>

          <div className="space-y-2">
            {transformation.milestones.slice(0, 6).map((milestone: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] text-white/50 shrink-0">
                  {milestone.week}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/70">{milestone.focus_area}</p>
                </div>
                <span className="font-mono text-xs text-white/40">{formatPace(milestone.target_pace)}</span>
              </div>
            ))}
            {transformation.milestones.length > 6 && (
              <p className="text-xs text-white/30 text-center pt-1">
                +{transformation.milestones.length - 6} more weeks...
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
