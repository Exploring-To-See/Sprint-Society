import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { SSSkeleton } from '../components/ss/SSStates';
import { Pulse, Spark, ChevronDown } from '../components/ss/icons';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

// Zone palette mirrors CoachZones — semantic color lives ONLY inside the zone bars.
const ZONE_PALETTE = ['#60A5FA', '#34D399', '#FBBF24', '#FB923C', '#F87171'];

function formatPace(seconds: number) {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// --- Per-run detail: HR analysis (GET /heartrate/analysis/:id) ---
// Endpoint returns HTTP 200 + { has_hr: false, error } when the run has no HR data,
// and may 404 (rejected) when the activity isn't found — both render the "no data" state.
interface HRAnalysis {
  has_hr?: boolean;
  error?: string;
  activity_hr_avg?: number;
  activity_hr_max?: number;
  primary_zone?: number;
  target_zone?: number;
  was_in_target?: boolean;
  efficiency_score?: number;
  feedback?: string;
  inferred_session_type?: string;
  zone_distribution?: { zone: number; percent: number; minutes: number }[];
}

function HrAnalysisBlock({ activityId, enabled }: { activityId: number; enabled: boolean }) {
  const { data, isLoading, isError } = useQuery<HRAnalysis>({
    queryKey: ['hr-analysis', activityId],
    queryFn: () => api.get(`/heartrate/analysis/${activityId}`).then((r) => r.data),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const noHr = isError || (data && data.has_hr === false);

  return (
    <section className="ss-surface ss-recess" style={{ borderRadius: 14, padding: 12 }} data-testid="run-hr-analysis">
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={{ display: 'inline-flex', color: 'var(--accent-2)' }}><Pulse width={13} height={13} /></span>
        <span className="tlbl">HR analysis</span>
        {data?.inferred_session_type && !noHr && (
          <span className="ss-dchip neutral" style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>
            {data.inferred_session_type}
          </span>
        )}
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SSSkeleton height={44} style={{ borderRadius: 12 }} />
          <SSSkeleton height={32} style={{ borderRadius: 10 }} />
        </div>
      )}

      {!isLoading && noHr && (
        <p style={{ font: '500 11.5px/1.5 var(--body)', color: 'var(--muted)' }}>
          No heart-rate data for this run. Record with a watch or HR strap to see your zone breakdown.
        </p>
      )}

      {!isLoading && !noHr && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <HrStat k="Avg HR" v={data.activity_hr_avg} unit="bpm" />
            <HrStat k="Max HR" v={data.activity_hr_max} unit="bpm" />
            <HrStat
              k="Efficiency"
              v={data.efficiency_score}
              unit="/100"
              accent
            />
          </div>

          {typeof data.primary_zone === 'number' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: ZONE_PALETTE[data.primary_zone - 1] || ZONE_PALETTE[4] }}
                aria-hidden="true"
              />
              <span style={{ font: '600 11px var(--body)', color: 'var(--muted)' }}>
                Primary zone <b style={{ font: '700 11px var(--mono)', color: 'var(--fg)' }}>Z{data.primary_zone}</b>
                {typeof data.target_zone === 'number' && (
                  <> · target <b style={{ font: '700 11px var(--mono)', color: 'var(--fg)' }}>Z{data.target_zone}</b></>
                )}
              </span>
              {typeof data.was_in_target === 'boolean' && (
                <span className={`ss-dchip ${data.was_in_target ? 'good' : 'warn'}`} style={{ marginLeft: 'auto' }}>
                  {data.was_in_target ? 'On target' : 'Off target'}
                </span>
              )}
            </div>
          )}

          {data.zone_distribution && data.zone_distribution.length > 0 && (
            <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,.05)' }} aria-hidden="true">
              {data.zone_distribution
                .filter((z) => z.percent > 0)
                .map((z) => (
                  <div
                    key={z.zone}
                    style={{ width: `${z.percent}%`, background: ZONE_PALETTE[z.zone - 1] || ZONE_PALETTE[4] }}
                  />
                ))}
            </div>
          )}

          {data.feedback && (
            <p style={{ font: '400 11.5px/1.5 var(--body)', color: 'var(--muted)' }}>{data.feedback}</p>
          )}
        </div>
      )}
    </section>
  );
}

