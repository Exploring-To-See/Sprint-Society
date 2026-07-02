// Home content — rebuilt on ss-base (reference: templates/pages/home.html).
// Every hook from the old Dashboard is preserved: the /dashboard batch (which primes
// the xp/tier/challenges/run-stats caches), level-up confetti + toast + sound, the
// tier bar, the pending-profile nudge and the new-user checklist.
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { SSSkeleton } from '../ss/SSStates';
import { Flame, Spark, ChevronRight, Check, Camera, Lock, RunGlyph } from '../ss/icons';

function StatTile({ label, value, unit, animate }: { label: string; value: string | number; unit?: string; animate?: boolean }) {
  const numericValue = typeof value === 'number' ? value : parseInt(value as string, 10);
  const animatedValue = useCountUp(animate && !isNaN(numericValue) ? numericValue : 0, 900);
  const displayValue = animate && !isNaN(numericValue) ? animatedValue : value;

  return (
    <div className="tile recess" style={{ flex: 1, borderRadius: 18, padding: '12px 13px' }}>
      <div className="num" style={{ font: '700 var(--m-lg) var(--mono)', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 3 }}>
        {displayValue}
        {unit && <small style={{ font: '500 11px var(--mono)', color: 'var(--muted)' }}>{unit}</small>}
      </div>
      <div style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelUpToast, setLevelUpToast] = useState<{ title: string; message: string } | null>(null);
  const lastLevelRef = useRef<number | null>(null);

  const { data: dashboard, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-batch'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  // Readiness feeds the stat strip + the hero orb (shared cache with Coach · Insights).
  const { data: readiness } = useQuery({
    queryKey: ['training-readiness'],
    queryFn: () => api.get('/training/readiness').then(r => r.data).catch(() => null),
    staleTime: 2 * 60 * 1000,
  });

  const xp = dashboard?.xp;
  const tier = dashboard?.tier;
  const challenges = dashboard?.challenges;
  const stats = dashboard?.runStats;
  const profilingStatus = dashboard?.profilingStatus;

  useEffect(() => {
    if (!dashboard) return;
    if (dashboard.xp) queryClient.setQueryData(['xp'], dashboard.xp);
    if (dashboard.tier) queryClient.setQueryData(['tier'], dashboard.tier);
    if (dashboard.challenges) queryClient.setQueryData(['challenges'], dashboard.challenges);
    if (dashboard.runStats) queryClient.setQueryData(['run-stats'], dashboard.runStats);
  }, [dashboard, queryClient]);

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
  const streak = xp?.current_streak_days || 0;
  const tierName: string = tier?.tier || 'beginner';

  const isNewUser = !stats?.total_runs || stats.total_runs === 0;
  const hasProfile = profilingStatus?.complete;
  const readyScore: number | undefined = typeof readiness?.score === 'number' ? readiness.score : undefined;

  const firstName = (user?.name || 'Runner').trim().split(' ')[0];
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const checklist = [
    { done: true, label: 'Create your account', Icon: Check },
    { done: !!user?.profile_image_url, label: 'Add a profile photo', Icon: Camera, action: () => navigate('/profile') },
    { done: !!hasProfile, label: 'Complete AI profiling', Icon: Spark, action: () => navigate('/profiling') },
    { done: false, label: 'Log your first run', Icon: RunGlyph, action: () => navigate('/run/track') },
  ];

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {levelUpToast && (
        <CelebrationToast title={levelUpToast.title} message={levelUpToast.message} type="gold" visible={!!levelUpToast} onDismiss={() => setLevelUpToast(null)} />
      )}

      {/* GREETING + STAT STRIP */}
      <div className="greet">
        <div className="g-l">
          <h1>{greeting()}, {firstName}</h1>
          <div className="date">{dateStr}</div>
        </div>
        <div className="statstrip" aria-label="Readiness, streak and level">
          {readyScore !== undefined && (
            <span className="schip" title={`Readiness ${Math.round(readyScore)}`}>
              <span className="dot" aria-hidden="true" />
              {Math.round(readyScore)}
            </span>
          )}
          {streak > 0 && (
            <span className="schip" title={`${streak} day streak`}>
              <Flame width={12} height={12} style={{ color: 'var(--amber)' }} />
              {streak}
            </span>
          )}
          <span className="schip" title={`Level ${level}`}>L{level}</span>
        </div>
      </div>

      {/* TIER + LEVEL BAR */}
      <div className="ss-pad ss-rise" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <span className={`ss-tag ${tierName === 'advanced' ? 'maybe' : tierName === 'intermediate' ? 'now' : 'go'}`}>{tierName}</span>
          <div style={{ flex: 1, height: 4, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }} aria-hidden="true">
            <motion.div
              style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,var(--accent),var(--amber))' }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
            />
          </div>
          <span className="num" style={{ font: '600 10px var(--mono)', color: 'var(--muted-2)' }}>L{level}</span>
        </div>
        {xpToNext > 0 && (
          <p className="num" style={{ font: '500 11px var(--body)', color: 'var(--muted-2)' }}>{xpToNext} XP to Level {level + 1}</p>
        )}
      </div>

      {/* PENDING PROFILE — the one violet AI surface on Home */}
      {dashboard && !hasProfile && (
        <div className="ss-pad ss-rise" style={{ marginBottom: 12 }}>
          <button
            className="tile ss-ai"
            data-testid="profile-nudge"
            onClick={() => navigate('/profiling')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 13 }}
          >
            <span className="ticon" style={{ background: 'linear-gradient(135deg,var(--violet),var(--accent))', border: 'none' }}>
              <Spark width={15} height={15} style={{ color: '#fff' }} />
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
              <span style={{ display: 'block', font: '600 13px var(--head)', color: '#fff' }}>Complete your profile</span>
              <span style={{ display: 'block', font: '400 11px var(--body)', color: '#D7D7E4', marginTop: 2 }}>
                Unlock your AI coach, pace zones &amp; training plan.
              </span>
            </span>
            <ChevronRight width={16} height={16} style={{ color: 'var(--violet-2)', flex: 'none' }} />
          </button>
        </div>
      )}

      {/* NEW USER — getting-started checklist + locked coach */}
      {isNewUser && (
        <div className="ss-pad ss-rise" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div className="tile recess" style={{ borderRadius: 18, padding: 16 }}>
            <p className="tlbl" style={{ color: 'var(--accent-2)', marginBottom: 12 }}>Get started</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checklist.map((step, i) => (
                <button
                  key={i}
                  onClick={step.action}
                  disabled={step.done}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44,
                    padding: '10px 12px', borderRadius: 12, textAlign: 'left', cursor: step.done ? 'default' : 'pointer',
                    background: step.done ? 'rgba(52,211,153,.07)' : 'rgba(255,255,255,.04)',
                    border: `1px solid ${step.done ? 'rgba(52,211,153,.16)' : 'var(--hair)'}`,
                    color: 'inherit', font: 'inherit',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', flex: 'none',
                      background: step.done ? 'rgba(52,211,153,.16)' : 'rgba(255,255,255,.06)',
                      color: step.done ? 'var(--green)' : 'var(--muted)',
                    }}
                  >
                    {step.done ? <Check width={11} height={11} /> : <step.Icon width={12} height={12} />}
                  </span>
                  <span style={{
                    font: '500 12.5px var(--body)',
                    color: step.done ? 'var(--muted-2)' : 'var(--fg)',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}>
                    {step.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="tile" style={{ borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, opacity: .45 }}>
            <span className="ticon"><Lock width={14} height={14} style={{ color: 'var(--muted)' }} /></span>
            <span>
              <span style={{ display: 'block', font: '600 12px var(--head)', color: 'var(--muted)' }}>AI Coach locked</span>
              <span style={{ display: 'block', font: '400 10.5px var(--body)', color: 'var(--muted-2)' }}>Complete profiling to unlock</span>
            </span>
          </div>
        </div>
      )}

      {/* ACTIVE USER */}
      {!isNewUser && (
        <>
          {statsLoading && !stats && (
            <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <SSSkeleton height={196} style={{ borderRadius: 22 }} />
              <div style={{ display: 'flex', gap: 11 }}>
                {[0, 1, 2].map(i => <SSSkeleton key={i} height={68} style={{ flex: 1, borderRadius: 18 }} />)}
              </div>
              <SSSkeleton height={120} style={{ borderRadius: 18 }} />
            </div>
          )}

          <ProgressPill />

          <div className="ss-pad ss-rise">
            <TodaySession streak={streak} readinessScore={readyScore} readinessLabel={readiness?.label} />
          </div>

          {/* STATS ROW */}
          <div className="ss-pad ss-rise" style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 11 }}>
            <StatTile label="Runs" value={stats?.total_runs || 0} animate />
            <StatTile label="KM" value={stats?.total_distance ? Math.round(stats.total_distance / 1000) : 0} animate />
            <StatTile
              label="Best /km"
              value={stats?.best_pace ? `${Math.floor(stats.best_pace / 60)}:${String(Math.round(stats.best_pace % 60)).padStart(2, '0')}` : '—'}
            />
          </div>

          <div className="ss-pad ss-rise" style={{ marginBottom: 11 }}>
            <PaceDotTrail />
          </div>

          <div className="ss-pad ss-rise">
            <RecentRuns />
          </div>

          <div className="ss-pad ss-rise" style={{ marginTop: 14 }}>
            <AthleteCard />
          </div>

          {challenges && challenges.length > 0 && (
            <div className="ss-pad ss-rise" style={{ marginTop: 14 }}>
              <div className="railhead" style={{ margin: '0 0 9px' }}>
                <span className="rt">Challenges</span>
                <button className="more" onClick={() => navigate('/challenges')}>
                  See all <ChevronRight width={12} height={12} />
                </button>
              </div>
              <ChallengeList />
            </div>
          )}
        </>
      )}
    </>
  );
}
