import { motion } from 'framer-motion';

interface PR {
  category: string;
  formatted: string;
  date: string;
  improvement?: { formatted: string; percent: number };
}

interface PRBannerProps {
  pr: PR;
  totalPRs: number;
}

export function PRBanner({ pr, totalPRs }: PRBannerProps) {
  const isRecent = Date.now() - new Date(pr.date).getTime() < 7 * 86400000;

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-accent-gold/20 bg-gradient-to-r from-accent-gold/5 via-accent/5 to-transparent p-4"
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
            <span className="text-base">{isRecent ? '🏆' : '⚡'}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent-gold/80">
              {isRecent ? 'New PR' : 'Personal Best'}
            </p>
            <p className="text-[13px] font-semibold text-white mt-0.5">
              {pr.category}: <span className="font-mono">{pr.formatted}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          {pr.improvement && (
            <p className="text-[11px] font-mono font-medium text-accent-green">
              -{pr.improvement.formatted}
            </p>
          )}
          <p className="text-[9px] text-zinc-600 mt-0.5">
            {totalPRs} records total
          </p>
        </div>
      </div>

      {/* Subtle shimmer effect for new PRs */}
      {isRecent && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-gold/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
      )}
    </motion.div>
  );
}
