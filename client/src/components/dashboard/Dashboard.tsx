import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PaceChart } from './PaceChart';
import { ChallengeList } from './ChallengeList';
import { ReadinessCard } from './ReadinessCard';
import { TodaySession } from './TodaySession';
import { TrainingLoadRing } from './TrainingLoadRing';
import { PRBanner } from './PRBanner';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-bg-tertiary/50 ${className}`} />
  );
}

function StatCard({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div className="flex-1 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono font-bold text-[22px] tabular-nums tracking-tight ${accent ? 'text-accent' : 'text-white'}`}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-zinc-600 font-medium">{unit}</span>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();

  const { data: xp, isLoading: xpLoading } = useQuery({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get('/coaching/challenges').then(r => r.data),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['run-stats'],
    queryFn: () => api.get('/runs/stats').then(r => r.data),
  });

  const { data: adaptive } = useQuery({
    queryKey: ['adaptive-summary'],
    queryFn: () => api.get('/adaptive/summary').then(r => r.data).catch(() => null),
  });

  const { data: records } = useQuery({
    queryKey: ['records'],
    queryFn: () => api.get('/records').then(r => r.data).catch(() => null),
  });

  const level = xp?.current_level || 1;
  const totalXp = xp?.total_xp || 0;
  const streak = xp?.current_streak_days || 0;
  const progressPercent = xp?.level_progress_percent || 0;
  const xpToNext = xp?.xp_to_next_level || 100;
  const tierName = tier?.tier || 'beginner';
  const completedChallenges = challenges?.filter((c: any) => c.completed)?.length || 0;
  const totalChallenges = challenges?.length || 0;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 6 ? 'Late night' : greetingHour < 12 ? 'Morning' : greetingHour < 17 ? 'Afternoon' : 'Evening';

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-5 pb-6"
    >
      {/* Header — asymmetric, editorial feel */}
      <motion.div variants={fadeUp} className="pt-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <h1 className="font-heading text-[22px] font-bold leading-tight">
              {greeting}, {user?.name?.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/8 border border-accent/15">
                <span className="text-[11px]">🔥</span>
                <span className="text-[11px] font-bold text-accent tabular-nums">{streak}</span>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-bg-secondary border border-bg-tertiary overflow-hidden flex items-center justify-center">
              {(user as any)?.profile_image_url ? (
                <img src={(user as any).profile_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-zinc-500">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tier + Level — inline, not a big card */}
        <div className="flex items-center gap-3 mt-3">
          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md ${
            tierName === 'advanced' ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' :
            tierName === 'intermediate' ? 'bg-accent/10 text-accent border border-accent/20' :
            'bg-accent-green/10 text-accent-green border border-accent-green/20'
          }`}>
            {tierName}
          </span>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-[3px] rounded-full bg-bg-tertiary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-600 tabular-nums">L{level}</span>
          </div>
        </div>
      </motion.div>

      {/* Readiness — the daily hook */}
      <ReadinessCard />

      {/* Today's Session */}
      <TodaySession />

      {/* Training Load + VDOT (new adaptive engine data) */}
      {adaptive?.status === 'active' && (
        <motion.div variants={fadeUp}>
          <TrainingLoadRing
            acuteLoad={adaptive.training_load.acute}
            chronicLoad={adaptive.training_load.chronic}
            balance={adaptive.training_load.balance}
            injuryRisk={adaptive.training_load.injury_risk}
            vdot={adaptive.fitness?.current_vdot}
            vdotTrend={adaptive.fitness?.trend}
          />
        </motion.div>
      )}

      {/* Quick Stats — horizontal scroll, not grid */}
      <motion.div variants={fadeUp}>
        {statsLoading ? (
          <div className="flex gap-1">
            <Skeleton className="h-[72px] flex-1" />
            <Skeleton className="h-[72px] flex-1" />
            <Skeleton className="h-[72px] flex-1" />
          </div>
        ) : (
          <div className="flex rounded-xl bg-bg-secondary border border-bg-tertiary divide-x divide-bg-tertiary overflow-hidden">
            <StatCard label="Runs" value={stats?.total_runs || 0} />
            <StatCard label="Distance" value={stats?.total_distance ? Math.round(stats.total_distance / 1000) : 0} unit="km" />
            <StatCard label="Best pace" value={stats?.best_pace ? formatPace(stats.best_pace) : '--'} unit="/km" accent />
          </div>
        )}
      </motion.div>

      {/* Latest PR Banner */}
      {records?.latest_pr && (
        <motion.div variants={fadeUp}>
          <PRBanner pr={records.latest_pr} totalPRs={records.total_count} />
        </motion.div>
      )}

      {/* Pace Trend Chart */}
      <motion.div variants={fadeUp}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-heading font-semibold text-[14px]">Pace trend</h3>
          <span className="text-[10px] text-zinc-600 font-mono">12 weeks</span>
        </div>
        <div className="card p-4">
          <PaceChart />
        </div>
      </motion.div>

      {/* Challenges */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-[14px]">This week</h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-[3px]">
              {Array.from({ length: totalChallenges }).map((_, i) => (
                <div
                  key={i}
                  className={`w-[6px] h-[6px] rounded-full ${
                    i < completedChallenges ? 'bg-accent-green' : 'bg-bg-tertiary'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
              {completedChallenges}/{totalChallenges}
            </span>
          </div>
        </div>
        <ChallengeList />
      </motion.div>
    </motion.div>
  );
}

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
