// Readiness gauge / orb — the radial centerpiece (UI-UX §6.1). Brand orange gaugeGrad
// arc + soft bloom for the live readiness orb (the screen's ONE living motion), or an
// inert muted-violet "plan" variant. Arc draws on entrance; pinned under reduced-motion.
import { motion, useReducedMotion } from 'framer-motion';
import { useId } from 'react';

interface GaugeProps {
  value: number;            // 0–100, drives the arc fill
  display: string;          // big readout inside (number or short word)
  caption?: string;         // small caps caption under the readout
  variant?: 'live' | 'plan';
  size?: number;
  ariaLabel?: string;
  breath?: boolean;         // the single living breath (live only)
}

export function Gauge({
  value, display, caption, variant = 'live', size = 88, ariaLabel, breath = true,
}: GaugeProps) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circ * (1 - pct / 100);
  const isPlan = variant === 'plan';
  const stroke = isPlan ? 'rgba(167,139,250,.5)' : `url(#gg-${uid})`;
  const numSize = display.length > 3 ? 18 : 26;

  return (
    <div
      className="gauge"
      role="img"
      aria-label={ariaLabel || `${display}${caption ? ` ${caption}` : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`gg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F97316" />
            <stop offset=".55" stopColor="#FB923C" />
            <stop offset="1" stopColor="#FBBF24" />
          </linearGradient>
        </defs>
        <circle cx="44" cy="44" r={r} stroke="rgba(255,255,255,.09)" strokeWidth="7" fill="none" />
        <motion.circle
          cx="44" cy="44" r={r}
          stroke={stroke} strokeWidth="7" fill="none" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: reduce ? offset : circ }}
          animate={{ strokeDashoffset: offset }}
          transition={reduce ? { duration: 0 } : { duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={!isPlan ? { filter: 'drop-shadow(0 0 6px rgba(249,115,22,.5))' } : undefined}
        />
      </svg>
      <motion.div
        className="gctr"
        animate={!isPlan && breath && !reduce ? { scale: [1, 1.02, 1] } : undefined}
        transition={{ duration: 4.6, ease: [0.16, 1, 0.3, 1], repeat: Infinity, delay: 1.7 }}
      >
        <span className="gnum" style={{ fontSize: numSize }}>{display}</span>
        {caption && (
          <span className="gcap" style={isPlan ? { color: 'var(--violet-2)' } : undefined}>{caption}</span>
        )}
      </motion.div>
    </div>
  );
}
