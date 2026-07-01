import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'green' | 'blue' | 'gold';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ value, max = 100, color = 'green', height = 'md', showLabel, label }: ProgressBarProps) {
  const percent = Math.min(100, (value / max) * 100);

  const colors = {
    green: 'from-accent-green/70 to-accent-green',
    blue: 'from-accent-blue/70 to-accent-blue',
    gold: 'from-accent-gold/70 to-accent-gold',
  };

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs text-white/50">
          <span>{label}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div className={`${heights[height]} rounded-full bg-bg-tertiary overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
