import { motion } from 'framer-motion';

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
  const displayValue = formatValue ? formatValue(value) : `${value}${unit || ''}`;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/60 font-medium">{label}</span>
        <motion.span
          key={value}
          initial={{ scale: 1.2, color: '#39FF14' }}
          animate={{ scale: 1, color: '#ffffff' }}
          className="text-lg font-mono font-bold"
        >
          {displayValue}
        </motion.span>
      </div>
      <div className="relative">
        <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-green/70 to-accent-green rounded-full"
            style={{ width: `${percent}%` }}
            layout
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