function HrStat({ k, v, unit, accent }: { k: string; v?: number; unit?: string; accent?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)', borderRadius: 11, padding: '8px 7px', textAlign: 'center' }}>
      <p className="tlbl" style={{ marginBottom: 4 }}>{k}</p>
      <p style={{ font: '700 16px var(--mono)', color: accent ? 'var(--accent-2)' : 'var(--fg)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, whiteSpace: 'nowrap' }}>
        {typeof v === 'number' ? v : '—'}
        {typeof v === 'number' && unit && <small style={{ font: '500 9px var(--mono)', color: 'var(--muted-2)' }}> {unit}</small>}
      </p>
    </div>
  );
}

// --- Per-run detail: Coach recap (GET /insights/post-run/:id) ---
interface PostRunAnalysis {
  score?: number;
  paceConsistency?: 'very_consistent' | 'consistent' | 'variable' | 'erratic';
  splitAnalysis?: string;
  comparedToAverage?: string;
  improvementAreas?: string[];
}

const CONSISTENCY_TONE: Record<string, string> = {
  very_consistent: 'good',
  consistent: 'good',
  variable: 'warn',
  erratic: 'warn',
};

function CoachRecapBlock({ activityId, enabled }: { activityId: number; enabled: boolean }) {
  const { data, isLoading, isError } = useQuery<PostRunAnalysis>({
    queryKey: ['post-run', activityId],
    queryFn: () => api.get(`/insights/post-run/${activityId}`).then((r) => r.data),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="ss-surface ss-ai" style={{ borderRadius: 14, padding: 12 }} data-testid="run-coach-recap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={{ display: 'inline-flex', color: 'var(--violet-2)' }}><Spark width={13} height={13} /></span>
        <span className="tlbl" style={{ color: 'var(--violet-2)' }}>Coach recap</span>
        {typeof data?.score === 'number' && !isLoading && !isError && (
          <span className="ss-dchip info" style={{ marginLeft: 'auto' }}>{data.score}/100</span>
        )}
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SSSkeleton height={34} style={{ borderRadius: 10 }} />
          <SSSkeleton height={34} style={{ borderRadius: 10 }} />
        </div>
      )}

      {!isLoading && isError && (
        <p style={{ font: '500 11.5px/1.5 var(--body)', color: 'var(--muted)' }}>
          Coach recap isn’t available for this run yet.
        </p>
      )}

      {!isLoading && !isError && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {data.paceConsistency && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ font: '600 11px var(--body)', color: 'var(--muted)' }}>Pace consistency</span>
              <span
                className={`ss-dchip ${CONSISTENCY_TONE[data.paceConsistency] || 'neutral'}`}
                style={{ marginLeft: 'auto', textTransform: 'capitalize' }}
              >
                {data.paceConsistency.replace(/_/g, ' ')}
              </span>
            </div>
          )}
          {data.splitAnalysis && (
            <p style={{ font: '400 11.5px/1.5 var(--body)', color: '#D7D7E4' }}>{data.splitAnalysis}</p>
          )}
          {data.comparedToAverage && (
            <p style={{ font: '400 11.5px/1.5 var(--body)', color: 'var(--muted)' }}>{data.comparedToAverage}</p>
          )}
          {data.improvementAreas && data.improvementAreas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 1 }}>
              <p className="tlbl">Focus next</p>
              {data.improvementAreas.map((area, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--violet-2)', flex: 'none', marginTop: 6 }} aria-hidden="true" />
                  <span style={{ font: '400 11.5px/1.5 var(--body)', color: 'var(--muted)' }}>{area}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// --- Run row: tap to expand → lazy-load HR analysis + Coach recap ---
function RunRow({ run }: { run: any }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Run on ${formatDate(run.start_date)}, ${open ? 'collapse' : 'expand'} details`}
        className="w-full text-left p-4 active:scale-[0.99] transition-transform"
        style={{ minHeight: 44 }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] text-zinc-500">{formatDate(run.start_date)}</p>
          <div className="flex items-center gap-2.5">
            {run.elevation_gain > 0 && (
              <span className="text-[10px] text-zinc-600">↑{Math.round(run.elevation_gain)}m</span>
            )}
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-flex', color: 'var(--muted-2)' }}>
              <ChevronDown width={14} height={14} />
            </motion.span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="font-mono text-[17px] font-bold">{(run.distance_meters / 1000).toFixed(1)}</p>
            <p className="text-[10px] text-zinc-500 uppercase mt-0.5">km</p>
          </div>
          <div>
            <p className="font-mono text-[17px] font-bold">{formatPace(run.average_pace_per_km)}</p>
            <p className="text-[10px] text-zinc-500 uppercase mt-0.5">pace</p>
          </div>
          <div>
            <p className="font-mono text-[17px] font-bold">{Math.floor(run.moving_time_seconds / 60)}</p>
            <p className="text-[10px] text-zinc-500 uppercase mt-0.5">min</p>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-1 space-y-2.5">
              <HrAnalysisBlock activityId={run.id} enabled={open} />
              <CoachRecapBlock activityId={run.id} enabled={open} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RunHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => api.get('/runs?limit=30').then(r => r.data),
  });

  const runs = data?.runs || [];
  const totalDistance = runs.reduce((s: number, r: any) => s + (r.distance_meters || 0), 0);
  const totalRuns = runs.length;
  const bestPace = runs.length > 0 ? Math.min(...runs.map((r: any) => r.average_pace_per_km || 999)) : 0;

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Activity</p>
          <h1 className="font-heading text-xl font-bold mt-0.5">Run History</h1>
        </motion.div>

        {/* Summary stats */}
        {totalRuns > 0 && (
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="font-mono font-bold text-lg text-white">{totalRuns}</p>
              <p className="text-[10px] text-zinc-500">runs</p>
            </div>
            <div className="card p-3 text-center">
              <p className="font-mono font-bold text-lg text-white">{(totalDistance / 1000).toFixed(1)}</p>
              <p className="text-[10px] text-zinc-500">km total</p>
            </div>
            <div className="card p-3 text-center">
              <p className="font-mono font-bold text-lg text-accent">{formatPace(bestPace)}</p>
              <p className="text-[10px] text-zinc-500">best pace</p>
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[72px] rounded-xl bg-bg-tertiary/50" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && runs.length === 0 && (
          <motion.div variants={fadeUp} className="text-center py-16">
            <p className="text-3xl mb-3">🏃</p>
            <p className="text-zinc-500 text-sm">No runs yet</p>
            <p className="text-zinc-600 text-xs mt-1">Use the GPS tracker to log your first run</p>
          </motion.div>
        )}

        {/* Run list — each row taps to expand into HR analysis + Coach recap */}
        {runs.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-2">
            {runs.map((run: any) => (
              <RunRow key={run.id} run={run} />
            ))}
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
