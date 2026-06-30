// AI Coach · Recovery — daily wellness log + 7-day trend + HRV. Data from wellness.routes.ts
// (GET /wellness/today /week /recovery-factor, POST /wellness/log) and heartrate.routes.ts
// (GET /heartrate/hrv/trend, POST /heartrate/hrv). Logging is tap-first (steppers + 1–5 grids),
// minimal typing. Recovery factor is the centerpiece; every surface is neutral glass.
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../../lib/api';
import { Gauge } from '../ss/Gauge';
import { SSSkeleton, SSError } from '../ss/SSStates';
import { Leaf, Pulse, Check } from '../ss/icons';

interface WellnessToday {
  logged?: boolean; date?: string; sleep_hours?: number; stress_level?: number; energy_level?: number; notes?: string;
}
interface WellnessWeek { avg_sleep?: number; avg_stress?: number; days_logged?: number; sleep_debt?: number; logs?: unknown[] }
interface RecoveryFactor { factor?: number; adjustment?: string; message?: string }
interface HrvTrend {
  has_data?: boolean; message?: string; baseline_30day?: number | null;
  trend?: { date: string; rmssd: number }[]; recovery_status?: 'recovered' | 'normal' | 'fatigued' | 'warning';
  recovery_factor?: number; recommendation?: string;
}

const STATUS_TONE: Record<string, { color: string; label: string }> = {
  recovered: { color: 'var(--green)', label: 'Recovered' },
  normal: { color: 'var(--accent-2)', label: 'Normal' },
  fatigued: { color: 'var(--amber)', label: 'Fatigued' },
  warning: { color: 'var(--amber)', label: 'Warning' },
};

