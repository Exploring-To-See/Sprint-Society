import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

export function AIAnalyticsTab() {
  const { data: adaptive } = useQuery({
    queryKey: ['adaptive-load'],
    queryFn: () => api.get('/adaptive/load').then(r => r.data).catch(() => null),
  });

  const { data: summary } = useQuery({
    queryKey: ['adaptive-summary'],
    queryFn: () => api.get('/adaptive/summary').then(r => r.data).catch(() => null),
  });

  const { data: vdotProg } = useQuery({
    queryKey: ['vdot-progression'],
    queryFn: () => api.get('/adaptive/vdot-progression').then(r => r.data).catch(() => null),
  });

  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data).catch(() => null),
  });

  const { data: predictions } = useQuery({
    queryKey: ['race-predictions'],
    queryFn: async () => {
      const [p5k, p10k, phm, pm] = await Promise.all([
        api.get('/training/predict?distance=5000').then(r => r.data).catch(() => null),
        api.get('/training/predict?distance=10000').then(r => r.data).catch(() => null),
        api.get('/training/predict?distance=21097').then(r => r.data).catch(() => null),
        api.get('/training/predict?distance=42195').then(r => r.data).catch(() => null),
      ]);
      return { '5K': p5k, '10K': p10k, 'Half': phm, 'Marathon': pm };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['run-stats'],
    queryFn: () => api.get('/runs/stats').then(r => r.data).catch(() => null),
  });

  const { data: records } = useQuery({
    queryKey: ['records'],
    queryFn: () => api.get('/records').then(r => r.data).catch(() => null),
  });

  const { data: kenduBal } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data).catch(() => null),
  });

  const vo2max = tier?.estimated_vo2max || summary?.vo2max || null;
  const ageGrade = tier?.age_graded_percentage || null;
  const vdot = summary?.vdot || vdotProg?.current_vdot || null;
  const trainingLoad = adaptive?.training_stress_balance;
  const injuryRisk = adaptive?.injury_risk || 'Unknown';
  const readiness = summary?.readiness;
  const streakDays = kenduBal?.current_streak_days || 0;

  function formatTime(seconds: number | null | undefined): string {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function formatPace(sec: number | null | undefined): string {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="space-y-4">
      <p className="text-[9px] font-bold text-accent uppercase tracking-[0.2em]">⚡ AI Analytics</p>

      {/* Tier 1: Core Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="VO₂ Max" value={vo2max ? vo2max.toFixed(1) : '—'} sub="ml/kg/min" color={vo2max && vo2max > 40 ? 'green' : 'default'} />
        <MetricCard label="VDOT" value={vdot ? vdot.toFixed(1) : '—'} sub="Jack Daniels" />
        <MetricCard label="Age Grade" value={ageGrade ? `${Math.round(ageGrade)}%` : '—'} sub="vs world records" />
        <MetricCard
          label="Training Load"
          value={trainingLoad !== undefined ? (trainingLoad > 5 ? 'Fresh' : trainingLoad > -5 ? 'Optimal' : 'Fatigued') : '—'}
          sub={trainingLoad !== undefined ? `TSB: ${trainingLoad.toFixed(0)}` : ''}
          color={trainingLoad !== undefined ? (trainingLoad > 0 ? 'green' : trainingLoad > -10 ? 'yellow' : 'red') : 'default'}
        />
        <MetricCard
          label="Injury Risk"
          value={typeof injuryRisk === 'string' ? injuryRisk : injuryRisk?.level || '—'}
          sub={adaptive?.acute_chronic_ratio ? `ACWR: ${adaptive.acute_chronic_ratio.toFixed(2)}` : ''}
          color={injuryRisk === 'Low' || injuryRisk?.level === 'Low' ? 'green' : 'yellow'}
        />
        <MetricCard
          label="Readiness"
          value={readiness?.score ? `${readiness.score}%` : '—'}
          sub={readiness?.label || ''}
          color={readiness?.score > 75 ? 'green' : readiness?.score > 50 ? 'yellow' : 'red'}
        />
      </div>

      {/* Tier 2: Training Intelligence */}
      <div>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Training Intelligence</p>

        {/* Race Predictions */}
        <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3 mb-2">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Race Predictions</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {(['5K', '10K', 'Half', 'Marathon'] as const).map(dist => (
              <div key={dist} className="flex justify-between">
                <span className="text-[11px] text-zinc-500">{dist}</span>
                <span className="text-[11px] font-bold text-white">
                  {predictions?.[dist]?.predicted_time ? formatTime(predictions[dist].predicted_time) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pace Trajectory */}
        <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Pace Trajectory (30d)</span>
            <span className="text-[9px] font-bold text-accent-green">
              {summary?.pace_trend === 'improving' ? '↗ Improving' : summary?.pace_trend === 'declining' ? '↘ Declining' : '→ Stable'}
            </span>
          </div>
          <svg width="100%" height="40" viewBox="0 0 300 40" preserveAspectRatio="none" className="opacity-80">
            <line x1="0" y1="8" x2="300" y2="8" stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="3" />
            <path d="M0,35 C75,30 150,22 225,15 L300,10" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
            <circle cx="300" cy="10" r="3" fill="#f97316" />
          </svg>
          {stats?.avg_pace && (
            <p className="text-[9px] text-zinc-600 mt-1">Current avg: {formatPace(stats.avg_pace)}/km</p>
          )}
        </div>

        {/* More metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Improvement" value={summary?.improvement_per_week ? `${summary.improvement_per_week.toFixed(1)}s` : '—'} sub="/km per week" />
          <MetricCard label="Plan Compliance" value={summary?.compliance ? `${Math.round(summary.compliance)}%` : '—'} sub="sessions done" />
        </div>
      </div>

      {/* Tier 5: Milestones */}
      <div>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Milestones & Records</p>

        {/* Distance milestone */}
        {stats && (
          <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[14px]">🏅</span>
              <span className="text-[11px] font-bold text-white">
                Next: {stats.total_distance < 100000 ? '100' : stats.total_distance < 200000 ? '200' : stats.total_distance < 500000 ? '500' : '1000'}km
              </span>
            </div>
            <div className="h-[3px] rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold"
                style={{ width: `${Math.min(100, (stats.total_distance / (stats.total_distance < 100000 ? 100000 : stats.total_distance < 200000 ? 200000 : 500000)) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] text-zinc-600 mt-1">{(stats.total_distance / 1000).toFixed(0)}km total</p>
          </div>
        )}

        {/* Personal Bests */}
        {records && records.length > 0 && (
          <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3 mb-2">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Personal Bests</p>
            <div className="grid grid-cols-3 gap-2">
              {records.slice(0, 6).map((r: any, i: number) => (
                <div key={i} className="text-center p-2 rounded-lg bg-bg-primary/50">
                  <div className="text-[11px] font-bold text-white">{r.formatted_time || formatPace(r.pace)}</div>
                  <div className="text-[7px] text-zinc-600 mt-0.5">{r.distance_label || r.category}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier Progression */}
        {tier && (
          <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3 mb-2">
            <p className="text-[10px] text-zinc-500">
              Tier: <span className="font-bold text-accent">{tier.tier}</span>
              {tier.score && <span className="text-zinc-600"> · Score: {Math.round(tier.score)}/100</span>}
            </p>
          </div>
        )}

        {/* Streak (contextual, only here) */}
        {streakDays > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary">
            <span className="text-[14px]">🔥</span>
            <span className="text-[10px] text-zinc-500">
              {streakDays}-day streak · Next +10 Kendu at day {Math.ceil(streakDays / 7) * 7}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color = 'default' }: { label: string; value: string; sub?: string; color?: 'green' | 'yellow' | 'red' | 'default' }) {
  const colorClass = color === 'green' ? 'text-accent-green' : color === 'yellow' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : 'text-white';

  return (
    <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3">
      <p className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-[18px] font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="text-[8px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}
