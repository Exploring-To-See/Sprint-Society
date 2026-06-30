// /plan — the full multi-week training plan timeline. Look from Home/ss-base; data from
// training.routes.ts (GET /training/plan) + goals.routes.ts (GET /goals). Phases are neutral
// caps tags (never hue surfaces); week status shows via the timeline dot only.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import { Target, ChevronDown, Check, Flag } from '../components/ss/icons';

interface Session { type?: string; title?: string; target_pace_per_km?: number }
interface WeekData { phase_name?: string; phase?: string; total_distance_km?: number; focus?: string; sessions?: Session[] }
interface Plan { current_week?: number; total_weeks?: number; weeks?: WeekData[]; goal?: { race_name?: string; race_date?: string }; race_name?: string; race_date?: string; predicted_time?: string }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function phaseFor(week: number, total: number): string {
  const r = week / total;
  if (r <= 0.25) return 'Base'; if (r <= 0.6) return 'Build'; if (r <= 0.85) return 'Peak'; return 'Taper';
}
function pace(s?: number): string | null {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}/km`;
}

export function PlanPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [openWeek, setOpenWeek] = useState<number | null>(null);

  const { data: plan, isLoading } = useQuery<Plan>({ queryKey: ['training-plan-full'], queryFn: () => api.get('/training/plan').then((r) => r.data) });
  const { data: goals } = useQuery<{ active?: { name?: string }[] }>({ queryKey: ['goals'], queryFn: () => api.get('/goals').then((r) => r.data).catch(() => ({ active: [] })) });

  if (isLoading) {
    return (
      <SSScreen active="coach" bodyLabel="Training plan">
        <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SSSkeleton height={96} style={{ borderRadius: 18 }} />
          {[0, 1, 2, 3].map((i) => <SSSkeleton key={i} height={64} style={{ borderRadius: 16 }} />)}
        </div>
      </SSScreen>
    );
  }

  if (!plan || !plan.weeks) {
    return (
      <SSScreen active="coach" bodyLabel="Training plan">
        <div className="ss-pad">
          <SSEmpty
            icon={<Target width={22} height={22} />}
            title="No plan yet"
            body="Set a goal and your coach will build a periodized, week-by-week training plan."
            cta={<button className="ss-btn ss-btn-primary" style={{ height: 44, padding: '0 22px', flex: 'none' }} onClick={() => navigate('/set-goal')} data-testid="plan-full-set-goal">Set a goal</button>}
            testid="plan-full-empty"
          />
        </div>
      </SSScreen>
    );
  }

  const currentWeek = plan.current_week || 1;
  const totalWeeks = plan.total_weeks || plan.weeks.length || 8;
  const goalName = plan.goal?.race_name || plan.race_name || goals?.active?.[0]?.name || 'Training Plan';
  const raceDate = plan.goal?.race_date || plan.race_date;
  const daysLeft = raceDate ? Math.ceil((new Date(raceDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <SSScreen active="coach" bodyLabel="Training plan">
      <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* header */}
        <section className="ss-surface ss-rise" style={{ borderRadius: 18, padding: 14 }} data-testid="plan-full-header">
          <button onClick={() => navigate('/coach', { state: { tab: 'plan' } })} style={{ font: '600 11px var(--body)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 6 }}>← Back to coach</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <h1 style={{ font: '600 20px var(--head)', letterSpacing: '-.02em' }}>{goalName}</h1>
            {daysLeft != null && daysLeft >= 0 && <span className="ss-dchip neutral" style={{ flex: 'none' }}>{daysLeft}d to go</span>}
          </div>
          <p style={{ font: '500 11.5px var(--mono)', color: 'var(--muted)', marginTop: 4 }}>Week {currentWeek} of {totalWeeks}</p>
          <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,.07)', marginTop: 10, overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,var(--accent),var(--accent-2))' }} initial={{ width: reduce ? `${Math.round((currentWeek / totalWeeks) * 100)}%` : 0 }} animate={{ width: `${Math.round((currentWeek / totalWeeks) * 100)}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </section>

        {/* timeline */}
        <div style={{ position: 'relative', paddingLeft: 4 }}>
          <div style={{ position: 'absolute', left: 19, top: 6, bottom: 60, width: 2, background: 'var(--hair)' }} aria-hidden="true" />
          {Array.from({ length: totalWeeks }).map((_, i) => {
            const weekNum = i + 1;
            const phase = phaseFor(weekNum, totalWeeks);
            const status = weekNum < currentWeek ? 'done' : weekNum === currentWeek ? 'current' : 'upcoming';
            const w = plan.weeks?.[i];
            const isOpen = openWeek === weekNum;
            const showPhase = phase !== (i > 0 ? phaseFor(i, totalWeeks) : '');
            return (
              <div key={weekNum}>
                {showPhase && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 8px', paddingLeft: 36 }}>
                    <span className="slbl">{phase} phase</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
                  </div>
                )}
                <button onClick={() => setOpenWeek(isOpen ? null : weekNum)} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px' }} data-testid={`plan-week-${weekNum}`}>
                  <span style={{ position: 'relative', zIndex: 1, width: 30, height: 30, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: status === 'current' ? 'rgba(249,115,22,.16)' : 'var(--bg2)', border: `2px solid ${status === 'done' ? 'rgba(52,211,153,.5)' : status === 'current' ? 'var(--accent)' : 'var(--hair)'}` }}>
                    {status === 'done' ? <Check width={12} height={12} style={{ color: 'var(--green)' }} /> : <span style={{ font: '700 11px var(--mono)', color: status === 'current' ? 'var(--accent-2)' : 'var(--muted-2)' }}>{weekNum}</span>}
                  </span>
                  <div className="ss-surface ss-recess" style={{ flex: 1, borderRadius: 14, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ font: '600 13px var(--head)', color: 'var(--fg)' }}>Week {weekNum}</span>
                        <span className="ss-tag full">{w?.phase_name || w?.phase || phase}</span>
                      </div>
                      <ChevronDown width={14} height={14} style={{ color: 'var(--muted-2)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                    </div>
                    {w && (w.total_distance_km || w.focus) && (
                      <p style={{ font: '500 10.5px var(--body)', color: 'var(--muted)', marginTop: 4 }}>
                        {w.total_distance_km ? <span style={{ fontFamily: 'var(--mono)' }}>{w.total_distance_km}km</span> : ''}{w.total_distance_km && (w.focus || w.sessions?.[0]?.title) ? ' · ' : ''}{w.focus || w.sessions?.[0]?.title || ''}
                      </p>
                    )}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && w && (
                    <motion.div initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={reduce ? undefined : { height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginLeft: 42, marginBottom: 10 }}>
                      <div className="ss-surface ss-recess" style={{ borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {(w.sessions || []).map((s, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ font: '600 9.5px var(--mono)', color: 'var(--muted-2)', width: 26, flex: 'none' }}>{DAYS[si] || ''}</span>
                            <span style={{ font: '500 11px var(--body)', color: s.type === 'rest' ? 'var(--muted-2)' : 'var(--fg)' }}>{s.title || s.type || 'Rest'}</span>
                            {pace(s.target_pace_per_km) && <span style={{ marginLeft: 'auto', font: '600 10px var(--mono)', color: 'var(--muted)' }}>{pace(s.target_pace_per_km)}</span>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* race day */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 8 }}>
            <span style={{ position: 'relative', zIndex: 1, width: 30, height: 30, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(251,191,36,.14)', border: '2px solid rgba(251,191,36,.5)', color: 'var(--amber)' }}><Flag width={14} height={14} /></span>
            <div className="ss-surface" style={{ flex: 1, borderRadius: 14, padding: 14 }}>
              <p style={{ font: '600 14px var(--head)', color: 'var(--fg)' }}>Race day</p>
              <p style={{ font: '500 11px var(--body)', color: 'var(--muted)', marginTop: 3 }}>{goalName}{daysLeft != null ? ` · ${daysLeft} days away` : ''}</p>
              {plan.predicted_time && <p style={{ font: '600 11px var(--mono)', color: 'var(--amber)', marginTop: 4 }}>Predicted {plan.predicted_time}</p>}
            </div>
          </div>
        </div>
      </div>
    </SSScreen>
  );
}
