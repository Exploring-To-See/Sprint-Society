interface ZoneBarProps {
  currentPace: number;
  targetPaceMin: number;
  targetPaceMax: number;
}

export function ZoneBar({ currentPace, targetPaceMin, targetPaceMax }: ZoneBarProps) {
  const slowBound = targetPaceMax + 60;
  const fastBound = targetPaceMin - 60;
  const range = slowBound - fastBound;

  const position = Math.max(0, Math.min(100, ((slowBound - currentPace) / range) * 100));

  function formatPace(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="mx-2">
      {/* Bar */}
      <div className="relative h-4 rounded-full overflow-hidden flex">
        <div className="flex-1 bg-gradient-to-r from-red-500 to-orange-500" />
        <div className="flex-[1.5] bg-gradient-to-r from-orange-500 via-green-500 to-orange-500" />
        <div className="flex-1 bg-gradient-to-r from-orange-500 to-red-500" />
      </div>

      {/* Position marker */}
      <div className="relative -mt-[13px] h-[13px]">
        <div
          className="absolute w-[3px] h-[13px] bg-white rounded-sm shadow-[0_0_6px_rgba(255,255,255,0.6)] transition-all duration-300"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1.5 text-[11px]">
        <span className="text-red-400">Slow</span>
        <span className="text-green-400 font-semibold">{formatPace(targetPaceMin)}–{formatPace(targetPaceMax)}</span>
        <span className="text-red-400">Fast</span>
      </div>
    </div>
  );
}
