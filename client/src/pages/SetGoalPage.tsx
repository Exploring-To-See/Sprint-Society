import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSeg } from '../components/ss/SSSeg';
import { Flag, Bolt, Bars, Target, ChevronRight } from '../components/ss/icons';

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
  { weeks: 4, label: '4 wk' },
  { weeks: 8, label: '8 wk' },
  { weeks: 12, label: '12 wk' },
  { weeks: 16, label: '16 wk' },
];

const GOAL_TYPES: { key: GoalType; Icon: typeof Flag; title: string; sub: string }[] = [
  { key: 'race', Icon: Flag, title: 'Race Goal', sub: 'Target a distance + time by a date' },
  { key: 'pace', Icon: Bolt, title: 'Pace Goal', sub: 'Hit a target pace for a specific distance' },
  { key: 'volume', Icon: Bars, title: 'Volume Goal', sub: 'Run X km per week or month' },
];

const h1Style: React.CSSProperties = { font: '600 22px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: '0 0 6px' };
const subStyle: React.CSSProperties = { font: '400 12px var(--body)', color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 };
const ghostBtn: React.CSSProperties = { font: '600 12px var(--body)', color: 'var(--muted-2)', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', textAlign: 'center' };
const monoInput: React.CSSProperties = {
  flex: 1, minWidth: 0, padding: '13px 12px', borderRadius: 13, textAlign: 'center',
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '700 18px var(--mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--fg)', outline: 'none',
};

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
    <SSScreen hideNav bodyLabel="Set your goal">
      <div className="pad" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', paddingBottom: 24 }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, padding: '14px 0 18px' }}>
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              style={{
                height: 6, borderRadius: 3, transition: 'all .25s var(--ease)',
                width: i <= step ? 18 : 6,
                background: i <= step ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : 'rgba(255,255,255,.14)',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Choose type */}
          {step === 0 && (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h1 style={h1Style}>What's your goal?</h1>
              <p style={subStyle}>Your AI coach builds a personalized plan around this.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {GOAL_TYPES.map(({ key, Icon, title, sub }) => (
                  <button
                    key={key}
                    onClick={() => { setGoalType(key); setStep(1); }}
                    className="tile w-full"
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: '15px 14px', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ width: 38, height: 38, borderRadius: 11, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(249,115,22,.14)', border: '1px solid rgba(249,115,22,.28)' }}>
                      <Icon width={17} height={17} style={{ color: 'var(--accent-2)' }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', font: '600 13.5px var(--body)', color: 'var(--fg)' }}>{title}</span>
                      <span style={{ display: 'block', font: '400 11px var(--body)', color: 'var(--muted-2)', marginTop: 2 }}>{sub}</span>
                    </span>
                    <ChevronRight width={15} height={15} style={{ color: 'var(--muted-2)', flex: 'none' }} />
                  </button>
                ))}
              </div>

              <button onClick={() => navigate('/dashboard')} style={{ ...ghostBtn, marginTop: 14 }}>
                Skip for now
              </button>
            </motion.div>
          )}

          {/* Step 1: Configure goal */}
          {step === 1 && (
            <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {(goalType === 'race' || goalType === 'pace') && (
                <>
                  <h1 style={h1Style}>Pick your distance</h1>
                  <p style={subStyle}>{goalType === 'race' ? 'What race distance are you targeting?' : 'What distance do you want to get faster at?'}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 20 }}>
                    {DISTANCES.map(d => {
                      const on = distance === d.value;
                      return (
                        <button
                          key={d.value}
                          onClick={() => setDistance(d.value)}
                          className={`tile ${on ? '' : 'recess'}`}
                          style={{ alignItems: 'center', padding: '13px 4px', cursor: 'pointer', borderColor: on ? 'rgba(249,115,22,.4)' : undefined }}
                          aria-pressed={on}
                        >
                          <span className="num" style={{ font: '700 12.5px var(--mono)', color: on ? 'var(--accent-2)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                            {d.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {goalType === 'volume' && (
                <>
                  <h1 style={h1Style}>How much do you want to run?</h1>
                  <p style={subStyle}>Set a volume target for consistency.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    <input
                      type="number"
                      value={volumeKm}
                      onChange={e => setVolumeKm(e.target.value)}
                      placeholder="km"
                      style={monoInput}
                    />
                    <SSSeg<'week' | 'month'>
                      items={[{ key: 'week', label: 'Per week' }, { key: 'month', label: 'Per month' }]}
                      value={volumePeriod}
                      onChange={setVolumePeriod}
                      ariaLabel="Volume period"
                      testid="goal-period"
                    />
                  </div>
                </>
              )}

              <button
                className="ss-btn ss-btn-primary"
                style={{ height: 50, fontSize: 14.5, width: '100%', marginTop: 'auto' }}
                onClick={() => setStep(2)}
                disabled={(goalType !== 'volume' && !distance) || (goalType === 'volume' && !volumeKm)}
              >
                Continue
              </button>
              <button onClick={() => setStep(0)} style={{ ...ghostBtn, marginTop: 8 }}>Back</button>
            </motion.div>
          )}

          {/* Step 2: Time target + timeline */}
          {step === 2 && (
            <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {goalType !== 'volume' && (
                <>
                  <h1 style={h1Style}>Target time?</h1>
                  <p style={subStyle}>Optional — the AI will estimate if you skip this.</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <input
                      type="number"
                      value={targetMinutes}
                      onChange={e => setTargetMinutes(e.target.value)}
                      placeholder="min"
                      style={monoInput}
                    />
                    <span className="num" style={{ font: '700 18px var(--mono)', color: 'var(--muted-2)' }}>:</span>
                    <input
                      type="number"
                      value={targetSeconds}
                      onChange={e => setTargetSeconds(e.target.value)}
                      placeholder="sec"
                      style={monoInput}
                    />
                  </div>
                </>
              )}

              <h2 style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted)', margin: '0 0 10px' }}>
                Timeline
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 20 }}>
                {TIMELINE_PRESETS.map(t => {
                  const on = targetWeeks === t.weeks;
                  return (
                    <button
                      key={t.weeks}
                      onClick={() => setTargetWeeks(t.weeks)}
                      className={`tile ${on ? '' : 'recess'}`}
                      style={{ alignItems: 'center', padding: '12px 4px', cursor: 'pointer', borderColor: on ? 'rgba(249,115,22,.4)' : undefined }}
                      aria-pressed={on}
                    >
                      <span className="num" style={{ font: '700 12px var(--mono)', color: on ? 'var(--accent-2)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                className="ss-btn ss-btn-primary"
                style={{ height: 50, fontSize: 14.5, width: '100%', marginTop: 'auto' }}
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating your plan…' : 'Generate My Plan'}
              </button>
              <button onClick={() => setStep(1)} style={{ ...ghostBtn, marginTop: 8 }}>Back</button>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                style={{ width: 62, height: 62, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(249,115,22,.14)', border: '1px solid rgba(249,115,22,.3)', marginBottom: 16 }}
              >
                <Target width={26} height={26} style={{ color: 'var(--accent-2)' }} />
              </motion.span>
              <h1 style={{ ...h1Style, marginBottom: 8 }}>Plan Generated!</h1>
              <p style={{ font: '400 12px var(--body)', color: 'var(--muted)', maxWidth: 260, lineHeight: 1.5, margin: '0 0 26px' }}>
                Your AI coach built a {targetWeeks}-week plan. Check the Coach tab to see your daily sessions.
              </p>
              <button
                className="ss-btn ss-btn-primary"
                style={{ height: 50, fontSize: 14.5, width: '100%' }}
                onClick={() => navigate('/coach', { state: { tab: 'plan' } })}
              >
                View My Plan
              </button>
              <button onClick={() => navigate('/dashboard')} style={{ ...ghostBtn, marginTop: 10 }}>
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SSScreen>
  );
}
