import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const ZONE_COLORS = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', bar: 'bg-blue-500' },
  { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', bar: 'bg-green-500' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', bar: 'bg-amber-500' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', bar: 'bg-orange-500' },
  { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', bar: 'bg-red-500' },
];

export function HRZonesPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['hr-zones'],
    queryFn: () => api.get('/heartrate/zones').then(r => r.data),
  });

  const { data: trends } = useQuery({
    queryKey: ['hr-trends'],
    queryFn: () => api.get('/heartrate/trends').then(r => r.data).catch(() => null),
  });

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 pb-6">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Training Intelligence</p>
          <h1 className="font-heading text-[22px] font-bold">Heart Rate Zones</h1>
          <p className="text-[12px] text-zinc-500 mt-1">Personalized from your running data</p>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-[72px] rounded-xl bg-bg-secondary border border-bg-tertiary animate-pulse" />
            ))}
          </div>
        )}

        {/* Source indicator */}
        {profile && (
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${profile.source === 'activity_based' ? 'bg-accent-green' : 'bg-amber-400'}`} />
            <p className="text-[11px] text-zinc-500">{profile.tip}</p>
          </motion.div>
        )}

        {/* Key metrics */}
        {profile && (
          <motion.div variants={fadeUp} className="flex gap-2">
            <div className="flex-1 card p-3.5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-1">Max HR</p>
              <p className="font-mono text-lg font-bold text-white">{profile.max_hr}</p>
              <p className="text-[11px] text-zinc-700">bpm</p>
            </div>
            <div className="flex-1 card p-3.5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-1">HR Reserve</p>
              <p className="font-mono text-lg font-bold text-white">{profile.hr_reserve}</p>
              <p className="text-[11px] text-zinc-700">bpm</p>
            </div>
            <div className="flex-1 card p-3.5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-1">LT HR</p>
              <p className="font-mono text-lg font-bold text-accent">{profile.lactate_threshold_hr}</p>
              <p className="text-[11px] text-zinc-700">bpm</p>
            </div>
          </motion.div>
        )}

        {/* Zone cards */}
        {profile?.zones && (
          <motion.div variants={fadeUp} className="space-y-2">
            {profile.zones.map((zone: any, i: number) => {
              const color = ZONE_COLORS[i];
              const widthPercent = ((zone.max_bpm - zone.min_bpm) / profile.hr_reserve) * 100;

              return (
                <motion.div
                  key={zone.zone}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 200, damping: 25 }}
                  className={`rounded-xl border ${color.border} ${color.bg} p-4`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${color.text}`}>Z{zone.zone}</span>
                      <span className="text-[13px] font-semibold text-white">{zone.name}</span>
                    </div>
                    <span className="font-mono text-[12px] font-medium text-zinc-400">
                      {zone.min_bpm}–{zone.max_bpm} <span className="text-zinc-600">bpm</span>
                    </span>
                  </div>

                  {/* Visual bar */}
                  <div className="h-[3px] rounded-full bg-bg-tertiary/50 mb-2.5 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${color.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(widthPercent * 2, 100)}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed">{zone.feel}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{zone.training_effect}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Efficiency trend */}
        {trends?.summary && (
          <motion.div variants={fadeUp} className="card p-4">
            <p className="label mb-2">Cardiac Efficiency</p>
            <p className="text-[13px] font-semibold text-white">{trends.summary.message}</p>
            {trends.summary.improvement_percent !== 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className={`font-mono text-[14px] font-bold ${
                  trends.summary.improvement_percent > 0 ? 'text-accent-green' : 'text-red-400'
                }`}>
                  {trends.summary.improvement_percent > 0 ? '+' : ''}{trends.summary.improvement_percent}%
                </span>
                <span className="text-[10px] text-zinc-600">over {trends.trends.length} runs</span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
