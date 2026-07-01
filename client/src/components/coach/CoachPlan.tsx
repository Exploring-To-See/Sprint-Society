// AI Coach · Plan — this week at a glance + day detail. Data from training.routes.ts
// (GET /training/week, GET /training/plan), goals.routes.ts (GET /goals), insights.routes.ts
// (GET /insights/pre-run). Day strip = one segmented control (neutral glide-pill on the
// open day; status shown by a small semantic dot, never a hue surface fill).
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import api from '../../lib/api';
import { SSSkeleton, SSEmpty } from '../ss/SSStates';
import { Target, ChevronRight, Play, Check } from '../ss/icons';

interface Session {
  day?: number; type?: string; title?: string; name?: string; description?: string; why?: string;
  target_pace_per_km?: number; duration_minutes?: number; duration?: number; distance_km?: number;
  completed?: boolean; actual_pace?: string;
}
interface Goal { id: number | string; name?: string; type?: string; target_date?: string }
interface Plan { race_name?: string; goal_name?: string; current_week?: number; total_weeks?: number; current_phase?: string }
interface PreRun {
  suggestedDistance?: number; suggestedPace?: string; warmupTip?: string; focusArea?: string;
  environment?: { has_alert?: boolean; temperature_warning?: string | null; aqi_warning?: string | null; tips?: string[] };
}
interface Week { current_week?: number; total_weeks?: number; sessions?: Session[]; week?: { sessions?: Session[] } }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const todayIdx = () => (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

function pace(s?: number): string | null {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}/km`;
}

export function CoachPlan() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number>(todayIdx());

  const { data: plan, isLoading: planLoading } = useQuery<Plan>({ queryKey: ['training-plan'], queryFn: () => api.get('/training/plan').then((r) => r.data).catch(() => null) });
  const { data: week, isLoading: weekLoading } = useQuery<Week>({ queryKey: ['training-week'], queryFn: () => api.get('/training/week').then((r) => r.data).catch(() => null) });
  const { data: goals } = useQuery<{ active?: Goal[] }>({ queryKey: ['user-goals'], queryFn: () => api.get('/goals').then((r) => r.data).catch(() => ({ active: [] })) });
  const { data: preRun } = useQuery<PreRun | null>({ queryKey: ['pre-run-brief'], queryFn: () => api.get('/insights/pre-run').then((r) => r.data).catch(() => null) });

  const isLoading = planLoading || weekLoading;
  const activeGoals = goals?.active || [];
  const hasGoal = activeGoals.length > 0;
  const today = todayIdx();

  const rawSessions = week?.sessions || week?.week?.sessions || [];
  const byDay: Record<number, Session> = {};
  rawSessions.forEach((s, i) => { byDay[s.day ? s.day - 1 : i] = s; });

  const currentWeek = week?.current_week || plan?.current_week || 1;
  const totalWeeks = week?.total_weeks || plan?.total_weeks || 8;
  const phase = plan?.current_phase || 'Base';
  const primary = activeGoals[0];
  const daysLeft = primary?.target_date ? Math.ceil((new Date(primary.target_date).getTime() - Date.now()) / 86400000) : null;
  const goalName = primary?.name || plan?.race_name || plan?.goal_name || 'Training Plan';

  function statusOf(i: number): 'rest' | 'done' | 'missed' | 'today' | 'upcoming' {
    const s = byDay[i];
    if (!s || s.type === 'rest') return 'rest';
    if (s.completed) return 'done';
    if (i < today) return 'missed';
    if (i === today) return 'today';
    return 'upcoming';
  }
  const dotColor: Record<string, string> = { done: 'var(--green)', today: 'var(--accent-2)', missed: 'var(--amber)', upcoming: 'var(--muted-2)', rest: 'transparent' };

  if (isLoading) {
    return (
      <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SSSkeleton height={92} style={{ borderRadius: 18 }} />
        <SSSkeleton height={52} style={{ borderRadius: 13 }} />
        <SSSkeleton height={150} style={{ borderRadius: 18 }} />
      </div>
    );
  }

  if (!hasGoal && !plan) {
    return (
      <div className="ss-pad">
        <SSEmpty
          icon={<Target width={22} height={22} />}
          title="Set your running goal"
          body="Tell your AI coach what you’re training for and get a personalized, periodized plan."
          cta={<button className="ss-btn ss-btn-primary" style={{ height: 44, padding: '0 22px', flex: 'none' }} onClick={() => navigate('/set-goal')} data-testid="plan-set-goal">Set a goal</button>}
          testid="coach-plan-empty"
        />
      </div>
    );
  }

  const openSession = byDay[open];
  const openStatus = statusOf(open);

  return (
    <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* GOAL HEADER */}
      <section className="ss-surface ss-rise" style={{ borderRadius: 18, padding: 14 }} data-testid="coach-plan-goal">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div className="slbl" style={{ marginBottom: 3 }}>{phase} phase · Week {currentWeek}/{totalWeeks}</div>
            <h2 style={{ font: '600 18px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)' }}>{goalName}</h2>
          </div>
          {daysLeft != null && daysLeft >= 0 && (
            <span className="ss-dchip neutral" style={{ flex: 'none' }}>{daysLeft}d to go</span>
          )}
        </div>
        <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,.07)', marginTop: 12, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,var(--accent),var(--accent-2))' }}
            initial={{ width: reduce ? `${Math.round((currentWeek / totalWeeks) * 100)}%` : 0 }}
            animate={{ width: `${Math.round((currentWeek / totalWeeks) * 100)}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        {activeGoals.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {activeGoals.slice(1).map((g) => <span key={g.id} className="ss-tag full">{g.name || g.type}</span>)}
          </div>
        )}
      </section>

      {/* WEEK STRIP — one segmented control */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <span className="tlbl">This week</span>
        <button className="railhead" style={{ margin: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => navigate('/plan')} data-testid="plan-see-full">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, font: '600 11px var(--body)', color: 'var(--violet-2)' }}>Full plan <ChevronRight width={12} height={12} /></span>
        </button>
      </div>
      <div className="ss-segbar ss-rise" role="tablist" aria-label="Days this week" data-testid="coach-plan-week">
        {DAYS.map((d, i) => {
          const st = statusOf(i);
          const on = open === i;
          return (
            <button key={i} role="tab" aria-selected={on} className={`ss-segtab${on ? ' on' : ''}`} style={{ flexDirection: 'column', gap: 3, minHeight: 48 }} onClick={() => setOpen(on ? -1 : i)} data-testid={`plan-day-${i}`}>
              {on && <motion.span layoutId="plan-day-pill" className="ss-segpill" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 40 }} />}
              <span style={{ position: 'relative', zIndex: 1, font: '600 10px var(--head)', letterSpacing: '.02em' }}>{d[0]}</span>
              <span style={{ position: 'relative', zIndex: 1, width: 5, height: 5, borderRadius: '50%', background: dotColor[st], boxShadow: st === 'today' ? '0 0 0 3px rgba(249,115,22,.18)' : 'none' }} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {/* DAY DETAIL */}
      <AnimatePresence initial={false}>
        {open >= 0 && (
          <motion.div
            key={open}
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <section className="ss-surface ss-recess" style={{ borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="coach-plan-detail">
              {(!openSession || openSession.type === 'rest') ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="slbl">{DAYS[open]}</span>
                    <span className="ss-tag full">Rest day</span>
                  </div>
                  <p style={{ font: '400 12.5px/1.5 var(--body)', color: 'var(--muted)', marginTop: 8 }}>Complete rest or light mobility. Muscles rebuild during recovery — protect the adaptation.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="slbl">{DAYS[open]}</span>
                    {openStatus === 'done' && <span className="ss-tag go"><Check width={9} height={9} /> Done</span>}
                    {openStatus === 'today' && <span className="ss-tag now">Today</span>}
                    {openStatus === 'missed' && <span className="ss-tag maybe">Missed</span>}
                    {openStatus === 'upcoming' && <span className="ss-tag full">Upcoming</span>}
                  </div>
                  <h3 style={{ font: '600 16px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)' }}>{openSession.title || openSession.name || openSession.type}</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {pace(openSession.target_pace_per_km) && <Stat k="Target" v={pace(openSession.target_pace_per_km)!} />}
                    {openSession.distance_km && <Stat k="Distance" v={`${openSession.distance_km}`} unit="km" />}
                    {(openSession.duration_minutes || openSession.duration) && <Stat k="Duration" v={`${openSession.duration_minutes || openSession.duration}`} unit="min" />}
                  </div>
                  {(openSession.why || openSession.description) && (
                    <p style={{ font: '400 12px/1.5 var(--body)', color: 'var(--muted)' }}>
                      <span style={{ color: 'var(--fg)', fontWeight: 600 }}>Why · </span>{openSession.why || openSession.description}
                    </p>
                  )}

                  {openStatus === 'today' && preRun && (preRun.warmupTip || preRun.focusArea) && (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <Brief
                        title="Coach brief"
                        lines={[preRun.warmupTip, preRun.focusArea, ...(preRun.environment?.tips || [])].filter(Boolean) as string[]}
                      />
                      {preRun.environment?.has_alert && (preRun.environment.temperature_warning || preRun.environment.aqi_warning) && (
                        <div className="ss-surface" style={{ borderRadius: 12, padding: '10px 12px', borderLeft: '2px solid var(--amber)' }} data-testid="plan-env-alert">
                          <p className="tlbl" style={{ marginBottom: 4, color: 'var(--amber)' }}>Conditions</p>
                          <p style={{ font: '400 11px/1.4 var(--body)', color: 'var(--muted)' }}>
                            {[preRun.environment.temperature_warning, preRun.environment.aqi_warning].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {openStatus === 'today' && (
                    <button className="ss-btn ss-btn-primary" style={{ height: 46 }} onClick={() => navigate('/run/track')} data-testid="plan-start-run">
                      <Play width={15} height={15} /> Start this run
                    </button>
                  )}
                  {openStatus === 'done' && openSession.actual_pace && (
                    <p style={{ font: '500 11px var(--mono)', color: 'var(--muted)' }}>Actual {openSession.actual_pace} · <span style={{ color: 'var(--green)' }}>Good discipline.</span></p>
                  )}
                </>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ k, v, unit }: { k: string; v: string; unit?: string }) {
  return (
    <div className="sstat" style={{ flex: 1 }}>
      <div className="v">{v}{unit && <small>{unit}</small>}</div>
      <div className="k">{k}</div>
    </div>
  );
}

function Brief({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="ss-surface" style={{ borderRadius: 12, padding: '10px 12px' }}>
      <p className="tlbl" style={{ marginBottom: 6 }}>{title}</p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {lines.map((l) => <li key={l} style={{ font: '400 11px/1.4 var(--body)', color: 'var(--muted)', listStyle: 'none' }}>· {l}</li>)}
      </ul>
    </div>
  );
}
