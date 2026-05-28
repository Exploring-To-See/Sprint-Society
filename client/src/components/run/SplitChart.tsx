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

  // Scale bars: slowest gets 100% width, fastest gets proportional
  const getBarWidth = (time: number) => {
    if (maxTime === minTime) return 75;
    // Invert: faster (lower time) = shorter bar visually, OR
    // We show slower = wider bar (more time taken)
    return Math.max(30, (time / maxTime) * 100);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          Splits
        </p>
        <p className="text-[10px] text-zinc-600">
          Avg: <span className="font-mono text-zinc-400">{formatPace(averagePace)}</span>/km
        </p>
      </div>

      <div className="space-y-1.5">
        {splits.map((split, index) => {
          const isFastest = split.km === fastestKm.km;
          const isSlowest = split.km === slowestKm.km && splits.length > 1;
          const isFasterThanAvg = split.time_seconds < averagePace;

          return (
            <motion.div
              key={split.km}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="flex items-center gap-2"
            >
              {/* Km label */}
              <span className="text-[10px] text-zinc-500 font-mono w-8 text-right flex-shrink-0">
                {split.km}
              </span>

              {/* Bar container */}
              <div className="flex-1 relative h-7 flex items-center">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getBarWidth(split.time_seconds)}%` }}
                  transition={{
                    delay: index * 0.08 + 0.1,
                    duration: 0.5,
                    ease: 'easeOut',
                  }}
                  className={`h-full rounded-md flex items-center px-2.5 ${
                    isFastest
                      ? 'bg-accent-green/20 border border-accent-green/30'
                      : isSlowest
                        ? 'bg-red-500/15 border border-red-500/25'
                        : isFasterThanAvg
                          ? 'bg-accent-green/10 border border-accent-green/15'
                          : 'bg-orange-500/10 border border-orange-500/15'
                  }`}
                >
                  <span
                    className={`text-[11px] font-mono font-semibold ${
                      isFastest
                        ? 'text-accent-green'
                        : isSlowest
                          ? 'text-red-400'
                          : isFasterThanAvg
                            ? 'text-green-400/80'
                            : 'text-orange-400/80'
                    }`}
                  >
                    {formatPace(split.time_seconds)}
                  </span>
                </motion.div>
              </div>

              {/* Badge */}
              {isFastest && splits.length > 1 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.3, type: 'spring' }}
                  className="text-[11px] font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded flex-shrink-0"
                >
                  FAST
                </motion.span>
              )}
              {isSlowest && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.3, type: 'spring' }}
                  className="text-[11px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0"
                >
                  SLOW
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-accent-green/30" />
          <span className="text-[11px] text-zinc-600">Faster than avg</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-orange-500/30" />
          <span className="text-[11px] text-zinc-600">Slower than avg</span>
        </div>
      </div>
    </div>
  );
}
