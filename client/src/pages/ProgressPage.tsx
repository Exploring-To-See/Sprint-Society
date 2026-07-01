import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { SSSeg } from '../components/ss/SSSeg';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import { Chart } from '../components/ss/icons';

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
      <AppShell>
        <div className="space-y-5 animate-pulse">
          <div>
            <div className="h-3 w-20 bg-bg-tertiary rounded" />
            <div className="h-6 w-32 bg-bg-tertiary rounded mt-2" />
          </div>
          <div className="h-10 w-full bg-bg-tertiary rounded-lg" />
          <div className="h-[120px] w-full bg-bg-tertiary rounded-xl" />
          <div className="h-[120px] w-full bg-bg-tertiary rounded-xl" />
          <div className="h-[180px] w-full bg-bg-tertiary rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Your growth</p>
          <h1 className="font-heading text-xl font-bold mt-0.5">Progress</h1>
        </motion.div>

        {/* View toggle */}
        <motion.div variants={fadeUp} className="flex gap-1">
          {(['stats', 'journey'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 py-2 text-center text-[11px] font-semibold rounded-lg transition-colors ${
                view === tab ? 'bg-accent/10 text-accent' : 'text-zinc-600'
              }`}
            >
              {tab === 'stats' ? 'Stats' : 'Journey'}
            </button>
          ))}
        </motion.div>

        {/* Journey Timeline */}
        {view === 'journey' && (
          <motion.div variants={fadeUp} className="space-y-3">
            {journey?.milestones?.length > 0 ? (
              <div className="relative pl-6">
                <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-accent/40 to-accent-gold/20 rounded-full" />
                {journey.milestones.map((m: any, i: number) => (
                  <div key={i} className="relative flex gap-3 pb-4">
                    <div className="absolute left-[-15px] w-5 h-5 rounded-full bg-bg-secondary border-2 border-accent/40 flex items-center justify-center z-10">
                      <span className="text-[10px]">{m.icon}</span>
                    </div>
                    <div className="flex-1 ml-2">
                      <p className="text-[12px] font-semibold text-white">{m.title}</p>
                      <p className="text-[10px] text-zinc-600">{m.detail}</p>
                      <p className="text-[11px] text-zinc-700 mt-0.5">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-2xl">🗺️</span>
                <p className="text-[12px] text-zinc-500 mt-2">Complete more runs to build your journey</p>
              </div>
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
          <motion.div variants={fadeUp} className="card p-5">
            <p className="label mb-4 text-center">Your Improvement</p>
            <div className="flex items-center justify-center gap-5">
              <div className="text-center">
                <p className="text-[10px] text-zinc-600 mb-1">STARTED AT</p>
                <p className="font-mono text-2xl font-bold text-zinc-500">
                  {formatPace(improvement.before.avg_pace)}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">/km</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-accent text-lg">→</span>
                {improvement.improvement.pace_improved && (
                  <span className="text-[10px] font-medium text-accent-green">
                    {improvement.improvement.pace_seconds}s faster
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] text-zinc-600 mb-1">NOW</p>
                <p className="font-mono text-2xl font-bold text-accent">
                  {formatPace(improvement.now.avg_pace)}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">/km</p>
              </div>
            </div>
            {improvement.improvement.distance_growth_percent > 0 && (
              <p className="text-center text-[11px] text-zinc-500 mt-4">
                Distance up {improvement.improvement.distance_growth_percent}% • {improvement.improvement.total_runs} total runs
              </p>
            )}
          </motion.div>
        )}

        {/* Weekly-only: Pace trend chart (global pace history) */}
        {period === 'weekly' && improvement?.trend && improvement.trend.length > 2 && (
          <motion.div variants={fadeUp}>
            <h3 className="font-heading font-semibold text-[15px] mb-3">Pace over time</h3>
            <div className="card p-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={improvement.trend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <XAxis
                      dataKey="week"
                      tick={{ fill: '#52525B', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis
                      reversed
                      tick={{ fill: '#52525B', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatPace(v)}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#A1A1AA' }}
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
                <motion.div variants={fadeUp} className="flex gap-2" data-testid="progress-period-summary">
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
                  <motion.div variants={fadeUp} className={`card p-4 border ${
                    report.comparison.pace_improved ? 'border-accent-green/20 bg-accent-green/5' : 'border-bg-tertiary'
                  }`}>
                    <p className={`text-[13px] font-medium ${report.comparison.pace_improved ? 'text-accent-green' : 'text-zinc-300'}`}>
                      {report.comparison.message}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-[11px] text-zinc-500">
                        {report.comparison.runs_change > 0 ? '+' : ''}{report.comparison.runs_change} runs
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {report.comparison.distance_change_percent > 0 ? '+' : ''}{report.comparison.distance_change_percent}% distance
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* PRs */}
                {report.personal_records.length > 0 && (
                  <motion.div variants={fadeUp}>
                    <h3 className="font-heading font-semibold text-[15px] mb-3">Personal Records</h3>
                    <div className="space-y-2">
                      {report.personal_records.map((pr) => (
                        <div key={pr.category} className="card p-3.5 flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-medium">{pr.category}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {new Date(pr.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-[15px] font-bold text-white">{pr.formatted}</p>
                            {pr.is_new && <span className="text-[11px] font-medium text-accent-gold">NEW PR!</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Next milestone */}
                {report.next_milestone && (
                  <motion.div variants={fadeUp} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="label">Next Milestone</p>
                      <span className="text-[11px] font-mono text-accent">{report.next_milestone.progress_percent}%</span>
                    </div>
                    <p className="text-[13px] font-medium">{report.next_milestone.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{report.next_milestone.remaining}</p>
                    <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden mt-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold"
                        style={{ width: `${report.next_milestone.progress_percent}%` }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Improvement velocity — global, weekly-only (rate is per-week) */}
                {period === 'weekly' && report.improvement_velocity && report.improvement_velocity.pace_improvement_per_week !== 0 && (
                  <motion.div variants={fadeUp} className="card p-4 text-center">
                    <p className="label mb-1">Improvement Rate</p>
                    <p className="font-mono text-xl font-bold text-accent">
                      {report.improvement_velocity.pace_improvement_per_week > 0 ? '-' : '+'}
                      {Math.abs(report.improvement_velocity.pace_improvement_per_week)}s
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">per km, per week</p>
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
    </AppShell>
  );
}
