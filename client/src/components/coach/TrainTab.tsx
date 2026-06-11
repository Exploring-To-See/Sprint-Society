import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

export function TrainTab() {
  const navigate = useNavigate();
  const [expandedDay, setExpandedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  const { data: plan } = useQuery({
    queryKey: ['training-plan'],
    queryFn: () => api.get('/training/plan').then(r => r.data),
  });

  const { data: week } = useQuery({
    queryKey: ['training-week'],
    queryFn: () => api.get('/training/week').then(r => r.data),
  });

  const { data: goals } = useQuery({
    queryKey: ['user-goals'],
    queryFn: () => api.get('/goals').then(r => r.data),
  });

  const { data: preRun } = useQuery({
    queryKey: ['pre-run-brief'],
    queryFn: () => api.get('/insights/pre-run').then(r => r.data).catch(() => null),
  });

  const activeGoals = goals?.active || [];
  const hasGoal = activeGoals.length > 0;
  const primaryGoal = activeGoals[0];
  const goalName = primaryGoal?.name || plan?.race_name || plan?.goal_name || 'Training Plan';
  const daysLeft = primaryGoal?.target_date ? Math.ceil((new Date(primaryGoal.target_date).getTime() - Date.now()) / 86400000) : null;
  const currentWeek = week?.current_week || plan?.current_week || 1;
  const totalWeeks = week?.total_weeks || plan?.total_weeks || 8;
  const phase = plan?.current_phase || 'Base';

  const sessions: any[] = week?.sessions || [];
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function getDayStatus(index: number) {
    const session = sessions[index];
    if (!session) return 'rest';
    if (session.completed) return 'done';
    if (index < today) return 'missed';
    if (index === today) return 'today';
    return 'upcoming';
  }

  function getDayColor(status: string) {
    switch (status) {
      case 'done': return 'bg-accent-green/15 border-accent-green/30 text-accent-green';
      case 'missed': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'today': return 'bg-accent/12 border-accent text-accent';
      case 'upcoming': return 'bg-bg-secondary border-bg-tertiary text-zinc-500';
      default: return 'bg-bg-primary/50 border-bg-tertiary/50 text-zinc-700';
    }
  }

  return (
    <div className="space-y-3">
      {/* No goal state — CTA to set goal */}
      {!hasGoal && !plan && (
        <div className="rounded-xl bg-gradient-to-br from-accent/[0.06] to-bg-secondary border border-accent/15 p-5 text-center">
          <span className="text-3xl mb-3 block">🎯</span>
          <h3 className="text-[14px] font-bold text-white mb-2">Set your running goal</h3>
          <p className="text-[11px] text-zinc-500 mb-4 max-w-[240px] mx-auto">Tell your AI coach what you're training for and get a personalized plan.</p>
          <button onClick={() => navigate('/set-goal')} className="px-6 py-3 rounded-xl bg-accent text-white text-[12px] font-bold active:scale-[0.98] transition-transform">
            Set Goal →
          </button>
        </div>
      )}

      {/* Goal(s) display */}
      {(hasGoal || plan) && (
        <div className="space-y-2">
          {activeGoals.map((goal: any) => (
            <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/[0.03] border border-accent/15">
              <div className="flex-1">
                <p className="text-[12px] font-bold text-white">{goal.name || goal.type}</p>
                <p className="text-[11px] text-zinc-500">
                  {goal.target_date ? `${Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86400000)} days` : ''}
                  {goal.target_date && phase ? ' · ' : ''}{phase} phase
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
                <span className="text-[10px] font-bold text-accent-green">✓ Active</span>
              </div>
            </div>
          ))}
          {!hasGoal && plan && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/[0.03] border border-accent/15">
              <div className="flex-1">
                <p className="text-[12px] font-bold text-white">{goalName}</p>
                <p className="text-[11px] text-zinc-500">{phase} phase · Week {currentWeek}/{totalWeeks}</p>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/set-goal')} className="w-full py-2.5 rounded-lg border border-dashed border-zinc-700 text-[11px] font-semibold text-zinc-500 hover:text-accent hover:border-accent/30 transition-colors">
            + Add another goal
          </button>
        </div>
      )}

      {(plan || week) && <>
      {/* Week header + See full plan */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Week {currentWeek}</span>
        <button onClick={() => navigate('/plan')} className="text-[10px] font-semibold text-accent">
          See full plan →
        </button>
      </div>

      {/* Day boxes */}
      <div className="flex gap-1">
        {dayLabels.map((label, i) => {
          const status = getDayStatus(i);
          const session = sessions[i];
          const dateNum = new Date(Date.now() + (i - today) * 86400000).getDate();

          return (
            <button
              key={i}
              onClick={() => setExpandedDay(expandedDay === i ? -1 : i)}
              className={`flex-1 rounded-lg py-2 px-1 text-center border transition-all ${getDayColor(status)} ${expandedDay === i ? 'ring-1 ring-accent/50' : ''}`}
            >
              <div className="text-[11px] font-bold uppercase">{label}</div>
              <div className="text-[7px] opacity-60">{dateNum}</div>
              <div className="text-[10px] mt-0.5">
                {status === 'done' ? '✓' : status === 'today' ? '→' : status === 'missed' ? '✗' : session?.type?.[0]?.toUpperCase() || '—'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded day detail */}
      <AnimatePresence>
        {expandedDay >= 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4 space-y-3">
              {(() => {
                const session = sessions[expandedDay];
                const status = getDayStatus(expandedDay);

                if (!session || session.type === 'rest') {
                  return (
                    <div>
                      <p className="text-[13px] font-bold text-zinc-500">{dayLabels[expandedDay]} — Rest Day</p>
                      <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">Complete rest or light yoga. Your muscles rebuild during recovery.</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div>
                      <p className={`text-[13px] font-bold ${status === 'done' ? 'text-accent-green' : status === 'today' ? 'text-accent' : 'text-white'}`}>
                        {status === 'done' ? '✓ ' : status === 'today' ? '→ ' : ''}{dayLabels[expandedDay]} — {session.name || session.type}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        <span className="text-white font-medium">Target:</span> {session.target_pace || session.description || 'Follow coach guidance'}<br/>
                        {session.why && <><span className="text-white font-medium">Why:</span> {session.why}<br/></>}
                        {session.duration && <><span className="text-white font-medium">Duration:</span> ~{session.duration}min</>}
                      </p>
                    </div>

                    {status === 'today' && preRun && (
                      <>
                        <div className="p-3 rounded-lg bg-accent/[0.03] border border-accent/10">
                          <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1">⚔️ Pre-Run</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">
                            • 5-min walk warmup<br/>• Relaxed shoulders, quick turnover<br/>• Hydrate 500ml 30min before
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-500/[0.03] border border-indigo-500/10">
                          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Post-Run</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">
                            • Cool-down walk 5min<br/>• Stretch hamstrings + calves<br/>• Protein within 30min
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-accent-green/[0.03] border border-accent-green/10">
                          <p className="text-[11px] font-bold text-accent-green uppercase tracking-widest mb-1">Nutrition</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">
                            • Light carbs 1-2h before<br/>• Post-run: protein shake or eggs within 30min
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/run/track')}
                          className="w-full py-3 rounded-lg bg-accent text-white text-[12px] font-bold text-center active:scale-[0.98] transition-transform"
                        >
                          Start This Run →
                        </button>
                      </>
                    )}

                    {status === 'done' && session.actual_pace && (
                      <p className="text-[10px] text-zinc-500">
                        Actual: {session.actual_pace} · <span className="text-accent-green">Coach: "Good discipline."</span>
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Plan View is now a separate page at /plan */}
      </>}
    </div>
  );
}
