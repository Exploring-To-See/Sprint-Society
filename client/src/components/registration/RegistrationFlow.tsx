import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { TapGrid } from '../ui/TapGrid';
import { Slider } from '../ui/Slider';

interface FormData {
  name: string;
  email: string;
  password: string;
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  fitness_level: string;
  running_experience: string;
  injury_history: string[];
}

const INITIAL: FormData = {
  name: '', email: '', password: '',
  gender: '', age: 28, height_cm: 170, weight_kg: 70,
  fitness_level: '', running_experience: '',
  injury_history: [],
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
  { value: 'none', label: 'New', icon: '🌱' },
  { value: 'beginner', label: 'Beginner', icon: '👟' },
  { value: 'intermediate', label: 'Regular', icon: '💪' },
  { value: 'advanced', label: 'Pro', icon: '🏆' },
];

const INJURY_OPTIONS = [
  { value: 'knee', label: 'Knee', icon: '🦵' },
  { value: 'ankle', label: 'Ankle', icon: '🦶' },
  { value: 'hip', label: 'Hip', icon: '🫁' },
  { value: 'back', label: 'Back', icon: '🔙' },
  { value: 'shin', label: 'Shin', icon: '🦴' },
  { value: 'none', label: 'None', icon: '✅' },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15 } },
};

export function RegistrationFlow() {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const update = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.name && form.email && form.password;
      case 1: return form.gender;
      case 2: return form.fitness_level && form.running_experience;
      case 3: return true;
      default: return false;
    }
  };

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const injuries = form.injury_history.filter(i => i !== 'none');
      await register({ ...form, injury_history: injuries });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
              ← Back
            </button>
          )}
          <span className="text-zinc-600 text-xs ml-auto">{step + 1}/{totalSteps}</span>
        </div>
        <div className="h-1 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-5 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stagger}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
            className="space-y-6"
          >
            {step === 0 && (
              <>
                <motion.div variants={fadeUp}>
                  <h2 className="font-heading text-2xl font-bold mb-1">Join the Sprint Society</h2>
                  <p className="text-zinc-500 text-sm">Quick setup — takes 15 seconds</p>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                    autoFocus
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Password (6+ chars)"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                  />
                </motion.div>
              </>
            )}

            {step === 1 && (
              <>
                <motion.div variants={fadeUp}>
                  <h2 className="font-heading text-2xl font-bold mb-1">About you</h2>
                  <p className="text-zinc-500 text-sm">Helps us calculate your ideal pace</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <TapGrid options={GENDER_OPTIONS} selected={form.gender} onSelect={(v) => update('gender', v)} columns={3} />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Slider label="Age" value={form.age} onChange={(v) => update('age', v)} min={13} max={80} unit="yrs" />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Slider label="Height" value={form.height_cm} onChange={(v) => update('height_cm', v)} min={120} max={220} unit="cm" />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Slider label="Weight" value={form.weight_kg} onChange={(v) => update('weight_kg', v)} min={35} max={150} unit="kg" />
                </motion.div>
              </>
            )}

            {step === 2 && (
              <>
                <motion.div variants={fadeUp}>
                  <h2 className="font-heading text-2xl font-bold mb-1">Your fitness</h2>
                  <p className="text-zinc-500 text-sm">Current activity level</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p className="label mb-2">Activity Level</p>
                  <TapGrid options={FITNESS_OPTIONS} selected={form.fitness_level} onSelect={(v) => update('fitness_level', v)} columns={4} />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p className="label mb-2">Running Experience</p>
                  <TapGrid options={EXPERIENCE_OPTIONS} selected={form.running_experience} onSelect={(v) => update('running_experience', v)} columns={4} />
                </motion.div>
              </>
            )}

            {step === 3 && (
              <>
                <motion.div variants={fadeUp}>
                  <h2 className="font-heading text-2xl font-bold mb-1">Any injuries?</h2>
                  <p className="text-zinc-500 text-sm">Select all that apply (or skip)</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <TapGrid
                    options={INJURY_OPTIONS}
                    selected={form.injury_history}
                    onSelect={(v) => {
                      if (v === 'none') {
                        update('injury_history', ['none']);
                      } else {
                        const current = form.injury_history.filter(i => i !== 'none');
                        const updated = current.includes(v) ? current.filter(i => i !== v) : [...current, v];
                        update('injury_history', updated);
                      }
                    }}
                    columns={3}
                    multi
                  />
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center px-5 mb-2">{error}</p>
      )}

      <div className="px-5 pb-8 pt-4">
        <Button
          onClick={next}
          disabled={!canProceed() || submitting}
          fullWidth
          size="lg"
        >
          {submitting ? 'Creating account...' : step === totalSteps - 1 ? "Let's go" : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
