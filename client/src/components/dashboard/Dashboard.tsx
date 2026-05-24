import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCountUp } from '../../hooks/useCountUp';
import { playSound } from '../../lib/sounds';
import { PaceChart } from './PaceChart';
import { ChallengeList } from './ChallengeList';
import { ReadinessCard } from './ReadinessCard';
import { TodaySession } from './TodaySession';
import { TrainingLoadRing } from './TrainingLoadRing';
import { PRBanner } from './PRBanner';
import { LevelCard } from './LevelCard';
import { Confetti, CelebrationToast } from '../celebrations/Confetti';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

function getGreeting(name: string): { text: string; icon: string } {
  const hour = new Date().getHours();
  const firstName = name?.split(' ')[0] || 'Runner';
  if (hour < 5) return { text: `Rest up, ${firstName}`, icon: '\u{1F319}' };
  if (hour < 12) return { text: `Good morning, ${firstName}`, icon: '\u{2600}\u{FE0F}' };
  if (hour < 17) return { text: `Keep pushing, ${firstName}`, icon: '\u{1F4AA}' };
  if (hour < 21) return { text: `Evening grind, ${firstName}`, icon: '\u{1F306}' };
  return { text: `Rest up, ${firstName}`, icon: '\u{1F319}' };
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-bg-tertiary/50 ${className}`} />;
}

function StatCard({ label, value, unit, accent, animate }: { label: string; value: string | number; unit?: string; accent?: boolean; animate?: boolean }) {
  const numericValue = typeof value === 'number' ? value : parseInt(value as string, 10);
  const animatedValue = useCountUp(animate && !isNaN(numericValue) ? numericValue : 0, 900);
  const displayValue = animate && !isNaN(numericValue) ? animatedValue : value;

  return (
    <div className="flex-1 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono font-bold text-[22px] tabular-nums tracking-tight ${accent ? 'text-accent' : 'text-white'}`}>
          {displayValue}
        </span>
        {unit && <span className="text-[10px] text-zinc-600 font-medium">{unit}</span>}
      </div>
    </div>
  );
}

type TrendTab = 'pace' | 'km' | 'consistency';

