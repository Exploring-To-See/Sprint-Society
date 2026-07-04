// Live pace ring — the running instrument (tokens only; logic unchanged).
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

  const isStationary = currentPace <= 0 || currentPace < 120;
  const inZone = !isStationary && currentPace >= targetPaceMin && currentPace <= targetPaceMax;
  const tooSlow = !isStationary && currentPace > targetPaceMax;
  const paceColor = isStationary ? 'var(--muted-2)' : inZone ? 'var(--green)' : 'var(--amber)';
  const paceLabel = isStationary ? 'Waiting' : inZone ? 'In zone' : tooSlow ? 'Speed up' : 'Slow down';

  function formatPace(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="72" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="8" />
        <circle
          cx="90" cy="90" r="72"
          fill="none" stroke="var(--accent)" strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset .5s var(--ease)', filter: 'drop-shadow(0 0 6px rgba(249,115,22,.45))' }}
        />
      </svg>

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        <div className="num" style={{ font: '700 36px var(--mono)', letterSpacing: '-.01em', color: paceColor, lineHeight: 1 }}>
          {formatPace(currentPace)}
        </div>
        <div style={{ font: '700 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: paceColor, marginTop: 4 }}>
          {paceLabel}
        </div>
        <div className="num" style={{ font: '500 10.5px var(--mono)', color: 'var(--muted-2)', marginTop: 6 }}>
          {(currentDistance / 1000).toFixed(2)} / {(goalDistance / 1000).toFixed(1)} km
        </div>
      </div>
    </div>
  );
}
