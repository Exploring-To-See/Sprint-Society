import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export function PaceDotTrail() {
  const { data: chartData } = useQuery({
    queryKey: ['run-chart-data'],
    queryFn: () => api.get('/runs/chart-data?weeks=6').then(r => r.data).catch(() => []),
  });

  const { data: paces } = useQuery({
    queryKey: ['training-paces'],
    queryFn: () => api.get('/training/paces').then(r => r.data).catch(() => null),
  });

  const runs = (Array.isArray(chartData) ? chartData : [])
    .filter((r: any) => r.average_pace_per_km > 0 && r.distance_meters > 500)
    .slice(-10);

  if (runs.length < 3) return null;

  const pacesArr = runs.map((r: any) => r.average_pace_per_km);
  const maxPace = Math.max(...pacesArr);
  const minPace = Math.min(...pacesArr);
  const targetPace = paces?.race_pace || paces?.tempo_pace || minPace * 0.9;

  const range = maxPace - Math.min(minPace, targetPace);
  const chartH = 55;
  const chartW = 280;
  const padding = 15;

  function paceToY(pace: number): number {
    const normalized = (pace - Math.min(minPace, targetPace)) / (range || 1);
    return padding + normalized * (chartH - padding * 2);
  }

  const targetY = paceToY(targetPace);
  const latestPace = pacesArr[pacesArr.length - 1];
  const oldestPace = pacesArr[0];
  const improvement = oldestPace - latestPace;
  const secToGoal = Math.max(0, latestPace - targetPace);

  function formatPace(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Pace → Target</span>
        <span className="text-[9px] font-bold text-accent-green">
          {secToGoal > 0 ? `${Math.round(secToGoal)}s to goal` : '🎯 At target!'}
        </span>
      </div>

      <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
        {/* Target line */}
        <line
          x1="0" y1={targetY} x2={chartW} y2={targetY}
          stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" strokeDasharray="4"
        />
        <text x={chartW - 2} y={targetY - 4} textAnchor="end" fontSize="7" fill="#22c55e">
          {formatPace(targetPace)} target
        </text>

        {/* Trend line */}
        <line
          x1={padding} y1={paceToY(oldestPace)}
          x2={chartW - padding} y2={paceToY(latestPace)}
          stroke="rgba(249,115,22,0.15)" strokeWidth="1"
        />

        {/* Dots */}
        {runs.map((run: any, i: number) => {
          const x = padding + (i / (runs.length - 1)) * (chartW - padding * 2);
          const y = paceToY(run.average_pace_per_km);
          const isLast = i === runs.length - 1;
          const opacity = 0.4 + (i / runs.length) * 0.6;

          return (
            <circle
              key={i}
              cx={x} cy={y}
              r={isLast ? 5 : 3.5}
              fill={run.average_pace_per_km <= targetPace ? '#22c55e' : '#f97316'}
              opacity={opacity}
              stroke={isLast ? '#fff' : 'none'}
              strokeWidth={isLast ? 1.5 : 0}
            />
          );
        })}
      </svg>

      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-zinc-600">{formatPace(oldestPace)}/km</span>
        <span className="text-[8px] text-zinc-600">{formatPace(latestPace)}/km (latest)</span>
      </div>
    </div>
  );
}
