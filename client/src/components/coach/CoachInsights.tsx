// AI Coach · Insights — the readiness orb is this screen's ONE living centerpiece, with
// data analytics below. Data from insights.batch.routes.ts (GET /coach/insights) +
// training.routes.ts (GET /training/readiness). Metrics are mono/tabular; semantic color
// lives only in text/delta chips; every surface is neutral glass.
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Gauge } from '../ss/Gauge';
import { SSSkeleton, SSError, SSEmpty } from '../ss/SSStates';
import { Bolt, Chart } from '../ss/icons';

interface Readiness { score?: number; label?: string; color?: string; recommendation?: string; coach_tip?: string }
interface Prediction { predicted_seconds?: number; predicted_formatted?: string }
interface Insights {
  adaptive?: { training_stress_balance?: number; injury_risk?: string | { level?: string }; acute_chronic_ratio?: number };
  summary?: { vdot?: number; readiness?: Readiness; pace_trend?: string; improvement_per_week?: number; compliance?: number };
  vdotProgression?: { current_vdot?: number };
  tier?: { tier?: string; score?: number; estimated_vo2max?: number; age_graded_percentage?: number };
  predictions?: Partial<Record<'5K' | '10K' | 'Half' | 'Marathon', Prediction>>;
  stats?: { total_distance?: number; avg_pace?: number };
  records?: { formatted_time?: string; pace?: number; distance_label?: string; category?: string }[];
}

type Tone = 'good' | 'info' | 'warn' | 'plain';

function fmtTime(s?: number): string {
  if (!s) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}
function fmtPace(s?: number): string {
  if (!s) return '—';
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}

// Build a real pace sparkline (W=300, H=46). Faster pace (lower s/km) sits higher on the chart.
function buildSpark(paces: number[]): { line: string; area: string; lastY: number } | null {
  const pts = paces.slice(-24);
  if (pts.length < 2) return null;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const x = (i: number) => (i / (pts.length - 1)) * 300;
  const y = (p: number) => 4 + ((p - min) / span) * 38; // faster→top
  const coords = pts.map((p, i) => [x(i), y(p)] as const);
  const line = coords.map(([cx, cy], i) => `${i === 0 ? 'M' : 'L'}${cx.toFixed(1)} ${cy.toFixed(1)}`).join(' ');
  const area = `${line} L300 46 L0 46 Z`;
  return { line, area, lastY: coords[coords.length - 1][1] };
}

