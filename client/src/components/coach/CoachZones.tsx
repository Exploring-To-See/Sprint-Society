// AI Coach · Zones — personalized HR zones. Data from heartrate.routes.ts
// (GET /heartrate/zones, GET /heartrate/trends). The 5-color HR-zone palette appears ONLY
// inside the chart bars (§27); every card surface is neutral glass, metrics are mono.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../../lib/api';
import { SSSkeleton, SSEmpty, SSError } from '../ss/SSStates';
import { Pulse, Bolt } from '../ss/icons';

interface Zone { zone: number; name: string; min_bpm: number; max_bpm: number; feel?: string; training_effect?: string }
interface Profile { source?: string; tip?: string; max_hr?: number; hr_reserve?: number; lactate_threshold_hr?: number; zones?: Zone[] }
interface Trends { summary?: { message?: string; improvement_percent?: number }; trends?: unknown[] }
interface LtTest { has_test?: boolean; message?: string; lt_pace?: number; lt_heartrate?: number; test_date?: string; days_since?: number; stale?: boolean; stale_message?: string | null }

function paceToSec(mmss: string): number | null {
  const m = mmss.match(/^(\d{1,2}):([0-5]?\d)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}
function fmtPaceSec(s?: number): string {
  if (!s) return '—';
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}

const ZONE_PALETTE = ['#60A5FA', '#34D399', '#FBBF24', '#FB923C', '#F87171'];

export function CoachZones() {
  const reduce = useReducedMotion();
  const { data: profile, isLoading, isError, refetch } = useQuery<Profile>({ queryKey: ['hr-zones'], queryFn: () => api.get('/heartrate/zones').then((r) => r.data) });
  const { data: trends } = useQuery<Trends | null>({ queryKey: ['hr-trends'], queryFn: () => api.get('/heartrate/trends').then((r) => r.data).catch(() => null) });

  const qc = useQueryClient();
  const lt = useQuery<LtTest | null>({ queryKey: ['lt-test'], queryFn: () => api.get('/training/lt-test').then((r) => r.data).catch(() => null) });
  const [ltPace, setLtPace] = useState('');
  const [ltMin, setLtMin] = useState(20);
  const [ltHr, setLtHr] = useState('');
  const [ltOpen, setLtOpen] = useState(false);
  const saveLt = useMutation({
    mutationFn: () => api.post('/training/lt-test', { avg_pace_per_km: paceToSec(ltPace), duration_seconds: ltMin * 60, avg_heartrate: ltHr ? Number(ltHr) : undefined }),
    onSuccess: () => { setLtOpen(false); setLtPace(''); setLtHr(''); qc.invalidateQueries({ queryKey: ['lt-test'] }); },
  });

  if (isLoading) {
    return (
      <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SSSkeleton height={72} style={{ borderRadius: 18 }} />
        {[0, 1, 2, 3, 4].map((i) => <SSSkeleton key={i} height={78} style={{ borderRadius: 18 }} />)}
      </div>
    );
  }
  if (isError) return <div className="ss-pad"><SSError onRetry={() => refetch()} testid="coach-zones-error" /></div>;
  if (!profile?.zones?.length) {
    return (
      <div className="ss-pad">
        <SSEmpty icon={<Pulse width={22} height={22} />} title="Heart-rate zones unlock with HR data" body="Record a run with a heart-rate strap or watch and your five personalized zones will be computed here." testid="coach-zones-empty" />
      </div>
    );
  }

  return (
    <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* key metrics */}
      <div style={{ display: 'flex', gap: 11 }} className="ss-rise">
        <KeyStat k="Max HR" v={profile.max_hr} />
        <KeyStat k="HR Reserve" v={profile.hr_reserve} />
        <KeyStat k="LT HR" v={profile.lactate_threshold_hr} accent />
      </div>
      {profile.tip && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: profile.source === 'activity_based' ? 'var(--green)' : 'var(--amber)', flex: 'none' }} aria-hidden="true" />
          <p style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>{profile.tip}</p>
        </div>
      )}

      {/* zone cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {profile.zones.map((z, i) => {
          const color = ZONE_PALETTE[i] || ZONE_PALETTE[4];
          const reserve = profile.hr_reserve || 1;
          const widthPct = Math.min(((z.max_bpm - z.min_bpm) / reserve) * 200, 100);
          return (
            <motion.div
              key={z.zone}
              className="ss-surface ss-recess"
              style={{ borderRadius: 16, padding: 13 }}
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.06, type: 'spring', stiffness: 240, damping: 26 }}
              data-testid={`coach-zone-${z.zone}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: 'none' }} aria-hidden="true" />
                  <span style={{ font: '600 9.5px var(--mono)', color: 'var(--muted-2)' }}>Z{z.zone}</span>
                  <span style={{ font: '600 13px var(--head)', color: 'var(--fg)' }}>{z.name}</span>
                </div>
                <span style={{ font: '600 12px var(--mono)', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{z.min_bpm}–{z.max_bpm}<span style={{ color: 'var(--muted-2)' }}> bpm</span></span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,.06)', overflow: 'hidden', marginBottom: 9 }}>
                <motion.div style={{ height: '100%', borderRadius: 3, background: color }} initial={{ width: reduce ? `${widthPct}%` : 0 }} animate={{ width: `${widthPct}%` }} transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
              </div>
              {z.feel && <p style={{ font: '400 11.5px/1.45 var(--body)', color: 'var(--muted)' }}>{z.feel}</p>}
              {z.training_effect && <p style={{ font: '500 10px var(--body)', color: 'var(--muted-2)', marginTop: 3 }}>{z.training_effect}</p>}
            </motion.div>
          );
        })}
      </div>

      {trends?.summary && (
        <section className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 13 }} data-testid="coach-zones-trend">
          <p className="tlbl" style={{ marginBottom: 6 }}>Cardiac efficiency</p>
          <p style={{ font: '600 13px var(--head)', color: 'var(--fg)' }}>{trends.summary.message}</p>
          {!!trends.summary.improvement_percent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span className={`ss-dchip ${trends.summary.improvement_percent > 0 ? 'good' : 'warn'}`}>{trends.summary.improvement_percent > 0 ? '▲' : '▼'} {Math.abs(trends.summary.improvement_percent)}%</span>
              {trends.trends && <span style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>over {trends.trends.length} runs</span>}
            </div>
          )}
        </section>
      )}

      {/* LACTATE THRESHOLD */}
      <section className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="Lactate threshold" data-testid="coach-lt-test">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ticon" style={{ width: 30, height: 30, borderRadius: 10, color: 'var(--accent-2)' }}><Bolt width={15} height={15} /></span>
          <div style={{ flex: 1 }}>
            <h3 style={{ font: '600 14px var(--head)', color: 'var(--fg)' }}>Lactate threshold</h3>
            <p style={{ font: '500 10.5px var(--mono)', color: 'var(--muted-2)' }}>20-min field test</p>
          </div>
          {lt.data?.stale && <span className="ss-dchip warn">Stale</span>}
        </div>

        {lt.data?.has_test ? (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="sstat" style={{ flex: 1 }}><div className="v">{fmtPaceSec(lt.data.lt_pace)}<small>/km</small></div><div className="k">LT pace</div></div>
              {lt.data.lt_heartrate != null && (
                <div className="sstat" style={{ flex: 1 }}><div className="v">{lt.data.lt_heartrate}<small>bpm</small></div><div className="k">LT HR</div></div>
              )}
            </div>
            {lt.data.stale_message && <p style={{ font: '400 11.5px/1.4 var(--body)', color: 'var(--amber)' }}>{lt.data.stale_message}</p>}
          </>
        ) : (
          <p style={{ font: '400 12px/1.5 var(--body)', color: 'var(--muted)' }}>{lt.data?.message || 'Run an all-out 20-min effort, then log your average pace to set threshold paces.'}</p>
        )}

        {ltOpen ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ss-input" value={ltPace} onChange={(e) => setLtPace(e.target.value)} placeholder="Avg pace m:ss" aria-label="Average pace per km" data-testid="lt-pace" />
              <input className="ss-input" value={ltHr} onChange={(e) => setLtHr(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="Avg HR" aria-label="Average heart rate" style={{ maxWidth: 110 }} data-testid="lt-hr" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="tlbl">Duration</span>
                <span style={{ font: '700 13px var(--mono)', color: 'var(--fg)' }}>{ltMin}<span style={{ color: 'var(--muted-2)' }}> min</span></span>
              </div>
              <input type="range" min={15} max={25} step={1} value={ltMin} onChange={(e) => setLtMin(Number(e.target.value))} aria-label="Test duration minutes" style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ss-btn ss-btn-soft" style={{ height: 42, flex: 'none', padding: '0 16px' }} onClick={() => setLtOpen(false)}>Cancel</button>
              <button className="ss-btn ss-btn-primary" style={{ height: 42, flex: 1 }} disabled={!paceToSec(ltPace) || saveLt.isPending} onClick={() => saveLt.mutate()} data-testid="lt-save">
                {saveLt.isPending ? 'Saving…' : 'Save test'}
              </button>
            </div>
            {!paceToSec(ltPace) && ltPace.length > 0 && <p style={{ font: '500 10.5px var(--body)', color: 'var(--amber)' }}>Pace format m:ss (e.g. 4:45)</p>}
            {saveLt.isError && <p style={{ font: '500 11px var(--body)', color: 'var(--amber)' }}>Couldn’t save. Pace + 15–25 min duration required.</p>}
          </div>
        ) : (
          <button className="ss-btn ss-btn-soft" style={{ height: 40 }} onClick={() => setLtOpen(true)} data-testid="lt-open">{lt.data?.has_test ? 'Log new test' : 'Log a test'}</button>
        )}
      </section>
    </div>
  );
}

function KeyStat({ k, v, accent }: { k: string; v?: number; accent?: boolean }) {
  return (
    <div className="ss-surface ss-recess" style={{ flex: 1, borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
      <p className="tlbl" style={{ marginBottom: 5 }}>{k}</p>
      <p style={{ font: '700 18px var(--mono)', color: accent ? 'var(--accent-2)' : 'var(--fg)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{v ?? '—'}</p>
      <p style={{ font: '500 9px var(--mono)', color: 'var(--muted-2)', marginTop: 3 }}>bpm</p>
    </div>
  );
}
