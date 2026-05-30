import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', icon: '♂️' },
  { value: 'female', label: 'Female', icon: '♀️' },
  { value: 'non-binary', label: 'Non-Binary', icon: '⚧️' },
];

const FITNESS_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', icon: '🛋️' },
  { value: 'lightly_active', label: 'Light', icon: '🚶' },
  { value: 'active', label: 'Active', icon: '🏃' },
  { value: 'very_active', label: 'Very Active', icon: '🔥' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'Brand New', icon: '🌱' },
  { value: 'beginner', label: 'Beginner', icon: '👟' },
  { value: 'intermediate', label: 'Regular', icon: '💪' },
  { value: 'advanced', label: 'Experienced', icon: '🏆' },
];

const INJURY_OPTIONS = [
  { value: 'knee', label: 'Knee', icon: '🦵' },
  { value: 'ankle', label: 'Ankle', icon: '🦶' },
  { value: 'hip', label: 'Hip', icon: '🫁' },
  { value: 'back', label: 'Back', icon: '🔙' },
  { value: 'shin', label: 'Shin', icon: '🦴' },
  { value: 'none', label: 'None', icon: '✅' },
];

const DREAM_RACES = [
  { value: '5k', label: '5K', icon: '🎯' },
  { value: '10k', label: '10K', icon: '⚡' },
  { value: 'half_marathon', label: 'Half Marathon', icon: '🏅' },
  { value: 'marathon', label: 'Marathon', icon: '🏆' },
  { value: 'ultra', label: 'Ultra', icon: '🦸' },
  { value: 'no_race', label: 'No race goal', icon: '🌱' },
];

const WHY_OPTIONS = [
  { value: 'compete', label: 'Race & compete', icon: '🏁' },
  { value: 'health', label: 'Get healthier', icon: '💚' },
  { value: 'mental', label: 'Mental clarity', icon: '🧠' },
  { value: 'social', label: 'Meet people', icon: '👥' },
  { value: 'weight', label: 'Lose weight', icon: '⚖️' },
  { value: 'fun', label: 'Pure fun', icon: '🎉' },
];

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (5-8am)', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { value: 'evening', label: 'Evening (6-9pm)', icon: '🌆' },
  { value: 'flexible', label: 'Whenever works', icon: '🔄' },
];

const BAD_RUN_OPTIONS = [
  { value: 'push_harder', label: 'Push harder next time', icon: '🔥' },
  { value: 'analyze', label: 'Analyze what went wrong', icon: '📊' },
  { value: 'rest', label: 'Take extra rest', icon: '🧘' },
  { value: 'forget', label: 'Shake it off, move on', icon: '💨' },
];

const KENDU_COACHES: Record<string, { name: string; title: string; vibe: string; gradient: string }> = {
  'The Scientist': { name: 'The Scientist', title: 'The Scientist', vibe: 'Data-driven. Logical. Optimizes everything.', gradient: 'from-blue-500/20 to-cyan-500/20' },
  'The Energizer': { name: 'The Energizer', title: 'The Energizer', vibe: 'Fun. Lively. Gets you moving.', gradient: 'from-pink-500/20 to-rose-500/20' },
  'The Warrior': { name: 'The Warrior', title: 'The Warrior', vibe: 'No excuses. Discipline. Mental toughness.', gradient: 'from-red-500/20 to-orange-500/20' },
  'The Sage': { name: 'The Sage', title: 'The Sage', vibe: 'Patient. Wise. Trusts the process.', gradient: 'from-emerald-500/20 to-teal-500/20' },
};

interface ProfilingData {
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  fitness_level: string;
  running_experience: string;
  injury_history: string[];
  weekly_km: number;
  dream_race: string;
  running_why: string;
  preferred_time: string;
  training_days: number;
  bad_run_response: string;
  recent_5k_time: number | null;
}

