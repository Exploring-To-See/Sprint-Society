import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCountUp } from '../../hooks/useCountUp';
import { playSound } from '../../lib/sounds';
import { ChallengeList } from './ChallengeList';
import { TodaySession } from './TodaySession';
import { RecentRuns } from './RecentRuns';
import { PaceDotTrail } from './PaceDotTrail';
import { AthleteCard } from './AthleteCard';
import { ProgressPill } from './ProgressPill';
import { Confetti, CelebrationToast } from '../celebrations/Confetti';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

function StatCard({ label, value, unit, animate }: { label: string; value: string | number; unit?: string; animate?: boolean }) {
  const numericValue = typeof value === 'number' ? value : parseInt(value as string, 10);
  const animatedValue = useCountUp(animate && !isNaN(numericValue) ? numericValue : 0, 900);
  const displayValue = animate && !isNaN(numericValue) ? animatedValue : value;

  return (
    <div className="flex-1 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-mono font-bold text-[22px] tabular-nums tracking-tight text-white">
          {displayValue}
        </span>
        {unit && <span className="text-[10px] text-zinc-600 font-medium">{unit}</span>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelUpToast, setLevelUpToast] = useState<{ title: string; message: string } | null>(null);
  const lastLevelRef = useRef<number | null>(null);

  const { data: dashboard, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-batch'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const xp = dashboard?.xp;
  const tier = dashboard?.tier;
  const challenges = dashboard?.challenges;
  const stats = dashboard?.runStats;
  const profilingStatus = dashboard?.profilingStatus;

  useEffect(() => {
    if (!xp?.current_level) return;
    if (lastLevelRef.current !== null && xp.current_level > lastLevelRef.current) {
      setShowConfetti(true);
      setLevelUpToast({ title: `Level ${xp.current_level}!`, message: 'You just leveled up.' });
      playSound('levelup');
    }
    lastLevelRef.current = xp.current_level;
  }, [xp?.current_level]);

  const level = xp?.current_level || 1;
  const progressPercent = xp?.level_progress_percent || 0;
  const xpToNext = xp?.xp_to_next_level || 100;
  const tierName = tier?.tier || 'beginner';

  const isNewUser = !stats?.total_runs || stats.total_runs === 0;
  const hasProfile = profilingStatus?.complete;

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {levelUpToast && (
        <CelebrationToast title={levelUpToast.title} message={levelUpToast.message} type="gold" visible={!!levelUpToast} onDismiss={() => setLevelUpToast(null)} />
      )}

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 pb-6">
        {/* Tier + Level bar */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md ${
              tierName === 'advanced' ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' :
              tierName === 'intermediate' ? 'bg-accent/10 text-accent border border-accent/20' :
              'bg-accent-green/10 text-accent-green border border-accent-green/20'
            }`}>
              {tierName}
            </span>
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
          {xpToNext > 0 && (
            <p className="text-[11px] text-zinc-600">{xpToNext} XP to Level {level + 1}</p>
          )}
        </motion.div>

        {/* NEW USER STATE */}
        {isNewUser && (
          <motion.div variants={fadeUp}>
            <div className="rounded-xl bg-gradient-to-br from-accent/[0.06] via-bg-secondary to-bg-secondary border border-accent/15 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">Get Started</p>
              <div className="space-y-2.5">
                {[
                  { done: true, label: 'Create your account', icon: '✓' },
                  { done: !!(user as any)?.profile_image_url, label: 'Add a profile photo', icon: '📸', action: () => navigate('/profile') },
                  { done: hasProfile, label: 'Complete AI profiling', icon: '🧬', action: () => navigate('/profiling') },
                  { done: false, label: 'Log your first run', icon: '🏃', action: () => navigate('/run/track') },
                ].map((step, i) => (
                  <button
                    key={i}
                    onClick={step.action}
                    disabled={step.done}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      step.done
                        ? 'bg-accent-green/5 border border-accent-green/10'
                        : 'bg-bg-primary/50 border border-bg-tertiary hover:border-accent/30 active:scale-[0.98]'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      step.done ? 'bg-accent-green/20 text-accent-green' : 'bg-bg-tertiary text-zinc-500'
                    }`}>
                      {step.done ? '✓' : step.icon}
                    </span>
                    <span className={`text-[12px] font-medium ${step.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                      {step.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Locked Coach */}
            <div className="mt-3 rounded-2xl bg-bg-secondary border border-bg-tertiary p-4 opacity-40">
              <div className="flex items-center gap-3">
                <span className="text-[18px]">🔒</span>
                <div>
                  <p className="text-[12px] font-bold text-zinc-500">AI Coach locked</p>
                  <p className="text-[10px] text-zinc-600">Complete profiling to unlock</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVE USER STATE */}
        {!isNewUser && (
          <>
            {/* Loading skeleton */}
            {statsLoading && !stats && (
              <motion.div variants={fadeUp} className="space-y-3">
                <div className="h-[40px] rounded-xl bg-bg-secondary animate-pulse" />
                <div className="h-[88px] rounded-xl bg-bg-secondary animate-pulse" />
                <div className="h-[72px] rounded-xl bg-bg-secondary animate-pulse" />
              </motion.div>
            )}

            {/* Progress vs Plan */}
            <motion.div variants={fadeUp}>
              <ProgressPill />
            </motion.div>

            {/* Today's Session */}
            <motion.div variants={fadeUp}>
              <TodaySession streak={xp?.current_streak_days || 0} />
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={fadeUp}>
              <div className="flex gap-[1px] bg-bg-tertiary rounded-xl overflow-hidden">
                <StatCard label="Runs" value={stats?.total_runs || 0} animate />
                <StatCard label="KM" value={stats?.total_distance ? Math.round(stats.total_distance / 1000) : 0} animate />
                <StatCard label="Best" value={stats?.best_pace ? `${Math.floor(stats.best_pace / 60)}:${String(Math.round(stats.best_pace % 60)).padStart(2, '0')}` : '—'} />
              </div>
            </motion.div>

            {/* Pace Dot Trail */}
            <motion.div variants={fadeUp}>
              <PaceDotTrail />
            </motion.div>

            {/* Recent Runs */}
            <motion.div variants={fadeUp}>
              <RecentRuns />
            </motion.div>

            {/* Athlete Card */}
            <motion.div variants={fadeUp}>
              <AthleteCard />
            </motion.div>

            {/* Challenges */}
            {challenges && challenges.length > 0 && (
              <motion.div variants={fadeUp}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-[14px]">Challenges</h3>
                  <button onClick={() => navigate('/challenges')} className="text-[11px] text-accent font-semibold">
                    See all
                  </button>
                </div>
                <ChallengeList />
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </>
  );
}