export function Dashboard() {
  const { user } = useAuth();
  const smartGreeting = getGreeting((user as any)?.name || 'Runner');
  const navigate = useNavigate();
  const [trendTab, setTrendTab] = useState<TrendTab>('pace');
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelUpToast, setLevelUpToast] = useState<{ title: string; message: string } | null>(null);
  const lastLevelRef = useRef<number | null>(null);

  const { data: xp } = useQuery({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  // Confetti on level-up detection
  useEffect(() => {
    if (!xp?.current_level) return;
    if (lastLevelRef.current !== null && xp.current_level > lastLevelRef.current) {
      setShowConfetti(true);
      setLevelUpToast({ title: `Level ${xp.current_level}!`, message: `You just leveled up. Keep grinding.` });
      playSound('levelup');
    }
    lastLevelRef.current = xp.current_level;
  }, [xp?.current_level]);

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

  const { data: recentRuns } = useQuery({
    queryKey: ['recent-runs'],
    queryFn: () => api.get('/runs?limit=5').then(r => r.data).catch(() => []),
  });

  const { data: unreadNotifs } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => api.get('/subscription/status').then(r => r.data),
  });

  const { data: friendStreaks } = useQuery({
    queryKey: ['friend-streaks'],
    queryFn: () => api.get('/gamification/friend-streaks').then(r => r.data).catch(() => null),
  });

  const level = xp?.current_level || 1;
  const streak = xp?.current_streak_days || 0;
  const progressPercent = xp?.level_progress_percent || 0;
  const xpToNext = xp?.xp_to_next_level || 100;
  const tierName = tier?.tier || 'beginner';
  const completedChallenges = challenges?.filter((c: any) => c.completed)?.length || 0;
  const totalChallenges = challenges?.length || 0;

  const greetingHour = new Date().getHours();
  const timeGreeting = greetingHour < 6 ? 'Late night' : greetingHour < 12 ? 'Morning' : greetingHour < 17 ? 'Afternoon' : 'Evening';
  const lastRun = recentRuns?.[0];
  const greeting = lastRun
    ? (() => {
        const diffHours = (Date.now() - new Date(lastRun.start_date).getTime()) / 3600000;
        const km = (lastRun.distance_meters / 1000).toFixed(1);
        if (diffHours < 12) return `Back from your ${km}km? Nice`;
        if (diffHours < 36) return `${km}km yesterday — solid`;
        return timeGreeting;
      })()
    : timeGreeting;

  return (
    <>
    <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
    {levelUpToast && (
      <CelebrationToast title={levelUpToast.title} message={levelUpToast.message} type="gold" visible={!!levelUpToast} onDismiss={() => setLevelUpToast(null)} />
    )}
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 pb-6">
      {/* Smart Greeting */}
      <motion.div variants={fadeUp} className="mb-4">
        <p className="text-zinc-500 text-xs">{smartGreeting.icon} {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
        <h1 className="font-heading text-2xl font-bold text-white mt-1">{smartGreeting.text}</h1>
      </motion.div>

      {/* Header */}
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
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-8 h-8 rounded-full bg-bg-secondary border border-bg-tertiary flex items-center justify-center active:scale-95 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-zinc-500">
                <path d="M8 1.5a4 4 0 014 4v2.5l1.5 2.5H2.5L4 8V5.5a4 4 0 014-4zM6 12.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {(unreadNotifs?.count || 0) > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{unreadNotifs.count > 9 ? '9+' : unreadNotifs.count}</span>
                </div>
              )}
            </button>
            <div
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-bg-secondary border border-bg-tertiary overflow-hidden flex items-center justify-center cursor-pointer"
            >
              {(user as any)?.profile_image_url ? (
                <img src={(user as any).profile_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-zinc-500">{user?.name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Level + Tier + Progress */}
        <div className="flex items-center gap-3 mt-3">
          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md ${
            tierName === 'advanced' ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' :
            tierName === 'intermediate' ? 'bg-accent/10 text-accent border border-accent/20' :
            'bg-accent-green/10 text-accent-green border border-accent-green/20'
          }`}>
            {tierName}
          </span>
          {subscription?.plan_key && subscription.plan_key !== 'free' && (
            <span className={`text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded ${
              subscription.plan_key === 'premium' ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : 'bg-accent/10 text-accent border border-accent/20'
            }`}>
              {subscription.plan_key === 'premium' ? '👑 Premium' : '⚡ Pro'}
            </span>
          )}
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
        {xpToNext > 0 && (
          <p className="text-[10px] text-zinc-600 mt-1">{xpToNext} XP to Level {level + 1}</p>
        )}
      </motion.div>

      {/* Onboarding Checklist (for new users) */}
      {stats?.total_runs === 0 && (
        <motion.div variants={fadeUp}>
          <div className="rounded-xl bg-gradient-to-br from-accent/8 via-bg-secondary to-bg-secondary border border-accent/15 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent mb-3">Get Started</p>
            <div className="space-y-2.5">
              {[
                { done: true, label: 'Create your account', icon: '✓' },
                { done: !!(user as any)?.profile_image_url, label: 'Add a profile photo', icon: '📸', action: () => navigate('/profile') },
                { done: false, label: 'Complete AI profiling', icon: '🧬', action: () => navigate('/profiling') },
                { done: false, label: 'Connect Strava', icon: '🔗', action: () => navigate('/profile') },
                { done: false, label: 'RSVP to your first event', icon: '📅', action: () => navigate('/events') },
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
                  {!step.done && (
                    <svg className="w-3.5 h-3.5 text-zinc-600 ml-auto" fill="none" viewBox="0 0 16 16">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TODAY'S ACTION — What should I do right now? */}
      <ReadinessCard />
      <TodaySession streak={streak} />

      {/* Social Ticker — Who's running? */}
      <motion.div variants={fadeUp}>
        <div className="px-3 py-2.5 rounded-lg bg-bg-secondary/50 border border-bg-tertiary/50">
          <p className="text-[11px] text-zinc-500 text-center">
            <span className="text-zinc-400">👟</span> 3 runners in your community ran today
          </p>
        </div>
      </motion.div>

      {/* Streak Visual */}
      {streak > 0 && (
        <motion.div variants={fadeUp}>
          <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-[14px]">Streak</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px]">{streak >= 30 ? '🌟' : streak >= 14 ? '⚡' : '🔥'}</span>
                <span className="font-mono font-bold text-[18px] text-accent tabular-nums">{streak}</span>
                <span className="text-[10px] text-zinc-600">days</span>
              </div>
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: 7 }).map((_, i) => {
                const isActive = i < Math.min(streak, 7);
                const dayLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full h-8 rounded-md transition-all ${
                      isActive
                        ? 'bg-gradient-to-t from-accent/60 to-accent/20 border border-accent/30'
                        : 'bg-bg-tertiary/30 border border-bg-tertiary/50'
                    }`} />
                    <span className={`text-[8px] font-semibold ${isActive ? 'text-accent' : 'text-zinc-700'}`}>
                      {dayLabel[i]}
                    </span>
                  </div>
                );
              })}
            </div>
            {streak >= 7 && (
              <p className="text-[10px] text-accent-gold mt-2 text-center font-medium">
                {streak >= 30 ? '🌟 Legendary streak!' : streak >= 14 ? '⚡ On fire!' : '✓ Week complete!'}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* V2 Classification Level Card */}
      <motion.div variants={fadeUp}>
        <LevelCard />
      </motion.div>

      {/* Daily AI Insight */}
      <motion.div variants={fadeUp}>
        <div className="rounded-xl bg-gradient-to-r from-accent/5 to-transparent border border-accent/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[14px]">💡</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-1">Daily Insight</p>
              <p className="text-[13px] text-zinc-300 leading-relaxed">
                {stats?.total_runs > 0
                  ? `You've run ${stats?.total_distance ? Math.round(stats.total_distance / 1000) : 0}km total. ${streak > 3 ? `${streak}-day streak — consistency is your superpower.` : 'Build your streak — consistency beats intensity.'}`
                  : 'Connect Strava to unlock personalized insights from your run data.'
                }
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Scorecard */}
      {stats?.total_runs > 0 && (
        <motion.div variants={fadeUp}>
          <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-[14px]">AI Score</h3>
              <div className="flex items-baseline gap-1">
                <span className="font-mono font-bold text-[24px] text-accent tabular-nums">
                  {Math.min(100, Math.round(
                    ((streak > 0 ? Math.min(streak * 10, 35) : 0) +
                    (stats.total_runs > 10 ? 30 : stats.total_runs * 3) +
                    (adaptive?.training_load?.balance === 'optimal' ? 35 : adaptive?.training_load?.balance === 'good' ? 25 : 15))
                  ))}
                </span>
                <span className="text-[10px] text-zinc-600">/100</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Consistency', value: streak > 5 ? 'High' : streak > 2 ? 'Medium' : 'Low', color: streak > 5 ? 'text-accent-green' : streak > 2 ? 'text-amber-400' : 'text-zinc-500' },
                { label: 'Improvement', value: stats.total_runs > 5 ? 'Trending ↑' : 'Building', color: stats.total_runs > 5 ? 'text-accent' : 'text-zinc-400' },
                { label: 'Load Balance', value: adaptive?.training_load?.balance || 'N/A', color: adaptive?.training_load?.balance === 'optimal' ? 'text-accent-green' : 'text-zinc-400' },
              ].map(s => (
                <div key={s.label} className="text-center px-2 py-2 rounded-lg bg-bg-primary/50">
                  <p className={`text-[11px] font-semibold ${s.color}`}>{s.value}</p>
                  <p className="text-[8px] text-zinc-600 uppercase mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Training Load */}
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

      {/* Quick Stats */}
      <motion.div variants={fadeUp}>
        {statsLoading ? (
          <div className="flex gap-1">
            <Skeleton className="h-[72px] flex-1" />
            <Skeleton className="h-[72px] flex-1" />
            <Skeleton className="h-[72px] flex-1" />
          </div>
        ) : (
          <div className="flex rounded-xl bg-bg-secondary border border-bg-tertiary divide-x divide-bg-tertiary overflow-hidden">
            <StatCard label="Runs" value={stats?.total_runs || 0} animate />
            <StatCard label="Distance" value={stats?.total_distance ? Math.round(stats.total_distance / 1000) : 0} unit="km" animate />
            <StatCard label="Best pace" value={stats?.best_pace ? formatPace(stats.best_pace) : '--'} unit="/km" accent />
          </div>
        )}
      </motion.div>

      {/* Latest PR */}
      {records?.latest_pr && (
        <motion.div variants={fadeUp}>
          <PRBanner pr={records.latest_pr} totalPRs={records.total_count} />
        </motion.div>
      )}

      {/* Recent Runs (Run Log) */}
      <motion.div variants={fadeUp}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-heading font-semibold text-[14px]">Recent runs</h3>
          <button onClick={() => navigate('/runs')} className="text-[10px] text-accent font-medium">View all</button>
        </div>
        {recentRuns && recentRuns.length > 0 ? (
          <div className="space-y-2">
            {recentRuns.slice(0, 5).map((run: any) => (
              <div key={run.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-[12px]">🏃</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-white truncate">
                    {(run.distance_meters / 1000).toFixed(1)} km
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {new Date(run.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-mono font-semibold text-accent tabular-nums">
                    {formatPace(run.average_pace_per_km)}<span className="text-[9px] text-zinc-600">/km</span>
                  </p>
                  <p className="text-[10px] text-zinc-600">{formatDuration(run.moving_time_seconds)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-6 text-center">
            <p className="text-[12px] text-zinc-500">No runs yet. Connect Strava or complete your first run!</p>
          </div>
        )}
      </motion.div>

      {/* Trends (Tabbed) */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-[14px]">Trends</h3>
          <div className="flex gap-1">
            {(['pace', 'km', 'consistency'] as TrendTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setTrendTab(tab)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  trendTab === tab ? 'bg-accent/10 text-accent' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {tab === 'pace' ? 'Pace' : tab === 'km' ? 'Volume' : 'Consistency'}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-4">
          {trendTab === 'pace' && <PaceChart />}
          {trendTab === 'km' && <WeeklyKmChart />}
          {trendTab === 'consistency' && <ConsistencyChart />}
        </div>
      </motion.div>

      {/* Challenges / Tips */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-[14px]">This week</h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-[3px]">
              {Array.from({ length: totalChallenges }).map((_, i) => (
                <div key={i} className={`w-[6px] h-[6px] rounded-full ${i < completedChallenges ? 'bg-accent-green' : 'bg-bg-tertiary'}`} />
              ))}
            </div>
            <span className="text-[10px] font-mono text-zinc-600 tabular-nums">{completedChallenges}/{totalChallenges}</span>
          </div>
        </div>
        <ChallengeList />
      </motion.div>
    </motion.div>
    </>
  );
}

function WeeklyKmChart() {
  const { data: trends } = useQuery({
    queryKey: ['run-trends'],
    queryFn: () => api.get('/runs/trends').then(r => r.data),
  });

  if (!trends || trends.length === 0) {
    return <div className="h-[120px] flex items-center justify-center"><p className="text-[11px] text-zinc-600">Need more runs to show trends</p></div>;
  }

  const maxKm = Math.max(...trends.map((w: any) => w.km), 1);

  return (
    <div className="h-[120px] flex items-end gap-[6px] px-1">
      {trends.map((w: any, i: number) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono text-zinc-500 tabular-nums">{w.km > 0 ? w.km : ''}</span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-accent/60 to-accent/30 transition-all"
            style={{ height: `${Math.max((w.km / maxKm) * 80, 4)}px` }}
          />
          <span className="text-[7px] text-zinc-700">{new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).split(' ')[0]}</span>
        </div>
      ))}
    </div>
  );
}

function ConsistencyChart() {
  const { data: trends } = useQuery({
    queryKey: ['run-trends'],
    queryFn: () => api.get('/runs/trends').then(r => r.data),
  });

  if (!trends || trends.length === 0) {
    return <div className="h-[120px] flex items-center justify-center"><p className="text-[11px] text-zinc-600">Need more runs to show trends</p></div>;
  }

  return (
    <div className="h-[120px] flex items-end gap-[6px] px-1">
      {trends.map((w: any, i: number) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono text-zinc-500 tabular-nums">{w.days_run > 0 ? w.days_run : ''}</span>
          <div className="w-full flex flex-col gap-[2px] justify-end" style={{ height: '80px' }}>
            {Array.from({ length: 7 }).map((_, d) => (
              <div key={d} className={`w-full h-[10px] rounded-sm ${d < w.days_run ? 'bg-accent-green/60' : 'bg-bg-tertiary/30'}`} />
            )).reverse()}
          </div>
          <span className="text-[7px] text-zinc-700">W{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
