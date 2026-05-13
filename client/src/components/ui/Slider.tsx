interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  formatValue?: (value: number) => string;
}

export function Slider({ value, onChange, min, max, step = 1, label, unit, formatValue }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : `${value}`;

  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50 tracking-wide">{label}</span>
        <span className="text-xl font-bold font-mono text-white tabular-nums">
          {displayValue}
          {unit && <span className="text-sm text-white/40 ml-1 font-normal">{unit.trim()}</span>}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 active:bg-white/10 active:scale-95 transition-all"
        >
          −
        </button>

        <div className="flex-1 relative flex items-center">
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/60 to-white transition-[width] duration-75"
              style={{ width: `${percent}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-pan-x"
          />
        </div>

        <button
          type="button"
          onClick={increment}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 active:bg-white/10 active:scale-95 transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
}
