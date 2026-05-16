import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

const SESSION_ICONS: Record<string, string> = {
  easy: '🏃', long: '🛤️', tempo: '⚡', interval: '🔥',
  recovery: '🧘', rest: '😴', cross_training: '🏊', fartlek: '🎲',
};

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function TrainingPage() {
  const queryClient = useQueryClient();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalDistance, setGoalDistance] = useState('5000');
  const [goalDate, setGoalDate] = useState('');

  const { data: weekData, isLoading } = useQuery({
    queryKey: ['training-week'],
    queryFn: () => api.get('/training/week').then(r => r.data),
  });

  const { data: prediction } = useQuery({
    queryKey: ['race-prediction'],
    queryFn: () => api.get('/training/predict?distance=5000').then(r => r.data),
  });

  const { data: readiness } = useQuery({
    queryKey: ['readiness'],
    queryFn: () => api.get('/training/readiness').then(r => r.data),
  });

  const generatePlan = useMutation({
    mutationFn: (goal: any) => api.post('/training/plan', goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-week'] });
      setShowGoalForm(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (payload: { week_number: number; day: number }) =>
      api.post('/training/complete-session', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-week'] });
      queryClient.invalidateQueries({ queryKey: ['xp'] });
    },
  });

  const today = new Date().getDay() || 7;

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Training</p>
            <h1 className="font-heading text-xl font-bold mt-0.5">Your Plan</h1>
          </div>
          <button
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="text-[11px] font-medium text-accent px-3 py-1.5 rounded-lg border border-accent/20 hover:border-accent/40 transition-colors"
          >
            {showGoalForm ? 'Cancel' : 'Set Goal'}
          </button>
        </motion.div>

        {/* Goal form */}
        {showGoalForm && (
          <motion.div variants={fadeUp} className="card p-4 space-y-3">
            <p className="label">Race Goal</p>
            <select
              value={goalDistance}
              onChange={(e) => setGoalDistance(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-bg-tertiary text-white text-sm focus:border-zinc-500 focus:outline-none"
            >
              <option value="5000">5K</option>
              <option value="10000">10K</option>
              <option value="21100">Half Marathon</option>
              <option value="42200">Marathon</option>
            </select>
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              placeholder="Race date (optional)"
              className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-bg-tertiary text-white text-sm focus:border-zinc-500 focus:outline-none"
            />
            <Button
              fullWidth
              onClick={() => generatePlan.mutate({ distance_meters: Number(goalDistance), race_date: goalDate || undefined })}
              disabled={generatePlan.isPending}
            >
              {generatePlan.isPending ? 'Generating...' : 'Generate Plan'}
            </Button>
          </motion.div>
        )}

        {/* Race prediction */}
        {prediction && prediction.confidence !== 'low' && (
          <motion.div variants={fadeUp} className="card p-4 flex items-center justify-between">
            <div>
              <p className="label">5K Prediction</p>
              <p className="font-mono text-lg font-bold text-accent-gold mt-1">{prediction.predicted_formatted}</p>
            </div>
            <div className="text-right">
              <p className="label">VDOT</p>
              <p className="font-mono text-lg font-bold mt-1">{prediction.vdot}</p>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && <div className="text-center py-16 text-zinc-600 text-sm">Loading plan...</div>}

        {/* No plan */}
        {!isLoading && !weekData?.week && (
          <motion.div variants={fadeUp} className="text-center py-16">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-zinc-400 text-sm">No training plan yet</p>
            <p className="text-zinc-600 text-xs mt-1">Set a goal above to generate your personalized plan</p>
          </motion.div>
        )}

        {/* Week view */}
        {weekData?.week && (
          <>
            <motion.div variants={fadeUp} className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-[15px]">
                  Week {weekData.current_week} — {weekData.week.phase_name}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {weekData.week.total_distance_km}km total • {weekData.week.total_sessions} sessions
                </p>
              </div>
              {readiness && (
                <div className={`w-2.5 h-2.5 rounded-full ${
                  readiness.color === 'green' ? 'bg-accent-green' :
                  readiness.color === 'yellow' ? 'bg-amber-400' : 'bg-red-400'
                }`} title={readiness.label} />
              )}
            </motion.div>

            {/* Sessions list */}
            <motion.div variants={fadeUp} className="space-y-2">
              {weekData.week.sessions.map((session: any) => {
                const isToday = session.day === today;
                const isPast = session.day < today;
                const icon = SESSION_ICONS[session.type] || '🏃';

                return (
                  <div
                    key={session.day}
                    className={`card p-3.5 flex items-center gap-3 ${
                      isToday ? 'border-accent/30 bg-accent/5' :
                      isPast ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="w-8 text-center">
                      <p className={`text-[10px] font-medium ${isToday ? 'text-accent' : 'text-zinc-500'}`}>
                        {DAY_NAMES[session.day]}
                      </p>
                    </div>
                    <div className="text-lg">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium ${session.type === 'rest' ? 'text-zinc-500' : 'text-white'}`}>
                        {session.title}
                      </p>
                      {session.target_pace_per_km && session.type !== 'rest' && (
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {formatPace(session.target_pace_per_km)}/km • RPE {session.rpe}
                        </p>
                      )}
                    </div>
                    {isToday && session.type !== 'rest' && (
                      <button
                        onClick={() => completeMutation.mutate({ week_number: weekData.current_week, day: session.day })}
                        disabled={completeMutation.isPending}
                        className="text-[10px] font-medium text-accent shrink-0"
                      >
                        Done ✓
                      </button>
                    )}
                  </div>
                );
              })}
            </motion.div>

            {/* Tips */}
            {weekData.week.tips && (
              <motion.div variants={fadeUp} className="card p-4">
                <p className="label mb-2">Tips for this phase</p>
                <div className="space-y-1.5">
                  {weekData.week.tips.map((tip: string, i: number) => (
                    <p key={i} className="text-[12px] text-zinc-400">• {tip}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </AppShell>
  );
}
