import { useState, ComponentType, SVGProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SSAura } from '../components/ss/SSAura';
import {
  Pin, ArrowLeft, Coffee, Leaf, Shoe, Flame, Dumbbell, Trophy, Check, Target, Bolt,
  Medal, Crown, Flag, Heart, Wind, CommunityOutline, Chart, Spark,
} from '../components/ss/icons';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

type SsIcon = ComponentType<SVGProps<SVGSVGElement>>;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-Binary' },
];

const FITNESS_OPTIONS: { value: string; label: string; Icon: SsIcon }[] = [
  { value: 'sedentary', label: 'Sedentary', Icon: Coffee },
  { value: 'lightly_active', label: 'Light', Icon: Leaf },
  { value: 'active', label: 'Active', Icon: Shoe },
  { value: 'very_active', label: 'Very Active', Icon: Flame },
];

const EXPERIENCE_OPTIONS: { value: string; label: string; Icon: SsIcon }[] = [
  { value: 'none', label: 'Brand New', Icon: Leaf },
  { value: 'beginner', label: 'Beginner', Icon: Shoe },
  { value: 'intermediate', label: 'Regular', Icon: Dumbbell },
  { value: 'advanced', label: 'Experienced', Icon: Trophy },
];

const INJURY_OPTIONS = [
  { value: 'knee', label: 'Knee' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'hip', label: 'Hip' },
  { value: 'back', label: 'Back' },
  { value: 'shin', label: 'Shin' },
  { value: 'none', label: 'None' },
];

const DREAM_RACES: { value: string; label: string; Icon: SsIcon }[] = [
  { value: '5k', label: '5K', Icon: Target },
  { value: '10k', label: '10K', Icon: Bolt },
  { value: 'half_marathon', label: 'Half Marathon', Icon: Medal },
  { value: 'marathon', label: 'Marathon', Icon: Trophy },
  { value: 'ultra', label: 'Ultra', Icon: Crown },
  { value: 'no_race', label: 'No race goal', Icon: Leaf },
];

const WHY_OPTIONS: { value: string; label: string; Icon: SsIcon }[] = [
  { value: 'compete', label: 'Race & compete', Icon: Flag },
  { value: 'health', label: 'Get healthier', Icon: Heart },
  { value: 'mental', label: 'Mental clarity', Icon: Wind },
  { value: 'social', label: 'Meet people', Icon: CommunityOutline },
  { value: 'weight', label: 'Lose weight', Icon: Chart },
  { value: 'fun', label: 'Pure fun', Icon: Spark },
];

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (5-8am)' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening (6-9pm)' },
  { value: 'flexible', label: 'Whenever works' },
];

const BAD_RUN_OPTIONS: { value: string; label: string; Icon: SsIcon }[] = [
  { value: 'push_harder', label: 'Push harder next time', Icon: Flame },
  { value: 'analyze', label: 'Analyze what went wrong', Icon: Chart },
  { value: 'rest', label: 'Take extra rest', Icon: Leaf },
  { value: 'forget', label: 'Shake it off, move on', Icon: Wind },
];

