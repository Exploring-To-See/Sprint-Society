interface ZoneSplitChartProps {
  splits: Array<{ pace: number; km: number }>;
  targetPaceMin: number;
  targetPaceMax: number;
}

export function ZoneSplitChart({ splits, targetPaceMin, targetPaceMax }: ZoneSplitChartProps) {
  if (!splits || splits.length === 0) return null;

  const allPaces = splits.map(s => s.pace);
  const maxPace = Math.max(...allPaces, targetPaceMax + 30);
  const minPace = Math.min(...allPaces, targetPaceMin - 30);
  const range = maxPace - minPace;

  const chartW = 280;
  const chartH = 70;
  const padding = 20;

  function paceToY(pace: number): number {
    return padding + ((pace - minPace) / range) * (chartH - padding * 2);
  }

  const targetTopY = paceToY(targetPaceMin);
  const targetBottomY = paceToY(targetPaceMax);

  const points = splits.map((s, i) => {
    const x = padding + (i / (splits.length - 1)) * (chartW - padding * 2);
    const y = paceToY(s.pace);
    return { x, y, pace: s.pace, km: s.km };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

  const inZoneCount = splits.filter(s => s.pace >= targetPaceMin && s.pace <= targetPaceMax).length;

  function formatPace(sec: number): string {
    const m = Math.floor(sec / 60);
    const s2 = Math.round(sec % 60);
    return `${m}:${s2.toString().padStart(2, '0')}`;
  }

  return (
    <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Splits</span>
        <span className="text-[11px] font-bold text-accent-green">{inZoneCount}/{splits.length} in zone</span>
      </div>

      <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
        {/* Target zone band */}
        <rect
          x="0" y={targetTopY}
          width={chartW} height={targetBottomY - targetTopY}
          fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.2)" strokeWidth="0.5" rx="2"
        />

        {/* Area fill */}
        <path d={areaD} fill="rgba(249,115,22,0.08)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, i) => {
          const inZone = splits[i].pace >= targetPaceMin && splits[i].pace <= targetPaceMax;
          return (
            <circle
              key={i}
              cx={p.x} cy={p.y} r="4"
              fill={inZone ? '#22c55e' : splits[i].pace < targetPaceMin ? '#dc2626' : '#fb923c'}
            />
          );
        })}
      </svg>

      <div className="flex justify-between mt-1">
        {splits.map((s, i) => (
          <span key={i} className={`text-[11px] ${
            s.pace >= targetPaceMin && s.pace <= targetPaceMax ? 'text-accent-green' :
            s.pace < targetPaceMin ? 'text-red-400' : 'text-zinc-500'
          }`}>
            {formatPace(s.pace)}
          </span>
        ))}
      </div>
    </div>
  );
}
