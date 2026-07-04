// Split bars — mono instrument rows on semantic tints (logic unchanged, tokens only).
import { motion } from 'framer-motion';

interface SplitChartProps {
  splits: Array<{ km: number; time_seconds: number }>;
  averagePace: number; // seconds per km
}

function formatPace(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function SplitChart({ splits, averagePace }: SplitChartProps) {
  if (!splits || splits.length === 0) return null;

  const maxTime = Math.max(...splits.map(s => s.time_seconds));
  const minTime = Math.min(...splits.map(s => s.time_seconds));
  const fastestKm = splits.reduce((min, s) => (s.time_seconds < min.time_seconds ? s : min), splits[0]);
  const slowestKm = splits.reduce((max, s) => (s.time_seconds > max.time_seconds ? s : max), splits[0]);

  const getBarWidth = (time: number) => {
    if (maxTime === minTime) return 75;
    return Math.max(30, (time / maxTime) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <p className="tlbl">Splits</p>
        <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>
          Avg <span style={{ color: 'var(--muted)' }}>{formatPace(averagePace)}</span>/km
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {splits.map((split, index) => {
          const isFastest = split.km === fastestKm.km && splits.length > 1;
          const isSlowest = split.km === slowestKm.km && splits.length > 1;
          const isFasterThanAvg = split.time_seconds < averagePace;

          const barBg = isFastest ? 'rgba(52,211,153,.2)'
            : isSlowest ? 'rgba(251,191,36,.14)'
            : isFasterThanAvg ? 'rgba(52,211,153,.1)'
            : 'rgba(249,115,22,.1)';
          const barBorder = isFastest ? 'rgba(52,211,153,.3)'
            : isSlowest ? 'rgba(251,191,36,.26)'
            : isFasterThanAvg ? 'rgba(52,211,153,.15)'
            : 'rgba(249,115,22,.15)';
          const barText = isFastest ? 'var(--green)'
            : isSlowest ? 'var(--amber)'
            : isFasterThanAvg ? 'rgba(52,211,153,.8)'
            : 'var(--accent-2)';

          return (
            <motion.div
              key={split.km}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span className="num" style={{ font: '600 10px var(--mono)', color: 'var(--muted-2)', width: 24, textAlign: 'right', flexShrink: 0 }}>
                {split.km}
              </span>

              <div style={{ flex: 1, position: 'relative', height: 26, display: 'flex', alignItems: 'center' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getBarWidth(split.time_seconds)}%` }}
                  transition={{ delay: index * 0.08 + 0.1, duration: 0.5, ease: 'easeOut' }}
                  style={{
                    height: '100%', borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 10px',
                    background: barBg, border: `1px solid ${barBorder}`,
                  }}
                >
                  <span className="num" style={{ font: '600 11px var(--mono)', color: barText }}>
                    {formatPace(split.time_seconds)}
                  </span>
                </motion.div>
              </div>

              {isFastest && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.3, type: 'spring' }}
                  className="ss-dchip good"
                  style={{ flexShrink: 0 }}
                >
                  Fast
                </motion.span>
              )}
              {isSlowest && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.3, type: 'spring' }}
                  className="ss-dchip warn"
                  style={{ flexShrink: 0 }}
                >
                  Slow
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 2 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 10.5px var(--body)', color: 'var(--muted-2)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(52,211,153,.3)' }} aria-hidden="true" />
          Faster than avg
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 10.5px var(--body)', color: 'var(--muted-2)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(249,115,22,.3)' }} aria-hidden="true" />
          Slower than avg
        </span>
      </div>
    </div>
  );
}
