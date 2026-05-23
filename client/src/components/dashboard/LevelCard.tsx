import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const TIER_STYLES: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  Beginner: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', gradient: 'from-emerald-500/20 to-green-600/5' },
  Intermediate: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-500/20 to-cyan-600/5' },
  Advanced: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', gradient: 'from-amber-500/20 to-orange-600/5' },
  Pro: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', gradient: 'from-purple-500/20 to-pink-600/5' },
};

export function LevelCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['classification'],
    queryFn: () => api.get('/profiling/classification').then(r => r.data).catch(() => null),
  });

  if (isLoading) {
    return <div className="h-[100px] rounded-xl bg-bg-tertiary/50 animate-pulse" />;
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4 text-center">
        <p className="text-[12px] text-zinc-500">Complete AI profiling to see your level</p>
      </div>
    );
  }

  const style = TIER_STYLES[data.tierName] || TIER_STYLES.Beginner;
  const progressPercent = (data.subLevel / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-gradient-to-r ${style.gradient} border ${style.border} p-4 space-y-3`}
    >
      {/* Tier + Level */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${style.text}`}>
            {data.tierName}
          </span>
          <span className="text-[10px] text-zinc-500">Level {data.subLevel}</span>
        </div>
        {data.safetyRails && !data.safetyRails.canAdvance && (
          <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            On Hold
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-[6px] rounded-full bg-bg-tertiary overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${
              data.tier === 'B' ? 'from-emerald-500 to-emerald-400' :
              data.tier === 'I' ? 'from-blue-500 to-cyan-400' :
              data.tier === 'A' ? 'from-amber-500 to-orange-400' :
              'from-purple-500 to-pink-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.2 }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-600">{data.subLevel}/10</span>
          <span className="text-[9px] text-zinc-600">
            {data.stats?.avgWeeklyKm > 0 ? `${data.stats.avgWeeklyKm} km/week` : ''}
          </span>
        </div>
      </div>

      {/* Next Milestone */}
      {data.nextMilestone && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">Next:</span>
          <span className="text-[10px] text-zinc-300 font-medium">
            {data.stats?.bestFiveK
              ? `5K under ${Math.floor(data.stats.bestFiveK / 60) - 1}:00`
              : 'Run your first 5K'
            }
            {data.nextMilestone.weeklyKmNeeded > 0 && ` + ${data.nextMilestone.weeklyKmNeeded}km/week`}
          </span>
        </div>
      )}
    </motion.div>
  );
}
