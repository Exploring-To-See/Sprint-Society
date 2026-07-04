// Progress (/progress) — SSScreen shell + ss surfaces. Hooks preserved:
// GET /progress/improvement, /progress/weekly|monthly|all-time (period seg),
// /progress/journey (Journey view).
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSeg } from '../components/ss/SSSeg';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import { Chart, Flag, Medal } from '../components/ss/icons';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

// --- Period (Week / Month / All-time) report types, mirroring generateProgressReport ---
type Period = 'weekly' | 'monthly' | 'all_time';

interface PeriodPR {
  category: string;
  formatted: string;
  date: string;
  is_new: boolean;
}
interface PeriodReport {
  period: Period;
  summary: {
    total_runs: number;
    total_distance_km: number;
    total_time_minutes: number;
    avg_pace_per_km: number;
    best_pace_per_km: number;
  };
  comparison?: {
    runs_change: number;
    distance_change_percent: number;
    pace_change_seconds: number;
    pace_improved: boolean;
    message: string;
  };
  personal_records: PeriodPR[];
  improvement_velocity: {
    pace_improvement_per_week: number;
    distance_growth_per_week: number;
    projected_5k_time_in_4_weeks: number;
  };
  next_milestone: { name: string; progress_percent: number; remaining: string };
}

const PERIODS: { key: Period; label: string; endpoint: string }[] = [
  { key: 'weekly', label: 'Week', endpoint: '/progress/weekly' },
  { key: 'monthly', label: 'Month', endpoint: '/progress/monthly' },
  { key: 'all_time', label: 'All-time', endpoint: '/progress/all-time' },
];
const PERIOD_NOUN: Record<Period, string> = { weekly: 'week', monthly: 'month', all_time: 'all-time' };

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function ProgressPage() {
  const [view, setView] = useState<'stats' | 'journey'>('stats');
  const [period, setPeriod] = useState<Period>('weekly');

  const { data: improvement, isLoading: loadingImprovement } = useQuery({
    queryKey: ['progress-improvement'],
    queryFn: () => api.get('/progress/improvement').then(r => r.data),
  });

  // Period report — Week / Month / All-time. Separate query key per period so each
  // caches independently. All three share the generateProgressReport shape.
  const activePeriod = PERIODS.find(p => p.key === period)!;
  const {
    data: report,
    isLoading: loadingReport,
    isError: reportError,
    refetch: refetchReport,
  } = useQuery<PeriodReport>({
    queryKey: ['progress-report', period],
    queryFn: () => api.get(activePeriod.endpoint).then(r => r.data),
  });

  // Weekly-only: improvement + chart and the report skeleton gate the first paint.
  const isLoading = loadingImprovement || (period === 'weekly' && loadingReport);

  const { data: journey } = useQuery({
    queryKey: ['progress-journey'],
    queryFn: () => api.get('/progress/journey').then(r => r.data).catch(() => null),
    enabled: view === 'journey',
  });

  if (isLoading) {
    return (
      <SSScreen active="home" bodyLabel="Progress">
        <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SSSkeleton height={44} style={{ borderRadius: 13 }} />
          <SSSkeleton height={120} style={{ borderRadius: 18 }} />
          <SSSkeleton height={120} style={{ borderRadius: 18 }} />
          <SSSkeleton height={180} style={{ borderRadius: 18 }} />
        </div>
      </SSScreen>
    );
  }

  return (
    <SSScreen active="home" bodyLabel="Progress">
      <motion.div variants={stagger} initial="hidden" animate="show" className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>
        <motion.div variants={fadeUp}>
          <p className="tlbl">Your growth</p>
          <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em', marginTop: 2 }}>Progress</h1>
        </motion.div>

        {/* View toggle */}
        <motion.div variants={fadeUp}>
          <SSSeg<'stats' | 'journey'>
            items={[{ key: 'stats', label: 'Stats' }, { key: 'journey', label: 'Journey' }]}
            value={view}
            onChange={setView}
            layoutId="progress-view-pill"
            ariaLabel="Progress view"
            testid="progress-view"
          />
        </motion.div>

        {/* Journey Timeline */}
        {view === 'journey' && (
          <motion.div variants={fadeUp}>
            {journey?.milestones?.length > 0 ? (
              <div style={{ position: 'relative', paddingLeft: 26 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, borderRadius: 1, background: 'linear-gradient(180deg,rgba(249,115,22,.4),rgba(251,191,36,.15))' }} />
                {journey.milestones.map((m: any, i: number) => (
                  <div key={i} style={{ position: 'relative', paddingBottom: 18 }}>
                    <span style={{
                      position: 'absolute', left: -26, top: 0, width: 20, height: 20, borderRadius: '50%', zIndex: 1,
                      background: 'var(--bg2)', border: '2px solid rgba(249,115,22,.4)', display: 'grid', placeItems: 'center',
                    }} aria-hidden="true">
                      <Medal width={9} height={9} style={{ color: 'var(--accent-2)' }} />
                    </span>
                    <div style={{ marginLeft: 4 }}>
                      <p style={{ font: '600 12.5px var(--body)', color: 'var(--fg)' }}>{m.title}</p>
                      <p style={{ font: '400 10.5px var(--body)', color: 'var(--muted)', marginTop: 1 }}>{m.detail}</p>
                      <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 2 }}>
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SSEmpty
                icon={<Flag width={22} height={22} />}
                title="Your journey starts here"
                body="Complete more runs to build your milestone timeline."
                testid="progress-journey-empty"
              />
            )}
          </motion.div>
        )}

        {view === 'stats' && (
          <>
            {/* Period switch — Week · Month · All-time */}
            <motion.div variants={fadeUp}>
              <SSSeg<Period>
                items={PERIODS.map(p => ({ key: p.key, label: p.label }))}
                value={period}
                onChange={setPeriod}
                layoutId="progress-period-pill"
                ariaLabel="Select progress period"
                testid="progress-period"
              />
            </motion.div>

            {/* Period report — loading / error states (empty handled inline below) */}
            {loadingReport && (
              <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SSSkeleton height={84} style={{ borderRadius: 18 }} />
                <SSSkeleton height={108} style={{ borderRadius: 18 }} />
                <SSSkeleton height={92} style={{ borderRadius: 18 }} />
              </motion.div>
            )}
            {!loadingReport && reportError && (
              <motion.div variants={fadeUp}>
                <SSError
                  onRetry={() => refetchReport()}
                  message="We couldn’t load your progress for this period. Check your connection and try again."
                  testid="progress-period-error"
                />
              </motion.div>
            )}

            {/* Weekly-only: Before → After card (global improvement, not period-scoped) */}
            {period === 'weekly' && improvement?.has_data && (
              <motion.div variants={fadeUp} className="ss-surface ss-hero" style={{ borderRadius: 22, padding: 16 }}>
                <p className="tlbl" style={{ textAlign: 'center', marginBottom: 14 }}>Your improvement</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginBottom: 4 }}>Started at</p>
                    <p className="num" style={{ font: '700 24px var(--mono)', color: 'var(--muted)' }}>
                      {formatPace(improvement.before.avg_pace)}
                    </p>
                    <p style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 2 }}>/km</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'var(--accent-2)', font: '600 18px var(--body)' }} aria-hidden="true">→</span>
                    {improvement.improvement.pace_improved && (
                      <span className="ss-dchip good">{improvement.improvement.pace_seconds}s faster</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginBottom: 4 }}>Now</p>
                    <p className="num" style={{ font: '700 24px var(--mono)', color: 'var(--accent-2)' }}>
                      {formatPace(improvement.now.avg_pace)}
                    </p>
                    <p style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 2 }}>/km</p>
                  </div>
                </div>
                {improvement.improvement.distance_growth_percent > 0 && (
                  <p className="num" style={{ textAlign: 'center', font: '500 11px var(--body)', color: 'var(--muted)', marginTop: 14 }}>
                    Distance up {improvement.improvement.distance_growth_percent}% · {improvement.improvement.total_runs} total runs
                  </p>
                )}
              </motion.div>
            )}

            {/* Weekly-only: Pace trend chart (global pace history) */}
            {period === 'weekly' && improvement?.trend && improvement.trend.length > 2 && (
              <motion.div variants={fadeUp}>
                <div className="thead"><span className="ticon"><Chart width={14} height={14} style={{ color: 'var(--muted)' }} /></span><span className="tlbl">Pace over time</span></div>
                <div className="tile recess" style={{ borderRadius: 18, padding: 13 }}>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={improvement.trend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <XAxis
                          dataKey="week"
                          tick={{ fill: '#86899E', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis
                          reversed
                          tick={{ fill: '#86899E', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => formatPace(v)}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          contentStyle={{ background: '#0B0A16', border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: '#9A9CB0' }}
                          formatter={(value: number) => [formatPace(value) + '/km', 'Avg Pace']}
                        />
                        <Line
                          type="monotone"
                          dataKey="pace"
                          stroke="#F97316"
                          strokeWidth={2}
                          dot={{ fill: '#F97316', r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Period summary (Week / Month / All-time) — same report shape for all three */}
            {report && !loadingReport && !reportError && (
              <>
                {report.summary.total_runs > 0 ? (
                  <>
                    {/* Headline stats for the selected period */}
                    <motion.div variants={fadeUp} className="sstats" data-testid="progress-period-summary">
                      <div className="sstat">
                        <div className="v">{report.summary.total_runs}</div>
                        <div className="k">Runs</div>
                      </div>
                      <div className="sstat">
                        <div className="v">{report.summary.total_distance_km.toFixed(1)}<small>km</small></div>
                        <div className="k">Distance</div>
                      </div>
                      <div className="sstat">
                        <div className="v">{formatPace(report.summary.avg_pace_per_km)}<small>/km</small></div>
                        <div className="k">Avg pace</div>
                      </div>
                    </motion.div>

                    {/* Comparison message — only weekly/monthly carry a previous period */}
                    {report.comparison && (
                      <motion.div
                        variants={fadeUp}
                        className="tile"
                        style={{
                          borderRadius: 18, padding: 13,
                          ...(report.comparison.pace_improved ? { background: 'rgba(52,211,153,.06)', borderColor: 'rgba(52,211,153,.2)' } : {}),
                        }}
                      >
                        <p style={{ font: '500 13px var(--body)', color: report.comparison.pace_improved ? 'var(--green)' : 'var(--fg)' }}>
                          {report.comparison.message}
                        </p>
                        <div className="num" style={{ display: 'flex', gap: 14, marginTop: 8, font: '500 11px var(--mono)', color: 'var(--muted)' }}>
                          <span>{report.comparison.runs_change > 0 ? '+' : ''}{report.comparison.runs_change} runs</span>
                          <span>{report.comparison.distance_change_percent > 0 ? '+' : ''}{report.comparison.distance_change_percent}% distance</span>
                        </div>
                      </motion.div>
                    )}

                    {/* PRs */}
                    {report.personal_records.length > 0 && (
                      <motion.div variants={fadeUp}>
                        <p className="tlbl" style={{ marginBottom: 9 }}>Personal records</p>
                        <div className="tile recess" style={{ borderRadius: 18, padding: '4px 13px' }}>
                          {report.personal_records.map((pr, i) => (
                            <div key={pr.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, padding: '9px 0', borderBottom: i === report.personal_records.length - 1 ? 'none' : '1px solid var(--hair)' }}>
                              <div>
                                <p style={{ font: '500 13px var(--body)', color: 'var(--fg)' }}>{pr.category}</p>
                                <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 2 }}>
                                  {new Date(pr.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p className="num" style={{ font: '700 15px var(--mono)', color: 'var(--fg)' }}>{pr.formatted}</p>
                                {pr.is_new && <span className="ss-prtag">New PR</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Next milestone */}
                    {report.next_milestone && (
                      <motion.div variants={fadeUp} className="tile recess" style={{ borderRadius: 18, padding: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                          <p className="tlbl">Next milestone</p>
                          <span className="num" style={{ font: '600 11px var(--mono)', color: 'var(--accent-2)' }}>{report.next_milestone.progress_percent}%</span>
                        </div>
                        <p style={{ font: '500 13px var(--body)', color: 'var(--fg)' }}>{report.next_milestone.name}</p>
                        <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', marginTop: 2 }}>{report.next_milestone.remaining}</p>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden', marginTop: 11 }} aria-hidden="true">
                          <div
                            style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,var(--accent),var(--amber))', width: `${report.next_milestone.progress_percent}%` }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Improvement velocity — global, weekly-only (rate is per-week) */}
                    {period === 'weekly' && report.improvement_velocity && report.improvement_velocity.pace_improvement_per_week !== 0 && (
                      <motion.div variants={fadeUp} className="tile recess" style={{ borderRadius: 18, padding: 13, alignItems: 'center', textAlign: 'center' }}>
                        <p className="tlbl" style={{ marginBottom: 4 }}>Improvement rate</p>
                        <p className="num" style={{ font: '700 20px var(--mono)', color: 'var(--accent-2)' }}>
                          {report.improvement_velocity.pace_improvement_per_week > 0 ? '-' : '+'}
                          {Math.abs(report.improvement_velocity.pace_improvement_per_week)}s
                        </p>
                        <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', marginTop: 2 }}>per km, per week</p>
                      </motion.div>
                    )}
                  </>
                ) : (
                  /* No runs in the selected period */
                  <motion.div variants={fadeUp}>
                    <SSEmpty
                      icon={<Chart width={22} height={22} />}
                      title={period === 'all_time' ? 'No runs logged yet' : `No runs this ${PERIOD_NOUN[period]}`}
                      body={
                        period === 'all_time'
                          ? 'Complete a few runs and your stats will appear here automatically.'
                          : `You haven’t logged a run this ${PERIOD_NOUN[period]} yet. Switch to All-time to see your full history.`
                      }
                      testid="progress-period-empty"
                    />
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </SSScreen>
  );
}
