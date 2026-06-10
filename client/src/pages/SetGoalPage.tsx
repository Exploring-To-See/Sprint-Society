import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

type GoalType = 'race' | 'pace' | 'volume';

const DISTANCES = [
  { value: 1000, label: '1K' },
  { value: 3000, label: '3K' },
  { value: 5000, label: '5K' },
  { value: 10000, label: '10K' },
  { value: 15000, label: '15K' },
  { value: 21097, label: 'Half Marathon' },
  { value: 42195, label: 'Marathon' },
];

const TIMELINE_PRESETS = [
  { weeks: 4, label: '4 weeks' },
  { weeks: 8, label: '8 weeks' },
  { weeks: 12, label: '12 weeks' },
  { weeks: 16, label: '16 weeks' },
];

export function SetGoalPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [targetMinutes, setTargetMinutes] = useState('');
  const [targetSeconds, setTargetSeconds] = useState('');
  const [targetWeeks, setTargetWeeks] = useState(8);
  const [volumeKm, setVolumeKm] = useState('');
  const [volumePeriod, setVolumePeriod] = useState<'week' | 'month'>('week');
  const [generating, setGenerating] = useState(false);

  const createGoal = useMutation({
    mutationFn: async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + targetWeeks * 7);

      const body: any = { type: goalType, target_date: targetDate.toISOString().split('T')[0] };

      if (goalType === 'race' || goalType === 'pace') {
        body.distance_meters = distance;
        if (targetMinutes) {
          body.target_time_seconds = parseInt(targetMinutes) * 60 + (parseInt(targetSeconds) || 0);
        }
        if (goalType === 'pace' && targetMinutes) {
          body.target_pace_per_km = parseInt(targetMinutes) * 60 + (parseInt(targetSeconds) || 0);
        }
      } else if (goalType === 'volume') {
        body.target_km = parseFloat(volumeKm);
        body.target_period = volumePeriod;
      }

      const { data: goal } = await api.post('/goals', body);
      const { data: plan } = await api.post('/goals/generate-plan');
      return { goal, plan };
    },
    onSuccess: () => {
      setGenerating(false);
      setStep(3);
    },
    onError: (error: any) => {
      setGenerating(false);
      alert(error?.response?.data?.error || 'Failed to generate your plan. Please try again.');
    },
  });

  const handleGenerate = () => {
    setGenerating(true);
    createGoal.mutate();
  };

  return (
    <AppShell hideNav>
      <div className="min-h-[80vh] flex flex-col">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i <= step ? 'bg-accent w-4' : 'bg-bg-tertiary'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Choose type */}
          {step === 0 && (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col px-1">
              <h1 className="text-[22px] font-bold text-white mb-2">What's your goal?</h1>
              <p className="text-[12px] text-zinc-500 mb-6">Your AI coach builds a personalized plan around this.</p>

              <div className="space-y-3 flex-1">
                <button onClick={() => { setGoalType('race'); setStep(1); }} className="w-full p-4 rounded-xl bg-bg-secondary border border-bg-tertiary text-left active:scale-[0.98] transition-transform hover:border-accent/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏁</span>
                    <div>
                      <p className="text-[13px] font-bold text-white">Race Goal</p>
                      <p className="text-[11px] text-zinc-500">Target a distance + time by a date</p>
                    </div>
                  </div>
                </button>

                <button onClick={() => { setGoalType('pace'); setStep(1); }} className="w-full p-4 rounded-xl bg-bg-secondary border border-bg-tertiary text-left active:scale-[0.98] transition-transform hover:border-accent/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="text-[13px] font-bold text-white">Pace Goal</p>
                      <p className="text-[11px] text-zinc-500">Hit a target pace for a specific distance</p>
                    </div>
                  </div>
                </button>

                <button onClick={() => { setGoalType('volume'); setStep(1); }} className="w-full p-4 rounded-xl bg-bg-secondary border border-bg-tertiary text-left active:scale-[0.98] transition-transform hover:border-accent/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="text-[13px] font-bold text-white">Volume Goal</p>
                      <p className="text-[11px] text-zinc-500">Run X km per week or month</p>
                    </div>
                  </div>
                </button>
              </div>

              <button onClick={() => navigate('/dashboard')} className="mt-4 py-3 text-[12px] text-zinc-600 text-center">
                Skip for now
              </button>
            </motion.div>
          )}

          {/* Step 1: Configure goal */}
          {step === 1 && (
            <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col px-1">
              {(goalType === 'race' || goalType === 'pace') && (
                <>
                  <h1 className="text-[22px] font-bold text-white mb-2">Pick your distance</h1>
                  <p className="text-[12px] text-zinc-500 mb-6">{goalType === 'race' ? 'What race distance are you targeting?' : 'What distance do you want to get faster at?'}</p>

                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {DISTANCES.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setDistance(d.value)}
                        className={`py-3 px-2 rounded-xl text-center transition-all ${
                          distance === d.value
                            ? 'bg-accent text-white border border-accent'
                            : 'bg-bg-secondary border border-bg-tertiary text-zinc-400 hover:border-accent/30'
                        }`}
                      >
                        <span className="text-[12px] font-bold">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {goalType === 'volume' && (
                <>
                  <h1 className="text-[22px] font-bold text-white mb-2">How much do you want to run?</h1>
                  <p className="text-[12px] text-zinc-500 mb-6">Set a volume target for consistency.</p>

                  <div className="flex gap-3 mb-4">
                    <input
                      type="number"
                      value={volumeKm}
                      onChange={e => setVolumeKm(e.target.value)}
                      placeholder="km"
                      className="flex-1 px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-[14px] outline-none focus:border-accent/40"
                    />
                    <div className="flex rounded-xl overflow-hidden border border-bg-tertiary">
                      <button onClick={() => setVolumePeriod('week')} className={`px-4 py-3 text-[11px] font-bold ${volumePeriod === 'week' ? 'bg-accent text-white' : 'bg-bg-secondary text-zinc-500'}`}>Week</button>
                      <button onClick={() => setVolumePeriod('month')} className={`px-4 py-3 text-[11px] font-bold ${volumePeriod === 'month' ? 'bg-accent text-white' : 'bg-bg-secondary text-zinc-500'}`}>Month</button>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={(goalType !== 'volume' && !distance) || (goalType === 'volume' && !volumeKm)}
                className="mt-auto w-full py-4 rounded-xl bg-accent text-white font-bold text-[14px] disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                Continue
              </button>
              <button onClick={() => setStep(0)} className="mt-2 py-2 text-[12px] text-zinc-600 text-center">Back</button>
            </motion.div>
          )}

          {/* Step 2: Time target + timeline */}
          {step === 2 && (
            <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col px-1">
              {goalType !== 'volume' && (
                <>
                  <h1 className="text-[22px] font-bold text-white mb-2">Target time?</h1>
                  <p className="text-[12px] text-zinc-500 mb-6">Optional — the AI will estimate if you skip this.</p>

                  <div className="flex items-center gap-2 mb-6">
                    <input
                      type="number"
                      value={targetMinutes}
                      onChange={e => setTargetMinutes(e.target.value)}
                      placeholder="min"
                      className="flex-1 px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-center text-[18px] font-mono outline-none focus:border-accent/40"
                    />
                    <span className="text-zinc-500 text-[18px]">:</span>
                    <input
                      type="number"
                      value={targetSeconds}
                      onChange={e => setTargetSeconds(e.target.value)}
                      placeholder="sec"
                      className="flex-1 px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-center text-[18px] font-mono outline-none focus:border-accent/40"
                    />
                  </div>
                </>
              )}

              <h2 className="text-[14px] font-bold text-white mb-3">Timeline</h2>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {TIMELINE_PRESETS.map(t => (
                  <button
                    key={t.weeks}
                    onClick={() => setTargetWeeks(t.weeks)}
                    className={`py-3 rounded-xl text-center transition-all ${
                      targetWeeks === t.weeks
                        ? 'bg-accent text-white border border-accent'
                        : 'bg-bg-secondary border border-bg-tertiary text-zinc-400'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{t.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-auto w-full py-4 rounded-xl bg-accent text-white font-bold text-[14px] disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {generating ? 'Generating your plan...' : 'Generate My Plan'}
              </button>
              <button onClick={() => setStep(1)} className="mt-2 py-2 text-[12px] text-zinc-600 text-center">Back</button>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="text-[48px] mb-4"
              >
                🎯
              </motion.div>
              <h1 className="text-[22px] font-bold text-white mb-2">Plan Generated!</h1>
              <p className="text-[12px] text-zinc-500 mb-8 max-w-[260px]">
                Your AI coach built a {targetWeeks}-week plan. Check the Coach tab to see your daily sessions.
              </p>
              <button
                onClick={() => navigate('/coach')}
                className="w-full py-4 rounded-xl bg-accent text-white font-bold text-[14px] active:scale-[0.98] transition-all"
              >
                View My Plan
              </button>
              <button onClick={() => navigate('/dashboard')} className="mt-3 py-2 text-[12px] text-zinc-600">
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