export function AIProfilingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProfilingData>({
    gender: '', age: 28, height_cm: 170, weight_kg: 70,
    fitness_level: '', running_experience: '', injury_history: [], weekly_km: 10,
    dream_race: '', running_why: '', preferred_time: '', training_days: 3,
    bad_run_response: '', recent_5k_time: null,
  });
  const [dna, setDna] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const totalSteps = 8;

  const mutation = useMutation({
    mutationFn: () => api.post('/profiling/generate', data),
    onSuccess: (res) => {
      setTimeout(() => {
        setDna(res.data);
        setAnalyzing(false);
        setStep(totalSteps);
      }, 2500);
    },
  });

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setAnalyzing(true);
      mutation.mutate();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // GPS tracker connect is optional
      case 1: return data.gender;
      case 2: return data.fitness_level && data.running_experience;
      case 3: return data.dream_race;
      case 4: return data.running_why;
      case 5: return data.preferred_time && data.training_days > 0;
      case 6: return data.bad_run_response;
      case 7: return true;
      default: return false;
    }
  };

  if (dna) {
    return <DNAReveal dna={dna} onContinue={() => navigate('/set-goal')} />;
  }

  if (analyzing) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="w-16 h-16 mx-auto rounded-full border-2 border-accent/30 border-t-accent"
          />
          <div className="space-y-2">
            <h2 className="font-heading text-[20px] font-bold text-white">Analyzing your running DNA</h2>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[13px] text-zinc-500"
            >
              Calculating VO2max, matching your Kendu coach...
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors active:scale-95">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[12px] font-medium">Back</span>
            </button>
          ) : <div />}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-[6px] rounded-full transition-all duration-300 ${
                i === step ? 'w-5 bg-accent' : i < step ? 'w-[6px] bg-accent/40' : 'w-[6px] bg-bg-tertiary'
              }`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
            className="space-y-5"
          >
            {/* STEP 0: Connect Tracking App */}
            {step === 0 && (
              <>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">First things first</p>
                  <h2 className="font-heading text-[22px] font-bold leading-tight">Track your runs</h2>
                  <p className="text-zinc-500 text-[12px] mt-1">Real data = smarter AI coach. You can skip this and track runs later.</p>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-3 pt-2">
                  <a
                    href="/run/track"
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-accent/30 bg-accent/10 hover:border-accent/50 transition-all active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <span className="text-accent font-bold text-[14px]">📍</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[14px] font-semibold text-accent">GPS Run Tracker</p>
                      <p className="text-[11px] text-zinc-500">Track runs with your phone's GPS</p>
                    </div>
                  </a>
                </motion.div>
                <motion.div variants={fadeUp} className="pt-2">
                  <div className="rounded-xl bg-accent/5 border border-accent/10 p-3">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      <span className="text-accent font-semibold">Why connect?</span> Your AI uses real run data for accurate VO2max, pace zones, and training plans. No data? No problem — we'll estimate from your answers.
                    </p>
                  </div>
                </motion.div>
              </>
            )}

            {/* STEP 1: Physical Profile */}
            {step === 1 && (
              <>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">Step 1 of {totalSteps}</p>
                  <h2 className="font-heading text-[22px] font-bold leading-tight">Your body profile</h2>
                  <p className="text-zinc-500 text-[12px] mt-1">Helps calculate accurate pace zones & VO2max</p>
                </motion.div>
                <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setData(d => ({ ...d, gender: o.value }))}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border transition-all active:scale-[0.97] ${
                        data.gender === o.value
                          ? 'bg-accent/10 border-accent/40 text-white'
                          : 'bg-bg-secondary border-bg-tertiary text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">{o.icon}</span>
                      <span className="text-[11px] font-medium">{o.label}</span>
                    </button>
                  ))}
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-4">
                  <div>
                    <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2 block">Age: {data.age}</label>
                    <input
                      type="range" min={13} max={80} value={data.age}
                      onChange={(e) => setData(d => ({ ...d, age: parseInt(e.target.value) }))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2 block">Height: {data.height_cm} cm</label>
                    <input
                      type="range" min={120} max={220} value={data.height_cm}
                      onChange={(e) => setData(d => ({ ...d, height_cm: parseInt(e.target.value) }))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2 block">Weight: {data.weight_kg} kg</label>
                    <input
                      type="range" min={35} max={150} value={data.weight_kg}
                      onChange={(e) => setData(d => ({ ...d, weight_kg: parseInt(e.target.value) }))}
                      className="w-full accent-accent"
                    />
                  </div>
                </motion.div>
              </>
            )}

            {/* STEP 2: Running Background */}
            {step === 2 && (
              <>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">Step 2 of {totalSteps}</p>
                  <h2 className="font-heading text-[22px] font-bold leading-tight">Running background</h2>
                  <p className="text-zinc-500 text-[12px] mt-1">Where you are right now</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] text-zinc-500 mb-2">Activity Level</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {FITNESS_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => setData(d => ({ ...d, fitness_level: o.value }))}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border transition-all active:scale-[0.97] ${
                          data.fitness_level === o.value
                            ? 'bg-accent/10 border-accent/40 text-white'
                            : 'bg-bg-secondary border-bg-tertiary text-zinc-400'
                        }`}
                      >
                        <span className="text-base">{o.icon}</span>
                        <span className="text-[11px] font-medium">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] text-zinc-500 mb-2">Running Experience</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {EXPERIENCE_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => setData(d => ({ ...d, running_experience: o.value }))}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border transition-all active:scale-[0.97] ${
                          data.running_experience === o.value
                            ? 'bg-accent/10 border-accent/40 text-white'
                            : 'bg-bg-secondary border-bg-tertiary text-zinc-400'
                        }`}
                      >
                        <span className="text-base">{o.icon}</span>
                        <span className="text-[11px] font-medium">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] text-zinc-500 mb-2">Any injuries? (tap all that apply)</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {INJURY_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => {
                          if (o.value === 'none') {
                            setData(d => ({ ...d, injury_history: ['none'] }));
                          } else {
                            const current = data.injury_history.filter(i => i !== 'none');
                            const updated = current.includes(o.value) ? current.filter(i => i !== o.value) : [...current, o.value];
                            setData(d => ({ ...d, injury_history: updated }));
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all active:scale-[0.97] ${
                          data.injury_history.includes(o.value)
                            ? 'bg-accent/10 border-accent/40 text-white'
                            : 'bg-bg-secondary border-bg-tertiary text-zinc-400'
                        }`}
                      >
                        <span className="text-sm">{o.icon}</span>
                        <span className="text-[10px] font-medium">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2 block">Weekly running (approx): {data.weekly_km} km</label>
                  <input
                    type="range" min={0} max={100} value={data.weekly_km}
                    onChange={(e) => setData(d => ({ ...d, weekly_km: parseInt(e.target.value) }))}
                    className="w-full accent-accent"
                  />
                </motion.div>
              </>
            )}

            {/* STEP 3: Dream Race */}
            {step === 3 && (
              <>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">Your goals</p>
                  <h2 className="font-heading text-[22px] font-bold leading-tight">What's your dream race?</h2>
                  <p className="text-zinc-500 text-[12px] mt-1">This shapes your entire training path</p>
                </motion.div>
                <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
                  {DREAM_RACES.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setData(d => ({ ...d, dream_race: r.value }))}
                      className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl border transition-all active:scale-[0.97] ${
                        data.dream_race === r.value
                          ? 'bg-accent/10 border-accent/40 text-white'
                          : 'bg-bg-secondary border-bg-tertiary text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-[13px] font-medium">{r.label}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}

            {/* STEP 4: Why Run */}
            {step === 4 && (
              <>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">Your motivation</p>
                  <h2 className="font-heading text-[22px] font-bold leading-tight">Why do you run?</h2>
                  <p className="text-zinc-500 text-[12px] mt-1">This determines how your Kendu coach talks to you</p>
                </motion.div>
                <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
                  {WHY_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setData(d => ({ ...d, running_why: o.value }))}
                      className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl border transition-all active:scale-[0.97] ${
                        data.running_why === o.value
                          ? 'bg-accent/10 border-accent/40 text-white'
                          : 'bg-bg-secondary border-bg-tertiary text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">{o.icon}</span>
                      <span className="text-[13px] font-medium">{o.label}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}

            {/* STEP 5: Schedule */}
            {step === 5 && (
              <>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">Your schedule</p>
                  <h2 className="font-heading text-[22px] font-bold leading-tight">When do you prefer to run?</h2>
                </motion.div>
                <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setData(d => ({ ...d, preferred_time: o.value }))}
                      className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl border transition-all active:scale-[0.97] ${
                        data.preferred_time === o.value
                          ? 'bg-accent/10 border-accent/40 text-white'
                          : 'bg-bg-secondary border-bg-tertiary text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">{o.icon}</span>
                      <span className="text-[12px] font-medium">{o.label}</span>
                    </button>
                  ))}
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p className="text-[12px] text-zinc-400 mb-3">Days per week you can train:</p>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map(d => (
                      <button
                        key={d}
                        onClick={() => setData(prev => ({ ...prev, training_days: d }))}
                        className={`flex-1 py-3 rounded-xl border text-center font-mono font-bold text-[16px] transition-all active:scale-95 ${
                          data.training_days === d
                            ? 'bg-accent/10 border-accent/40 text-accent'
                            : 'bg-bg-secondary border-bg-tertiary text-zinc-500'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            {/* STEP 6: Mindset */}
            {step === 6 && (
              <>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">Your mindset</p>
                  <h2 className="font-heading text-[22px] font-bold leading-tight">After a bad run, you usually...</h2>
                  <p className="text-zinc-500 text-[12px] mt-1">This matches you to your Kendu coach</p>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2">
                  {BAD_RUN_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setData(d => ({ ...d, bad_run_response: o.value }))}
                      className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border transition-all active:scale-[0.98] ${
                        data.bad_run_response === o.value
                          ? 'bg-accent/10 border-accent/40 text-white'
                          : 'bg-bg-secondary border-bg-tertiary text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-xl">{o.icon}</span>
                      <span className="text-[14px] font-medium">{o.label}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}

            {/* STEP 7: Optional 5K Time */}
            {step === 7 && (
              <>
                <motion.div variants={fadeUp}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">Almost done</p>
                  <h2 className="font-heading text-[22px] font-bold leading-tight">Know your recent 5K time?</h2>
                  <p className="text-zinc-500 text-[12px] mt-1">Optional — dramatically improves accuracy</p>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1 block">Minutes</label>
                      <input
                        type="number"
                        placeholder="25"
                        min={12} max={60}
                        onChange={(e) => {
                          const min = parseInt(e.target.value) || 0;
                          const currentSec = (data.recent_5k_time || 0) % 60;
                          setData(d => ({ ...d, recent_5k_time: min * 60 + currentSec }));
                        }}
                        className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-center font-mono text-[18px] placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end pb-3 text-zinc-600 text-xl font-mono">:</div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1 block">Seconds</label>
                      <input
                        type="number"
                        placeholder="00"
                        min={0} max={59}
                        onChange={(e) => {
                          const sec = parseInt(e.target.value) || 0;
                          const currentMin = Math.floor((data.recent_5k_time || 0) / 60);
                          setData(d => ({ ...d, recent_5k_time: currentMin * 60 + sec }));
                        }}
                        className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white text-center font-mono text-[18px] placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => { setData(d => ({ ...d, recent_5k_time: null })); handleNext(); }}
                    className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Skip — I don't know my 5K time
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 pb-8 pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-[15px] disabled:opacity-30 active:scale-[0.98] transition-all"
        >
          {step === totalSteps - 1 ? 'Reveal My Running DNA' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function DNAReveal({ dna, onContinue }: { dna: any; onContinue: () => void }) {
  const coach = KENDU_COACHES[dna.ai_coach_name] || KENDU_COACHES['The Scientist'];

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-lg mx-auto px-5 pt-6 pb-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
          {/* Header */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-2">Your Running DNA</p>
            <h1 className="font-heading text-[28px] font-bold">{coach.name}</h1>
            <p className="text-zinc-400 text-[13px] mt-1">{coach.title} — {coach.vibe}</p>
          </motion.div>

          {/* VO2max + Tier */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className={`rounded-2xl bg-gradient-to-b ${coach.gradient} border border-accent/20 p-5 text-center`}
          >
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Estimated VO2max</p>
            <p className="font-mono text-[40px] font-bold text-white">{dna.estimated_vo2max}</p>
            <p className="text-[12px] text-zinc-400 mt-1">
              Classification: <span className={`font-semibold ${
                dna.tier === 'advanced' ? 'text-accent-gold' : dna.tier === 'intermediate' ? 'text-accent' : 'text-accent-green'
              }`}>{dna.tier.charAt(0).toUpperCase() + dna.tier.slice(1)} Runner</span>
            </p>
          </motion.div>

          {/* Pace Zones */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            className="card p-4 space-y-3"
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Your Pace Zones</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Easy', pace: dna.pace_zones.easy, color: 'text-emerald-400' },
                { label: 'Tempo', pace: dna.pace_zones.tempo, color: 'text-amber-400' },
                { label: 'Interval', pace: dna.pace_zones.interval, color: 'text-red-400' },
                { label: 'Race', pace: dna.pace_zones.race, color: 'text-accent' },
              ].map(z => (
                <div key={z.label} className="flex items-baseline justify-between px-3 py-2.5 rounded-lg bg-bg-primary border border-bg-tertiary">
                  <span className="text-[11px] text-zinc-500">{z.label}</span>
                  <span className={`font-mono font-bold text-[15px] ${z.color}`}>{z.pace}<span className="text-[11px] text-zinc-600">/km</span></span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Personality Tags */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Your Runner Identity</h3>
            <div className="flex flex-wrap gap-2">
              {dna.personality_tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Strengths & Focus */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="card p-3 space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Strengths</h4>
              {dna.strengths.map((s: string) => (
                <p key={s} className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span className="text-emerald-400">+</span> {s}
                </p>
              ))}
            </div>
            <div className="card p-3 space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Focus Areas</h4>
              {dna.focus_areas.map((f: string) => (
                <p key={f} className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span className="text-amber-400">→</span> {f}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Week 1 Preview */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
            className="card p-4 space-y-2"
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Week 1 Preview</h3>
            <p className="text-[13px] text-zinc-300 leading-relaxed">{dna.first_week_preview}</p>
            <p className="text-[11px] text-zinc-600">{dna.training_days} days/week · ~{dna.weekly_volume_km}km total</p>
          </motion.div>

          {/* Motivational from coach */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}
            className="text-center px-4"
          >
            <p className="text-[13px] text-zinc-400 italic leading-relaxed">"{dna.motivational_message}"</p>
            <p className="text-[11px] text-accent mt-2 font-semibold">— {coach.name}</p>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }}>
            <button
              onClick={onContinue}
              className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-[15px] active:scale-[0.98] transition-all"
            >
              Start Training with {coach.name}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
