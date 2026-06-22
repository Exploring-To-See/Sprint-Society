import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

const PHASE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  base: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  build: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
  peak: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  taper: { bg: 'bg-accent-green/10', text: 'text-accent-green', border: 'border-accent-green/20' },
  recovery: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

export function PlanPage() {
  const navigate = useNavigate();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['training-plan-full'],
    queryFn: () => api.get('/training/plan').then(r => r.data),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then(r => r.data).catch(() => ({ active: [] })),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-20 rounded-xl bg-bg-secondary" />
          <div className="h-40 rounded-xl bg-bg-secondary" />
          <div className="h-40 rounded-xl bg-bg-secondary" />
        </div>
      </AppShell>
    );
  }

  if (!plan || !plan.weeks) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <span className="text-3xl mb-3 block">🎯</span>
          <h2 className="text-[16px] font-bold text-white mb-2">No plan yet</h2>
          <p className="text-[12px] text-zinc-500 mb-6">Set a goal to generate your training plan.</p>
          <button onClick={() => navigate('/set-goal')} className="px-6 py-3 rounded-xl bg-accent text-white text-[12px] font-bold">
            Set Goal →
          </button>
        </div>
      </AppShell>
    );
  }

  const currentWeek = plan.current_week || 1;
  const totalWeeks = plan.total_weeks || plan.weeks?.length || 8;
  const progressPercent = Math.round((currentWeek / totalWeeks) * 100);
  const goalName = plan.goal?.race_name || plan.race_name || goals?.active?.[0]?.name || 'Training Plan';
  const raceDate = plan.goal?.race_date || plan.race_date;
  const daysLeft = raceDate ? Math.ceil((new Date(raceDate).getTime() - Date.now()) / 86400000) : null;

  function getPhaseForWeek(weekNum: number): string {
    const ratio = weekNum / totalWeeks;
    if (ratio <= 0.25) return 'base';
    if (ratio <= 0.6) return 'build';
    if (ratio <= 0.85) return 'peak';
    return 'taper';
  }

  function getWeekStatus(weekNum: number): 'done' | 'current' | 'upcoming' {
    if (weekNum < currentWeek) return 'done';
    if (weekNum === currentWeek) return 'current';
    return 'upcoming';
  }

  return (
    <AppShell>
      <div className="pb-8">
        {/* Header */}
        <div className="mb-5">
          <button onClick={() => navigate('/coach', { state: { tab: 'plan' } })} className="text-[11px] text-zinc-500 mb-2 flex items-center gap-1">
            <span>←</span> Back to Coach
          </button>
          <h1 className="text-[18px] font-bold text-white">{goalName}</h1>
          <div className="flex items-center gap-3 mt-2">
            {daysLeft && <span className="text-[11px] text-accent font-semibold">{daysLeft} days to go</span>}
            <span className="text-[11px] text-zinc-500">Week {currentWeek} of {totalWeeks}</span>
          </div>
          {/* Progress bar */}
          <div className="h-[4px] rounded-full bg-bg-tertiary mt-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-bg-tertiary" />

          {Array.from({ length: totalWeeks }).map((_, i) => {
            const weekNum = i + 1;
            const phase = getPhaseForWeek(weekNum);
            const status = getWeekStatus(weekNum);
            const phaseStyle = PHASE_COLORS[phase] || PHASE_COLORS.base;
            const weekData = plan.weeks?.[i];
            const isExpanded = expandedWeek === weekNum;

            // Show phase label at phase transitions
            const prevPhase = i > 0 ? getPhaseForWeek(i) : '';
            const showPhaseLabel = phase !== prevPhase;

            return (
              <div key={weekNum}>
                {/* Phase label */}
                {showPhaseLabel && (
                  <div className="flex items-center gap-2 ml-8 mb-2 mt-4">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${phaseStyle.text}`}>
                      {phase} phase
                    </span>
                    <div className={`flex-1 h-[1px] ${phaseStyle.bg}`} />
                  </div>
                )}

                {/* Week card */}
                <button
                  onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                  className="relative flex items-start gap-3 w-full text-left mb-2 active:scale-[0.99] transition-transform"
                >
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    status === 'done' ? 'bg-accent-green/20 border-2 border-accent-green/40' :
                    status === 'current' ? 'bg-accent/20 border-2 border-accent' :
                    'bg-bg-tertiary/50 border-2 border-bg-tertiary'
                  }`}>
                    {status === 'done' && <span className="text-[10px] text-accent-green">✓</span>}
                    {status === 'current' && <span className="text-[9px] font-bold text-accent">{weekNum}</span>}
                    {status === 'upcoming' && <span className="text-[9px] text-zinc-600">{weekNum}</span>}
                  </div>

                  {/* Card */}
                  <div className={`flex-1 rounded-xl p-3 border transition-all ${
                    status === 'current' ? 'bg-accent/[0.04] border-accent/30' :
                    status === 'done' ? 'bg-bg-secondary/50 border-bg-tertiary/50' :
                    'bg-bg-secondary border-bg-tertiary'
                  } ${isExpanded ? 'ring-1 ring-accent/30' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[12px] font-bold text-white">Week {weekNum}</span>
                        <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${phaseStyle.bg} ${phaseStyle.text}`}>{weekData?.phase_name || weekData?.phase || phase}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600">{isExpanded ? '▾' : '▸'}</span>
                    </div>
                    {weekData && (
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {weekData.total_distance_km ? `${weekData.total_distance_km}km` : ''} · Focus: {weekData.focus || weekData.sessions?.[0]?.title || 'Easy runs'}
                      </p>
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && weekData && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-11 mb-3"
                    >
                      <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3 space-y-2">
                        {(weekData.sessions || []).map((session: any, si: number) => {
                          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          return (
                            <div key={si} className="flex items-center gap-2">
                              <span className="text-[9px] text-zinc-600 w-7">{days[si] || ''}</span>
                              <span className={`text-[10px] font-medium ${
                                session.type === 'rest' ? 'text-zinc-600' :
                                session.type === 'easy' || session.type === 'recovery' ? 'text-accent-green' :
                                session.type === 'tempo' || session.type === 'interval' ? 'text-accent' :
                                'text-white'
                              }`}>
                                {session.title || session.type || 'Rest'}
                              </span>
                              {session.target_pace_per_km ? (
                                <span className="text-[9px] text-zinc-600 ml-auto">
                                  {Math.floor(session.target_pace_per_km / 60)}:{String(Math.round(session.target_pace_per_km % 60)).padStart(2, '0')}/km
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Race Day */}
          <div className="relative flex items-start gap-3 mt-4">
            <div className="relative z-10 w-8 h-8 rounded-full bg-accent-gold/20 border-2 border-accent-gold flex items-center justify-center flex-shrink-0">
              <span className="text-[12px]">🏁</span>
            </div>
            <div className="flex-1 rounded-xl p-4 bg-gradient-to-r from-accent-gold/[0.06] to-accent/[0.04] border border-accent-gold/20">
              <p className="text-[13px] font-bold text-white">Race Day</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {goalName} {daysLeft ? `· ${daysLeft} days away` : ''}
              </p>
              {plan.predicted_time && (
                <p className="text-[11px] text-accent-gold mt-1 font-semibold">Predicted: {plan.predicted_time}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