export function CoachRecovery() {
  const qc = useQueryClient();
  const reduce = useReducedMotion();

  const today = useQuery<WellnessToday>({ queryKey: ['wellness-today'], queryFn: () => api.get('/wellness/today').then((r) => r.data) });
  const week = useQuery<WellnessWeek>({ queryKey: ['wellness-week'], queryFn: () => api.get('/wellness/week').then((r) => r.data).catch(() => null) });
  const recovery = useQuery<RecoveryFactor>({ queryKey: ['recovery-factor'], queryFn: () => api.get('/wellness/recovery-factor').then((r) => r.data).catch(() => null) });
  const hrv = useQuery<HrvTrend>({ queryKey: ['hrv-trend'], queryFn: () => api.get('/heartrate/hrv/trend').then((r) => r.data).catch(() => null) });

  const logged = today.data?.logged !== false && (today.data?.sleep_hours != null || today.data?.stress_level != null);

  // local form state, seeded from today's log when present
  const [sleep, setSleep] = useState(7.5);
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (today.data && logged) {
      if (today.data.sleep_hours != null) setSleep(today.data.sleep_hours);
      if (today.data.stress_level != null) setStress(today.data.stress_level);
      if (today.data.energy_level != null) setEnergy(today.data.energy_level);
      if (today.data.notes) setNotes(today.data.notes);
    }
  }, [today.data, logged]);

  const saveWellness = useMutation({
    mutationFn: () => api.post('/wellness/log', { sleep_hours: sleep, stress_level: stress, energy_level: energy, notes: notes || undefined }),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['wellness-today'] });
      qc.invalidateQueries({ queryKey: ['wellness-week'] });
      qc.invalidateQueries({ queryKey: ['recovery-factor'] });
    },
  });

  const [rmssd, setRmssd] = useState('');
  const saveHrv = useMutation({
    mutationFn: () => api.post('/heartrate/hrv', { rmssd: Number(rmssd), source: 'manual' }),
    onSuccess: () => { setRmssd(''); qc.invalidateQueries({ queryKey: ['hrv-trend'] }); },
  });

  if (today.isLoading) {
    return (
      <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SSSkeleton height={150} style={{ borderRadius: 22 }} />
        <SSSkeleton height={190} style={{ borderRadius: 18 }} />
        <SSSkeleton height={120} style={{ borderRadius: 18 }} />
      </div>
    );
  }
  if (today.isError) return <div className="ss-pad"><SSError onRetry={() => today.refetch()} testid="coach-recovery-error" /></div>;

  const rf = recovery.data?.factor;
  const rfScore = rf != null ? Math.round(rf * 100) : undefined;
  const showForm = !logged || editing;

  return (
    <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* RECOVERY FACTOR — centerpiece */}
      <section className="ss-surface ss-hero ss-rise" style={{ borderRadius: 22, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }} aria-label="Recovery factor" data-testid="coach-recovery-factor">
        <Gauge
          value={rfScore ?? 0}
          display={rfScore != null ? String(rfScore) : '—'}
          caption="Recovery"
          variant="live"
          ariaLabel={`Recovery factor ${rfScore ?? 'unknown'}`}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="slbl" style={{ marginBottom: 4 }}>Today’s recovery</div>
          <div style={{ font: '500 14px/1.3 var(--head)', color: '#fff' }}>
            {recovery.data?.message || 'Log your sleep and stress to personalize today’s training.'}
          </div>
          {recovery.data?.adjustment && recovery.data.adjustment !== 'none' && (
            <span className="ss-dchip warn" style={{ marginTop: 8, display: 'inline-block' }}>Load adjust · {recovery.data.adjustment}</span>
          )}
        </div>
      </section>

      {/* WELLNESS — logged summary or the log form */}
      {!showForm ? (
        <section className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 14 }} data-testid="coach-recovery-logged">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ss-tag go"><Check width={9} height={9} /> Logged today</span>
            </div>
            <button className="ss-btn ss-btn-soft" style={{ height: 32, padding: '0 14px', font: '600 11.5px var(--head)' }} onClick={() => setEditing(true)} data-testid="coach-recovery-edit">Edit</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Stat k="Sleep" v={today.data?.sleep_hours != null ? `${today.data.sleep_hours}` : '—'} unit="h" />
            <Stat k="Stress" v={today.data?.stress_level != null ? `${today.data.stress_level}` : '—'} unit="/5" />
            <Stat k="Energy" v={today.data?.energy_level != null ? `${today.data.energy_level}` : '—'} unit="/5" />
          </div>
          {today.data?.notes && <p style={{ font: '400 12px/1.5 var(--body)', color: 'var(--muted)', marginTop: 10 }}>{today.data.notes}</p>}
        </section>
      ) : (
        <section className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }} data-testid="coach-recovery-form">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ticon" style={{ width: 30, height: 30, borderRadius: 10, color: 'var(--green)' }}><Leaf width={15} height={15} /></span>
            <h3 style={{ font: '600 15px var(--head)', color: 'var(--fg)' }}>How are you today?</h3>
          </div>

          {/* sleep stepper */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span className="tlbl">Sleep</span>
              <span style={{ font: '700 13px var(--mono)', color: 'var(--fg)' }}>{sleep.toFixed(1)}<span style={{ color: 'var(--muted-2)' }}> h</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Stepper onClick={() => setSleep((s) => Math.max(0, Math.round((s - 0.5) * 2) / 2))} label="−" />
              <input type="range" min={0} max={12} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} aria-label="Hours of sleep" style={{ flex: 1, accentColor: 'var(--accent)' }} data-testid="recovery-sleep" />
              <Stepper onClick={() => setSleep((s) => Math.min(12, Math.round((s + 0.5) * 2) / 2))} label="+" />
            </div>
          </div>

          <Scale label="Stress" value={stress} onChange={setStress} lowLabel="Calm" highLabel="Tense" testid="recovery-stress" />
          <Scale label="Energy" value={energy} onChange={setEnergy} lowLabel="Drained" highLabel="Charged" testid="recovery-energy" />

          <input className="ss-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" aria-label="Wellness notes" maxLength={280} data-testid="recovery-notes" />

          <div style={{ display: 'flex', gap: 8 }}>
            {logged && <button className="ss-btn ss-btn-soft" style={{ height: 44, flex: 'none', padding: '0 18px' }} onClick={() => setEditing(false)}>Cancel</button>}
            <button className="ss-btn ss-btn-primary" style={{ height: 44, flex: 1 }} onClick={() => saveWellness.mutate()} disabled={saveWellness.isPending} data-testid="recovery-save">
              {saveWellness.isPending ? 'Saving…' : logged ? 'Update' : 'Log today'}
            </button>
          </div>
          {saveWellness.isError && <p style={{ font: '500 11px var(--body)', color: 'var(--amber)' }}>Couldn’t save. Try again.</p>}
        </section>
      )}

      {/* 7-DAY WELLNESS */}
      {week.data && (week.data.days_logged ?? 0) > 0 && (
        <section className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 13 }} data-testid="coach-recovery-week">
          <p className="tlbl" style={{ marginBottom: 9 }}>Last 7 days</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Stat k="Avg sleep" v={week.data.avg_sleep != null ? `${week.data.avg_sleep}` : '—'} unit="h" />
            <Stat k="Avg stress" v={week.data.avg_stress != null ? `${week.data.avg_stress}` : '—'} unit="/5" />
            <Stat k="Logged" v={`${week.data.days_logged}`} unit="d" />
            {!!week.data.sleep_debt && <Stat k="Sleep debt" v={`${week.data.sleep_debt}`} unit="h" tone="warn" />}
          </div>
        </section>
      )}

      {/* HRV */}
      <section className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="Heart-rate variability" data-testid="coach-recovery-hrv">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ticon" style={{ width: 30, height: 30, borderRadius: 10, color: 'var(--accent-2)' }}><Pulse width={15} height={15} /></span>
          <div style={{ flex: 1 }}>
            <h3 style={{ font: '600 14px var(--head)', color: 'var(--fg)' }}>Morning HRV</h3>
            <p style={{ font: '500 10.5px var(--mono)', color: 'var(--muted-2)' }}>rMSSD · recovery signal</p>
          </div>
          {hrv.data?.has_data && hrv.data.recovery_status && (
            <span className="ss-dchip" style={{ color: STATUS_TONE[hrv.data.recovery_status]?.color }}>
              {STATUS_TONE[hrv.data.recovery_status]?.label}
            </span>
          )}
        </div>

        {hrv.data?.has_data ? (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <Stat k="Latest" v={hrv.data.trend?.length ? `${hrv.data.trend[hrv.data.trend.length - 1].rmssd}` : '—'} unit="ms" />
              <Stat k="Baseline" v={hrv.data.baseline_30day != null ? `${hrv.data.baseline_30day}` : '—'} unit="ms" />
            </div>
            {hrv.data.trend && hrv.data.trend.length > 1 && <HrvSpark points={hrv.data.trend} reduce={!!reduce} />}
            {hrv.data.recommendation && <p style={{ font: '400 12px/1.5 var(--body)', color: 'var(--muted)' }}>{hrv.data.recommendation}</p>}
          </>
        ) : (
          <p style={{ font: '400 12px/1.5 var(--body)', color: 'var(--muted)' }}>{hrv.data?.message || 'Log your morning HRV to track recovery vs your baseline.'}</p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input className="ss-input" value={rmssd} onChange={(e) => setRmssd(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="rMSSD (5–200 ms)" aria-label="HRV rMSSD" data-testid="recovery-hrv-input" />
          <button className="ss-btn ss-btn-soft" style={{ flex: 'none', height: 48, padding: '0 18px' }} onClick={() => saveHrv.mutate()} disabled={saveHrv.isPending || !rmssd || Number(rmssd) < 5 || Number(rmssd) > 200} data-testid="recovery-hrv-save">
            {saveHrv.isPending ? '…' : 'Log'}
          </button>
        </div>
        {saveHrv.isError && <p style={{ font: '500 11px var(--body)', color: 'var(--amber)' }}>Couldn’t log HRV. rMSSD must be 5–200.</p>}
      </section>
    </div>
  );
}

function Stat({ k, v, unit, tone }: { k: string; v: string; unit?: string; tone?: 'warn' }) {
  return (
    <div className="sstat" style={{ flex: 1 }}>
      <div className="v" style={tone === 'warn' ? { color: 'var(--amber)' } : undefined}>{v}{unit && <small>{unit}</small>}</div>
      <div className="k">{k}</div>
    </div>
  );
}

function Stepper({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label === '+' ? 'increase' : 'decrease'} className="ss-surface" style={{ width: 36, height: 36, borderRadius: 11, font: '600 18px var(--head)', color: 'var(--fg)', flex: 'none' }}>{label}</button>
  );
}

function Scale({ label, value, onChange, lowLabel, highLabel, testid }: { label: string; value: number; onChange: (v: number) => void; lowLabel: string; highLabel: string; testid: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span className="tlbl">{label}</span>
        <span style={{ font: '600 10px var(--mono)', color: 'var(--muted-2)' }}>{lowLabel} → {highLabel}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }} role="group" aria-label={label} data-testid={testid}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-pressed={on}
              className={`ss-segtab${on ? ' on' : ''}`}
              style={{ flex: 1, height: 40, borderRadius: 11, font: '700 14px var(--mono)', position: 'relative' }}
            >
              {on && <span className="ss-segpill" style={{ position: 'absolute', inset: 0 }} />}
              <span style={{ position: 'relative', zIndex: 1, color: on ? 'var(--fg)' : 'var(--muted)' }}>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HrvSpark({ points, reduce }: { points: { date: string; rmssd: number }[]; reduce: boolean }) {
  const vals = points.map((p) => p.rmssd);
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const coords = vals.map((v, i) => [(i / (vals.length - 1)) * 300, 4 + (1 - (v - min) / span) * 38] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height="46" viewBox="0 0 300 46" preserveAspectRatio="none" style={{ display: 'block' }} aria-hidden="true">
      <motion.path d={line} fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }} />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="3" fill="var(--accent-2)" />
    </svg>
  );
}