const KENDU_COACHES: Record<string, { name: string; title: string; vibe: string }> = {
  'The Scientist': { name: 'The Scientist', title: 'The Scientist', vibe: 'Data-driven. Logical. Optimizes everything.' },
  'The Energizer': { name: 'The Energizer', title: 'The Energizer', vibe: 'Fun. Lively. Gets you moving.' },
  'The Warrior': { name: 'The Warrior', title: 'The Warrior', vibe: 'No excuses. Discipline. Mental toughness.' },
  'The Sage': { name: 'The Sage', title: 'The Sage', vibe: 'Patient. Wise. Trusts the process.' },
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

/* ---------- shared style atoms ---------- */
const eyebrowStyle: React.CSSProperties = {
  font: '700 var(--lbl) var(--body)', textTransform: 'uppercase',
  letterSpacing: 'var(--trk-sm)', color: 'var(--accent-2)', margin: '0 0 8px',
};
const h2Style: React.CSSProperties = { font: '600 22px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', lineHeight: 1.15, margin: 0 };
const subStyle: React.CSSProperties = { font: '400 12px var(--body)', color: 'var(--muted)', margin: '5px 0 0', lineHeight: 1.5 };
const fieldLabel: React.CSSProperties = {
  display: 'block', font: '600 var(--lbl) var(--body)', textTransform: 'uppercase',
  letterSpacing: 'var(--trk-sm)', color: 'var(--muted)', marginBottom: 8,
};
const monoInput: React.CSSProperties = {
  width: '100%', padding: '13px 12px', borderRadius: 13, textAlign: 'center',
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '700 18px var(--mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--fg)', outline: 'none',
};

// Selectable option cell on the tile recipe (accent border = selected; no hue fill)
function OptionCell({ on, onClick, Icon, label, row, big }: {
  on: boolean; onClick: () => void; Icon?: SsIcon; label: string; row?: boolean; big?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`tile ${on ? '' : 'recess'}`}
      aria-pressed={on}
      style={{
        flexDirection: row ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: row ? 'flex-start' : 'center',
        gap: row ? 10 : 6,
        padding: row ? (big ? '15px 14px' : '11px 13px') : '12px 4px',
        cursor: 'pointer',
        textAlign: row ? 'left' : 'center',
        borderColor: on ? 'rgba(249,115,22,.4)' : undefined,
        width: '100%',
      }}
    >
      {Icon && <Icon width={row ? 16 : 15} height={row ? 16 : 15} style={{ color: on ? 'var(--accent-2)' : 'var(--muted-2)', flex: 'none' }} />}
      <span style={{ font: `600 ${big ? '13.5px' : '11px'} var(--body)`, color: on ? 'var(--fg)' : 'var(--muted-2)', whiteSpace: row ? 'normal' : 'nowrap' }}>
        {label}
      </span>
    </button>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  // Global CSS strips the native range track (bg-transparent), so draw our own
  // recess rail + accent fill behind the input.
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.1)' }} />
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 4, borderRadius: 2, background: 'linear-gradient(90deg,var(--accent),var(--accent-2))' }} />
        <input
          type="range" min={min} max={max} value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{ position: 'relative', width: '100%', margin: 0 }}
        />
      </div>
    </div>
  );
}

// Full-screen onboarding shell on the ss system — aura field, no app chrome/nav
function OnboardShell({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="ss-screen" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }} aria-label={label}>
      <SSAura />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

