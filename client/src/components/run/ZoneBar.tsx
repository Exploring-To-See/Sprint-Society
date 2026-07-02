// Target pace ribbon — neutral track, semantic green target band, white position
// marker (reference: run.html .zone-ribbon). Same math as before; tokens only.
interface ZoneBarProps {
  currentPace: number;
  targetPaceMin: number;
  targetPaceMax: number;
}

export function ZoneBar({ currentPace, targetPaceMin, targetPaceMax }: ZoneBarProps) {
  const slowBound = targetPaceMax + 60;
  const fastBound = targetPaceMin - 60;
  const range = slowBound - fastBound;

  // When not moving (pace = 0 or unreasonably fast), park the marker mid-track
  const isStationary = currentPace <= 0 || currentPace < 120;
  const position = isStationary ? 50 : Math.max(0, Math.min(100, ((slowBound - currentPace) / range) * 100));

  const bandLeft = ((slowBound - targetPaceMax) / range) * 100;
  const bandRight = ((targetPaceMin - fastBound) / range) * 100;

  function formatPace(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div>
      <div
        role="img"
        aria-label={`Target pace band ${formatPace(targetPaceMin)} to ${formatPace(targetPaceMax)} per km`}
        style={{
          position: 'relative', height: 14, borderRadius: 8, overflow: 'visible',
          background: 'rgba(255,255,255,.05)', border: '1px solid var(--hair)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
        }}
      >
        <span style={{
          position: 'absolute', top: 0, bottom: 0, left: `${bandLeft}%`, right: `${bandRight}%`, borderRadius: 6,
          background: 'linear-gradient(90deg,rgba(52,211,153,.16),rgba(52,211,153,.5) 50%,rgba(52,211,153,.16))',
          border: '1px solid rgba(52,211,153,.3)',
        }} />
        <span style={{
          position: 'absolute', top: -3, width: 3, height: 20, borderRadius: 2, background: 'var(--fg)',
          boxShadow: '0 0 6px rgba(255,255,255,.55)', transform: 'translateX(-50%)',
          left: `${position}%`, opacity: isStationary ? .3 : 1, transition: 'left .3s var(--ease), opacity .3s var(--ease)',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ font: '600 9px var(--body)', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)' }}>
          Slow · {formatPace(slowBound)}
        </span>
        <span style={{ font: '600 9px var(--body)', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--green)' }}>
          {formatPace(targetPaceMin)}–{formatPace(targetPaceMax)}
        </span>
        <span style={{ font: '600 9px var(--body)', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)' }}>
          Fast · {formatPace(fastBound)}
        </span>
      </div>
    </div>
  );
}
