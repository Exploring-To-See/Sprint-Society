interface ProgressRingProps {
  currentDistance: number;
  goalDistance: number;
  currentPace: number;
  targetPaceMin: number;
  targetPaceMax: number;
}

export function ProgressRing({ currentDistance, goalDistance, currentPace, targetPaceMin, targetPaceMax }: ProgressRingProps) {
  const progress = Math.min(1, currentDistance / goalDistance);
  const circumference = 2 * Math.PI * 72;
  const dashOffset = circumference * (1 - progress);

  const inZone = currentPace >= targetPaceMin && currentPace <= targetPaceMax;
  const tooSlow = currentPace > targetPaceMax;
  const paceColor = inZone ? '#22c55e' : tooSlow ? '#ef4444' : '#f59e0b';
  const paceLabel = inZone ? 'IN ZONE' : tooSlow ? 'SLOW DOWN' : 'TOO FAST';

  function formatPace(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="relative w-[180px] h-[180px] mx-auto">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Background ring */}
        <circle
          cx="90" cy="90" r="72"
          fill="none" stroke="#1f1f2e" strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="90" cy="90" r="72"
          fill="none" stroke="#f97316" strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          className="transition-all duration-500"
        />
      </svg>

      {/* Center content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-[36px] font-bold font-mono tracking-tight" style={{ color: paceColor }}>
          {formatPace(currentPace)}
        </div>
        <div className="text-[11px] font-semibold mt-0.5" style={{ color: paceColor }}>
          {paceLabel}
        </div>
        <div className="text-[11px] text-zinc-500 mt-1.5">
          {(currentDistance / 1000).toFixed(2)} / {(goalDistance / 1000).toFixed(1)} km
        </div>
      </div>
    </div>
  );
}