export function AIProfilingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
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
    // Explicit payload — the closure-captured `data` missed same-tick updates
    // (the "skip 5K time" button set state and submitted in one tick, sending
    // the stale value).
    mutationFn: (payload: typeof data) => api.post('/profiling/generate', payload),
    onSuccess: (res) => {
      // Refresh the dashboard AND the auth user — ProtectedRoute gates the
      // whole app on user.profiling_complete, so it must flip before the user
      // leaves this wizard or they'd be bounced right back here.
      queryClient.invalidateQueries({ queryKey: ['dashboard-batch'] });
      refreshUser();
      setTimeout(() => {
        setDna(res.data);
        setAnalyzing(false);
        setStep(totalSteps);
      }, 2500);
    },
    // Without this the spinner spins forever on any server/DB error, trapping
    // every brand-new user. Clear it so the retry screen below can show.
    onError: () => setAnalyzing(false),
  });

  const handleNext = (overrides?: Partial<typeof data>) => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setAnalyzing(true);
      mutation.mutate({ ...data, ...overrides });
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

  if (mutation.isError && !analyzing) {
    return (
      <OnboardShell label="Profiling error">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px' }}>
          <span style={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(251,191,36,.13)', border: '1px solid rgba(251,191,36,.26)', marginBottom: 14 }}>
            <Flag width={20} height={20} style={{ color: 'var(--amber)' }} />
          </span>
          <h2 style={{ font: '600 18px var(--head)', color: 'var(--fg)', margin: 0 }}>Couldn't build your profile</h2>
          <p style={{ font: '400 12.5px var(--body)', color: 'var(--muted)', marginTop: 8, maxWidth: 280, lineHeight: 1.5 }}>
            Something went wrong analyzing your answers. Your responses are saved — try again.
          </p>
          <button
            className="ss-btn ss-btn-primary"
            style={{ height: 46, fontSize: 13.5, padding: '0 24px', flex: 'none', marginTop: 20 }}
            onClick={() => { setAnalyzing(true); mutation.mutate(data); }}
          >
            Try again
          </button>
        </div>
      </OnboardShell>
    );
  }

  if (analyzing) {
    return (
      <OnboardShell label="Analyzing your running DNA">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(249,115,22,.3)', borderTopColor: 'var(--accent)' }}
            />
            <div>
              <h2 style={{ font: '600 20px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>Analyzing your running DNA</h2>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ font: '400 13px var(--body)', color: 'var(--muted)', marginTop: 8 }}
              >
                Calculating VO2max, matching your Kendu coach...
              </motion.p>
            </div>
          </motion.div>
        </div>
      </OnboardShell>
    );
  }

  return (
    <OnboardShell label="AI profiling">
      {/* Top bar: back + step dots */}
      <div style={{ padding: '18px 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 12px var(--body)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <ArrowLeft width={14} height={14} />
              Back
            </button>
          ) : <div />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                style={{
                  height: 6, borderRadius: 3, transition: 'all .3s var(--ease)',
                  width: i === step ? 18 : 6,
                  background: i === step
                    ? 'linear-gradient(90deg,var(--accent),var(--accent-2))'
                    : i < step ? 'rgba(249,115,22,.4)' : 'rgba(255,255,255,.12)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '10px 20px 16px', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            {/* STEP 0: Connect Tracking App */}
            {step === 0 && (
              <>
                <motion.div variants={fadeUp}>
                  <p style={eyebrowStyle}>First things first</p>
                  <h2 style={h2Style}>Track your runs</h2>
                  <p style={subStyle}>Real data = smarter AI coach. You can skip this and track runs later.</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  {/* Informational only — must NOT navigate away mid-profiling
                      (that would abandon the flow and lose progress). The GPS
                      tracker is available from the app after onboarding. */}
                  <div className="tile" style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: '15px 14px', borderColor: 'rgba(249,115,22,.3)' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 11, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(249,115,22,.16)', border: '1px solid rgba(249,115,22,.3)' }}>
                      <Pin width={17} height={17} style={{ color: 'var(--accent-2)' }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', font: '600 13.5px var(--body)', color: 'var(--accent-2)' }}>GPS Run Tracker</span>
                      <span style={{ display: 'block', font: '400 11px var(--body)', color: 'var(--muted-2)', marginTop: 2 }}>
                        Track runs with your phone's GPS — available after setup
                      </span>
                    </span>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div className="tile recess" style={{ padding: '12px 14px' }}>
                    <p style={{ font: '400 11.5px var(--body)', color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>
                      <span style={{ font: '700 11.5px var(--body)', color: 'var(--accent-2)' }}>Why connect?</span>{' '}
                      Your AI uses real run data for accurate VO2max, pace zones, and training plans. No data? No problem — we'll estimate from your answers.
                    </p>
                  </div>
                </motion.div>
              </>
            )}

            {/* STEP 1: Physical Profile */}
            {step === 1 && (
              <>
                <motion.div variants={fadeUp}>
                  <p style={eyebrowStyle}>Step 1 of {totalSteps}</p>
                  <h2 style={h2Style}>Your body profile</h2>
                  <p style={subStyle}>Helps calculate accurate pace zones & VO2max</p>
                </motion.div>
                <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
                  {GENDER_OPTIONS.map(o => (
                    <OptionCell
                      key={o.value}
                      on={data.gender === o.value}
                      onClick={() => setData(d => ({ ...d, gender: o.value }))}
                      label={o.label}
                    />
                  ))}
                </motion.div>
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Slider label={`Age: ${data.age}`} value={data.age} min={13} max={80} onChange={(n) => setData(d => ({ ...d, age: n }))} />
                  <Slider label={`Height: ${data.height_cm} cm`} value={data.height_cm} min={120} max={220} onChange={(n) => setData(d => ({ ...d, height_cm: n }))} />
                  <Slider label={`Weight: ${data.weight_kg} kg`} value={data.weight_kg} min={35} max={150} onChange={(n) => setData(d => ({ ...d, weight_kg: n }))} />
                </motion.div>
              </>
            )}

            {/* STEP 2: Running Background */}
            {step === 2 && (
              <>
                <motion.div variants={fadeUp}>
                  <p style={eyebrowStyle}>Step 2 of {totalSteps}</p>
                  <h2 style={h2Style}>Running background</h2>
                  <p style={subStyle}>Where you are right now</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p style={fieldLabel}>Activity Level</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 7 }}>
                    {FITNESS_OPTIONS.map(o => (
                      <OptionCell
                        key={o.value}
                        on={data.fitness_level === o.value}
                        onClick={() => setData(d => ({ ...d, fitness_level: o.value }))}
                        Icon={o.Icon}
                        label={o.label}
                      />
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p style={fieldLabel}>Running Experience</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 7 }}>
                    {EXPERIENCE_OPTIONS.map(o => (
                      <OptionCell
                        key={o.value}
                        on={data.running_experience === o.value}
                        onClick={() => setData(d => ({ ...d, running_experience: o.value }))}
                        Icon={o.Icon}
                        label={o.label}
                      />
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p style={fieldLabel}>Any injuries? (tap all that apply)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 7 }}>
                    {INJURY_OPTIONS.map(o => (
                      <OptionCell
                        key={o.value}
                        on={data.injury_history.includes(o.value)}
                        onClick={() => {
                          if (o.value === 'none') {
                            setData(d => ({ ...d, injury_history: ['none'] }));
                          } else {
                            const current = data.injury_history.filter(i => i !== 'none');
                            const updated = current.includes(o.value) ? current.filter(i => i !== o.value) : [...current, o.value];
                            setData(d => ({ ...d, injury_history: updated }));
                          }
                        }}
                        Icon={o.value === 'none' ? Check : undefined}
                        label={o.label}
                        row
                      />
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Slider label={`Weekly running (approx): ${data.weekly_km} km`} value={data.weekly_km} min={0} max={100} onChange={(n) => setData(d => ({ ...d, weekly_km: n }))} />
                </motion.div>
              </>
            )}

            {/* STEP 3: Dream Race */}
            {step === 3 && (
              <>
                <motion.div variants={fadeUp}>
                  <p style={eyebrowStyle}>Your goals</p>
                  <h2 style={h2Style}>What's your dream race?</h2>
                  <p style={subStyle}>This shapes your entire training path</p>
                </motion.div>
                <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {DREAM_RACES.map(r => (
                    <OptionCell
                      key={r.value}
                      on={data.dream_race === r.value}
                      onClick={() => setData(d => ({ ...d, dream_race: r.value }))}
                      Icon={r.Icon}
                      label={r.label}
                      row big
                    />
                  ))}
                </motion.div>
              </>
            )}

            {/* STEP 4: Why Run */}
            {step === 4 && (
              <>
                <motion.div variants={fadeUp}>
                  <p style={eyebrowStyle}>Your motivation</p>
                  <h2 style={h2Style}>Why do you run?</h2>
                  <p style={subStyle}>This determines how your Kendu coach talks to you</p>
                </motion.div>
                <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {WHY_OPTIONS.map(o => (
                    <OptionCell
                      key={o.value}
                      on={data.running_why === o.value}
                      onClick={() => setData(d => ({ ...d, running_why: o.value }))}
                      Icon={o.Icon}
                      label={o.label}
                      row big
                    />
                  ))}
                </motion.div>
              </>
            )}

            {/* STEP 5: Schedule */}
            {step === 5 && (
              <>
                <motion.div variants={fadeUp}>
                  <p style={eyebrowStyle}>Your schedule</p>
                  <h2 style={h2Style}>When do you prefer to run?</h2>
                </motion.div>
                <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TIME_OPTIONS.map(o => (
                    <OptionCell
                      key={o.value}
                      on={data.preferred_time === o.value}
                      onClick={() => setData(d => ({ ...d, preferred_time: o.value }))}
                      label={o.label}
                      row big
                    />
                  ))}
                </motion.div>
                <motion.div variants={fadeUp}>
                  <p style={fieldLabel}>Days per week you can train</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[2, 3, 4, 5, 6].map(d => {
                      const on = data.training_days === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setData(prev => ({ ...prev, training_days: d }))}
                          className={`tile ${on ? '' : 'recess'}`}
                          aria-pressed={on}
                          style={{ flex: 1, alignItems: 'center', padding: '13px 0', cursor: 'pointer', borderColor: on ? 'rgba(249,115,22,.4)' : undefined }}
                        >
                          <span className="num" style={{ font: '700 16px var(--mono)', color: on ? 'var(--accent-2)' : 'var(--muted)' }}>{d}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}

            {/* STEP 6: Mindset */}
            {step === 6 && (
              <>
                <motion.div variants={fadeUp}>
                  <p style={eyebrowStyle}>Your mindset</p>
                  <h2 style={h2Style}>After a bad run, you usually...</h2>
                  <p style={subStyle}>This matches you to your Kendu coach</p>
                </motion.div>
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {BAD_RUN_OPTIONS.map(o => (
                    <OptionCell
                      key={o.value}
                      on={data.bad_run_response === o.value}
                      onClick={() => setData(d => ({ ...d, bad_run_response: o.value }))}
                      Icon={o.Icon}
                      label={o.label}
                      row big
                    />
                  ))}
                </motion.div>
              </>
            )}

            {/* STEP 7: Optional 5K Time */}
            {step === 7 && (
              <>
                <motion.div variants={fadeUp}>
                  <p style={eyebrowStyle}>Almost done</p>
                  <h2 style={h2Style}>Know your recent 5K time?</h2>
                  <p style={subStyle}>Optional — dramatically improves accuracy</p>
                </motion.div>
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Minutes</label>
                      <input
                        type="number"
                        placeholder="25"
                        min={12} max={60}
                        onChange={(e) => {
                          const min = parseInt(e.target.value) || 0;
                          const currentSec = (data.recent_5k_time || 0) % 60;
                          setData(d => ({ ...d, recent_5k_time: min * 60 + currentSec }));
                        }}
                        style={monoInput}
                      />
                    </div>
                    <span className="num" style={{ font: '700 18px var(--mono)', color: 'var(--muted-2)', paddingBottom: 14 }}>:</span>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Seconds</label>
                      <input
                        type="number"
                        placeholder="00"
                        min={0} max={59}
                        onChange={(e) => {
                          const sec = parseInt(e.target.value) || 0;
                          const currentMin = Math.floor((data.recent_5k_time || 0) / 60);
                          setData(d => ({ ...d, recent_5k_time: currentMin * 60 + sec }));
                        }}
                        style={monoInput}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => { setData(d => ({ ...d, recent_5k_time: null })); handleNext({ recent_5k_time: null }); }}
                    style={{ font: '600 12px var(--body)', color: 'var(--muted-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}
                  >
                    Skip — I don't know my 5K time
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ padding: '14px 20px 32px' }}>
        <button
          className="ss-btn ss-btn-primary"
          style={{ height: 50, fontSize: 15, width: '100%' }}
          onClick={() => handleNext()}
          disabled={!canProceed()}
        >
          {step === totalSteps - 1 ? 'Reveal My Running DNA' : 'Continue'}
        </button>
      </div>
    </OnboardShell>
  );
}

function DNAReveal({ dna, onContinue }: { dna: any; onContinue: () => void }) {
  const coach = KENDU_COACHES[dna.ai_coach_name] || KENDU_COACHES['The Scientist'];
  const tierColor = dna.tier === 'advanced' ? 'var(--amber)' : dna.tier === 'intermediate' ? 'var(--accent-2)' : 'var(--green)';

  const secLabel: React.CSSProperties = {
    font: '600 var(--lbl) var(--body)', textTransform: 'uppercase',
    letterSpacing: 'var(--trk-sm)', color: 'var(--muted)', margin: '0 0 9px',
  };

  return (
    <OnboardShell label="Your running DNA">
      <div style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '24px 20px 40px', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Header */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center' }}>
            <p style={{ font: '700 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: '.2em', color: 'var(--accent-2)', margin: '0 0 8px' }}>
              Your Running DNA
            </p>
            <h1 style={{ font: '600 28px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>{coach.name}</h1>
            <p style={{ font: '400 13px var(--body)', color: 'var(--muted)', marginTop: 5 }}>{coach.title} — {coach.vibe}</p>
          </motion.div>

          {/* VO2max + Tier */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="tile" style={{ alignItems: 'center', padding: '18px 16px', textAlign: 'center', borderColor: 'rgba(249,115,22,.25)' }}
          >
            <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', margin: 0 }}>
              Estimated VO2max
            </p>
            <p className="num" style={{ font: '700 40px var(--mono)', color: 'var(--fg)', margin: '4px 0 0', lineHeight: 1 }}>
              {dna.estimated_vo2max ?? '--'}
            </p>
            <p style={{ font: '400 12px var(--body)', color: 'var(--muted)', marginTop: 7 }}>
              Classification:{' '}
              <span style={{ font: '600 12px var(--body)', color: tierColor }}>
                {dna.tier ? dna.tier.charAt(0).toUpperCase() + dna.tier.slice(1) : 'Beginner'} Runner
              </span>
            </p>
          </motion.div>

          {/* Pace Zones */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="tile" style={{ padding: '14px 15px' }}>
            <h3 style={secLabel}>Your Pace Zones</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {[
                { label: 'Easy', pace: dna.pace_zones?.easy, color: 'var(--green)' },
                { label: 'Tempo', pace: dna.pace_zones?.tempo, color: 'var(--amber)' },
                { label: 'Interval', pace: dna.pace_zones?.interval, color: 'var(--accent-2)' },
                { label: 'Race', pace: dna.pace_zones?.race, color: 'var(--fg)' },
              ].map(z => (
                <div key={z.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '9px 11px', borderRadius: 11, background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)' }}>
                  <span style={{ font: '500 11px var(--body)', color: 'var(--muted-2)' }}>{z.label}</span>
                  <span className="num" style={{ font: '700 14px var(--mono)', color: z.color }}>
                    {z.pace || '--'}<span style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>/km</span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Personality Tags */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
            <h3 style={secLabel}>Your Runner Identity</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {(dna.personality_tags || []).map((tag: string) => (
                <span key={tag} className="ss-tag now">{tag}</span>
              ))}
            </div>
          </motion.div>

          {/* Strengths & Focus */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="tile recess" style={{ gap: 7, padding: '12px 13px' }}>
              <h4 style={{ ...secLabel, color: 'var(--green)', margin: 0 }}>Strengths</h4>
              {(dna.strengths || []).map((s: string) => (
                <p key={s} style={{ font: '400 11px var(--body)', color: 'var(--muted)', display: 'flex', gap: 6, margin: 0, lineHeight: 1.45 }}>
                  <span style={{ color: 'var(--green)', flex: 'none' }}>+</span> {s}
                </p>
              ))}
            </div>
            <div className="tile recess" style={{ gap: 7, padding: '12px 13px' }}>
              <h4 style={{ ...secLabel, color: 'var(--amber)', margin: 0 }}>Focus Areas</h4>
              {(dna.focus_areas || []).map((f: string) => (
                <p key={f} style={{ font: '400 11px var(--body)', color: 'var(--muted)', display: 'flex', gap: 6, margin: 0, lineHeight: 1.45 }}>
                  <span style={{ color: 'var(--amber)', flex: 'none' }}>&rsaquo;</span> {f}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Week 1 Preview */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="tile" style={{ gap: 7, padding: '14px 15px' }}>
            <h3 style={{ ...secLabel, margin: 0 }}>Week 1 Preview</h3>
            <p style={{ font: '400 13px var(--body)', color: 'var(--fg)', lineHeight: 1.55, margin: 0 }}>{dna.first_week_preview}</p>
            <p className="num" style={{ font: '500 11px var(--mono)', color: 'var(--muted-2)', margin: 0 }}>
              {dna.training_days} days/week · ~{dna.weekly_volume_km}km total
            </p>
          </motion.div>

          {/* Motivational from coach */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} style={{ textAlign: 'center', padding: '0 16px' }}>
            <p style={{ font: 'italic 400 13px var(--body)', color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>
              "{dna.motivational_message}"
            </p>
            <p style={{ font: '600 11px var(--body)', color: 'var(--accent-2)', marginTop: 8 }}>— {coach.name}</p>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }}>
            <button
              className="ss-btn ss-btn-primary"
              style={{ height: 50, fontSize: 15, width: '100%' }}
              onClick={onContinue}
            >
              Start Training with {coach.name}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </OnboardShell>
  );
}