export function CoachInsights() {
  const { data: insights, isLoading, isError, refetch } = useQuery<Insights>({
    queryKey: ['coach-insights-batch'],
    queryFn: () => api.get('/coach/insights').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
  const { data: readinessData } = useQuery<Readiness>({
    queryKey: ['training-readiness'],
    queryFn: () => api.get('/training/readiness').then((r) => r.data).catch(() => null),
  });
  const { data: paceSeries } = useQuery<Array<{ average_pace_per_km?: number; start_date?: string }>>({
    queryKey: ['pace-series-30d'],
    queryFn: () => api.get('/runs/chart-data?weeks=5').then((r) => r.data).catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SSSkeleton height={168} style={{ borderRadius: 22 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
          {[0, 1, 2, 3].map((i) => <SSSkeleton key={i} height={84} style={{ borderRadius: 18 }} />)}
        </div>
        <SSSkeleton height={120} style={{ borderRadius: 18 }} />
      </div>
    );
  }
  if (isError) return <div className="ss-pad"><SSError onRetry={() => refetch()} testid="coach-insights-error" /></div>;

  const r: Readiness = readinessData || insights?.summary?.readiness || {};
  const tier = insights?.tier;
  const adaptive = insights?.adaptive;
  const summary = insights?.summary;
  const stats = insights?.stats;

  const vo2 = tier?.estimated_vo2max;
  const vdot = summary?.vdot ?? insights?.vdotProgression?.current_vdot;
  const ageGrade = tier?.age_graded_percentage;
  const tsb = adaptive?.training_stress_balance;
  const injuryRaw = adaptive?.injury_risk;
  const injury = typeof injuryRaw === 'string' ? injuryRaw : injuryRaw?.level;
  const score = typeof r.score === 'number' ? r.score : undefined;

  const noData = !vo2 && !vdot && score === undefined && !tier;

  if (noData) {
    return (
      <div className="ss-pad">
        <SSEmpty
          icon={<Bolt width={22} height={22} />}
          title="Insights warm up after a few runs"
          body="Log a couple of runs and your coach will surface VO₂ max, race predictions, training load and readiness here."
          testid="coach-insights-empty"
        />
      </div>
    );
  }

  const spark = buildSpark((paceSeries || []).map((p) => p.average_pace_per_km).filter((x): x is number => typeof x === 'number' && x > 0));

  const loadTone: Tone = tsb === undefined ? 'plain' : tsb > 0 ? 'good' : tsb > -10 ? 'warn' : 'warn';
  const loadLabel = tsb === undefined ? '—' : tsb > 5 ? 'Fresh' : tsb > -5 ? 'Optimal' : 'Fatigued';
  const injTone: Tone = injury === 'Low' ? 'good' : injury ? 'warn' : 'plain';

  return (
    <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* READINESS ORB — the centerpiece */}
      <section className="ss-surface ss-hero ss-rise" style={{ borderRadius: 22, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }} aria-label="Training readiness" data-testid="coach-readiness">
        <Gauge
          value={score ?? 0}
          display={score !== undefined ? String(Math.round(score)) : '—'}
          caption={r.label || 'Readiness'}
          variant="live"
          ariaLabel={`Readiness ${score ?? 'unknown'}${r.label ? `, ${r.label}` : ''}`}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="slbl" style={{ marginBottom: 4 }}>Today’s readiness</div>
          <div style={{ font: '500 14px/1.25 var(--head)', color: '#fff' }}>
            {r.recommendation || (score !== undefined && score >= 70 ? 'Primed for quality work.' : 'Keep it easy and recover.')}
          </div>
          {r.coach_tip && <p style={{ font: '400 12px/1.45 var(--body)', color: '#D7D7E4', marginTop: 6 }}>{r.coach_tip}</p>}
        </div>
      </section>

      {/* CORE METRIC BENTO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
        <Metric label="VO₂ Max" value={vo2 ? vo2.toFixed(1) : '—'} sub="ml/kg/min" tone={vo2 && vo2 > 40 ? 'good' : 'plain'} i={0} />
        <Metric label="VDOT" value={vdot ? vdot.toFixed(1) : '—'} sub="Jack Daniels" i={1} />
        <Metric label="Age Grade" value={ageGrade ? `${Math.round(ageGrade)}%` : '—'} sub="vs world record" i={2} />
        <Metric label="Training Load" value={loadLabel} sub={tsb !== undefined ? `TSB ${tsb.toFixed(0)}` : ''} tone={loadTone} i={3} />
        <Metric label="Injury Risk" value={injury || '—'} sub={adaptive?.acute_chronic_ratio ? `ACWR ${adaptive.acute_chronic_ratio.toFixed(2)}` : ''} tone={injTone} i={4} />
        <Metric label="Compliance" value={summary?.compliance ? `${Math.round(summary.compliance)}%` : '—'} sub="sessions done" i={5} />
      </div>

      {/* RACE PREDICTIONS */}
      <section className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 13, animationDelay: '.22s' }} aria-label="Race predictions" data-testid="coach-predictions">
        <Head label="Race predictions" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: 4 }}>
          {(['5K', '10K', 'Half', 'Marathon'] as const).map((d) => (
            <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: '600 11px var(--body)', color: 'var(--muted)' }}>{d}</span>
              <span style={{ font: '700 13px var(--mono)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                {insights?.predictions?.[d]?.predicted_formatted || fmtTime(insights?.predictions?.[d]?.predicted_seconds)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* PACE TRAJECTORY */}
      <section className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 13, animationDelay: '.3s' }} aria-label="Pace trajectory over 30 days" data-testid="coach-pace-trend">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Head label="Pace trajectory · 30d" icon={<Chart width={13} height={13} stroke="var(--accent-2)" />} />
          <span className={`ss-dchip ${summary?.pace_trend === 'declining' ? 'warn' : 'good'}`}>
            {summary?.pace_trend === 'improving' ? '▲ Improving' : summary?.pace_trend === 'declining' ? '▼ Declining' : '→ Stable'}
          </span>
        </div>
        {spark ? (
          <svg width="100%" height="46" viewBox="0 0 300 46" preserveAspectRatio="none" style={{ marginTop: 8, display: 'block' }} aria-hidden="true">
            <defs><linearGradient id="ins-sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34D399" stopOpacity=".22" /><stop offset="1" stopColor="#34D399" stopOpacity="0" /></linearGradient></defs>
            <path d={spark.area} fill="url(#ins-sg)" />
            <path d={spark.line} fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="300" cy={spark.lastY} r="3" fill="#34D399" />
          </svg>
        ) : (
          <p style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', marginTop: 8 }}>Log a few more runs to chart your pace trend.</p>
        )}
        {stats?.avg_pace && <p style={{ font: '500 11px var(--mono)', color: 'var(--muted)', marginTop: 2 }}>Current avg {fmtPace(stats.avg_pace)}/km</p>}
      </section>
    </div>
  );
}

function Head({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span className="tlbl">{label}</span>
    </div>
  );
}

function Metric({ label, value, sub, tone = 'plain', i = 0 }: { label: string; value: string; sub?: string; tone?: Tone; i?: number }) {
  const color = tone === 'good' ? 'var(--green)' : tone === 'warn' ? 'var(--amber)' : 'var(--fg)';
  return (
    <div className="ss-surface ss-recess ss-rise" style={{ borderRadius: 18, padding: 13, animationDelay: `${0.04 + i * 0.04}s` }}>
      <p className="tlbl" style={{ marginBottom: 6 }}>{label}</p>
      <p style={{ font: '700 19px var(--mono)', color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>{sub}</p>}
    </div>
  );
}
