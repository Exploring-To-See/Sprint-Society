import { motion } from 'framer-motion';

interface TrainingLoadRingProps {
  acuteLoad: number;
  chronicLoad: number;
  balance: number;
  injuryRisk: 'low' | 'moderate' | 'high' | 'critical';
  vdot?: number;
  vdotTrend?: 'improving' | 'stable' | 'declining';
}

const RISK_CONFIG = {
  low: { color: 'text-accent-green', bg: 'bg-accent-green', label: 'Balanced', stroke: '#10B981' },
  moderate: { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Watch', stroke: '#FBBF24' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400', label: 'High load', stroke: '#F97316' },
  critical: { color: 'text-red-400', bg: 'bg-red-400', label: 'Overreaching', stroke: '#EF4444' },
};

export function TrainingLoadRing({ acuteLoad, chronicLoad, balance, injuryRisk, vdot, vdotTrend }: TrainingLoadRingProps) {
  const config = RISK_CONFIG[injuryRisk];
  const ratio = chronicLoad > 0 ? Math.min(acuteLoad / chronicLoad, 2) : 1;
  const ringPercent = Math.min(ratio / 2, 1) * 100;

  // SVG arc calculation
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ringPercent / 100) * circumference;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        {/* Ring visualization */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="#27272A" strokeWidth="4" />
            <motion.circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke={config.stroke}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ type: 'spring', stiffness: 60, damping: 15, delay: 0.4 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[11px] font-bold font-mono ${config.color}`}>
              {ratio.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Load metrics */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${config.color}`}>
              {config.label}
            </span>
            <span className="text-[9px] text-zinc-600">A:C ratio</span>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Acute</p>
              <p className="font-mono text-[13px] font-semibold text-white tabular-nums">{acuteLoad}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Chronic</p>
              <p className="font-mono text-[13px] font-semibold text-white tabular-nums">{chronicLoad}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Freshness</p>
              <p className={`font-mono text-[13px] font-semibold tabular-nums ${balance > 0 ? 'text-accent-green' : balance < -10 ? 'text-red-400' : 'text-zinc-400'}`}>
                {balance > 0 ? '+' : ''}{balance}
              </p>
            </div>
          </div>
        </div>

        {/* VDOT badge */}
        {vdot && (
          <div className="shrink-0 text-right">
            <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">VDOT</p>
            <p className="font-mono text-lg font-bold text-white">{vdot}</p>
            {vdotTrend && (
              <span className={`text-[9px] font-medium ${
                vdotTrend === 'improving' ? 'text-accent-green' :
                vdotTrend === 'declining' ? 'text-red-400' : 'text-zinc-500'
              }`}>
                {vdotTrend === 'improving' ? '↑ rising' : vdotTrend === 'declining' ? '↓ falling' : '— stable'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
