// AI Coach · Zones — personalized HR zones. Data from heartrate.routes.ts
// (GET /heartrate/zones, GET /heartrate/trends). The 5-color HR-zone palette appears ONLY
// inside the chart bars (§27); every card surface is neutral glass, metrics are mono.
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../../lib/api';
import { SSSkeleton, SSEmpty, SSError } from '../ss/SSStates';
import { Pulse } from '../ss/icons';

interface Zone { zone: number; name: string; min_bpm: number; max_bpm: number; feel?: string; training_effect?: string }
interface Profile { source?: string; tip?: string; max_hr?: number; hr_reserve?: number; lactate_threshold_hr?: number; zones?: Zone[] }
interface Trends { summary?: { message?: string; improvement_percent?: number }; trends?: unknown[] }

const ZONE_PALETTE = ['#60A5FA', '#34D399', '#FBBF24', '#FB923C', '#F87171'];

export function CoachZones() {
  const reduce = useReducedMotion();
  const { data: profile, isLoading, isError, refetch } = useQuery<Profile>({ queryKey: ['hr-zones'], queryFn: () => api.get('/heartrate/zones').then((r) => r.data) });
  const { data: trends } = useQuery<Trends | null>({ queryKey: ['hr-trends'], queryFn: () => api.get('/heartrate/trends').then((r) => r.data).catch(() => null) });

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
