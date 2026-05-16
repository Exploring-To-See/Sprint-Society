import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function ProgressPage() {
  const { data: improvement } = useQuery({
    queryKey: ['progress-improvement'],
    queryFn: () => api.get('/progress/improvement').then(r => r.data),
  });

  const { data: weekly } = useQuery({
    queryKey: ['progress-weekly'],
    queryFn: () => api.get('/progress/weekly').then(r => r.data),
  });

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Your growth</p>
          <h1 className="font-heading text-xl font-bold mt-0.5">Progress</h1>
        </motion.div>

        {/* Before → After card */}
        {improvement?.has_data && (
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

        {/* Pace trend chart */}
        {improvement?.trend && improvement.trend.length > 2 && (
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

        {/* Weekly summary */}
        {weekly && (
          <>
            {/* Comparison message */}
            {weekly.comparison && (
              <motion.div variants={fadeUp} className={`card p-4 border ${
                weekly.comparison.pace_improved ? 'border-accent-green/20 bg-accent-green/5' : 'border-bg-tertiary'
              }`}>
                <p className={`text-[13px] font-medium ${weekly.comparison.pace_improved ? 'text-accent-green' : 'text-zinc-300'}`}>
                  {weekly.comparison.message}
                </p>
                <div className="flex gap-4 mt-2">
                  <span className="text-[11px] text-zinc-500">
                    {weekly.comparison.runs_change > 0 ? '+' : ''}{weekly.comparison.runs_change} runs
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {weekly.comparison.distance_change_percent > 0 ? '+' : ''}{weekly.comparison.distance_change_percent}% distance
                  </span>
                </div>
              </motion.div>
            )}

            {/* PRs */}
            {weekly.personal_records && weekly.personal_records.length > 0 && (
              <motion.div variants={fadeUp}>
                <h3 className="font-heading font-semibold text-[15px] mb-3">Personal Records</h3>
                <div className="space-y-2">
                  {weekly.personal_records.map((pr: any) => (
                    <div key={pr.category} className="card p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium">{pr.category}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {new Date(pr.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[15px] font-bold text-white">{pr.formatted}</p>
                        {pr.is_new && <span className="text-[9px] font-medium text-accent-gold">NEW PR!</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Milestones */}
            {weekly.next_milestone && (
              <motion.div variants={fadeUp} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="label">Next Milestone</p>
                  <span className="text-[11px] font-mono text-accent">{weekly.next_milestone.progress_percent}%</span>
                </div>
                <p className="text-[13px] font-medium">{weekly.next_milestone.name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{weekly.next_milestone.remaining}</p>
                <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold"
                    style={{ width: `${weekly.next_milestone.progress_percent}%` }}
                  />
                </div>
              </motion.div>
            )}

            {/* Improvement velocity */}
            {weekly.improvement_velocity && weekly.improvement_velocity.pace_improvement_per_week !== 0 && (
              <motion.div variants={fadeUp} className="card p-4 text-center">
                <p className="label mb-1">Improvement Rate</p>
                <p className="font-mono text-xl font-bold text-accent">
                  {weekly.improvement_velocity.pace_improvement_per_week > 0 ? '-' : '+'}
                  {Math.abs(weekly.improvement_velocity.pace_improvement_per_week)}s
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">per km, per week</p>
              </motion.div>
            )}
          </>
        )}

        {/* Empty state */}
        {!improvement?.has_data && (
          <motion.div variants={fadeUp} className="text-center py-16">
            <p className="text-3xl mb-3">📈</p>
            <p className="text-zinc-400 text-sm">Complete a few runs to see your progress</p>
            <p className="text-zinc-600 text-xs mt-1">We track every improvement automatically</p>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
