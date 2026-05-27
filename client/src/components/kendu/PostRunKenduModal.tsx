import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface KenduEarnResult {
  pointsEarned: number;
  breakdown: {
    base: number;
    coachMultiplier?: number;
    personalBest?: number;
    streakBonus?: number;
    consistencyBonus?: number;
  };
  newBalance: number;
  streakDays: number;
  streakBonusAwarded: boolean;
  consistencyBonusAwarded: boolean;
  cappedToday: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: KenduEarnResult | null;
}

export function PostRunKenduModal({ isOpen, onClose, result }: Props) {
  const [animatedPoints, setAnimatedPoints] = useState(0);

  useEffect(() => {
    if (!isOpen || !result) return;
    setAnimatedPoints(0);
    const target = result.pointsEarned;
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedPoints(target);
        clearInterval(interval);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [isOpen, result]);

  if (!result) return null;

  const breakdownItems = [
    { label: 'Distance', value: result.breakdown.base, show: result.breakdown.base > 0 },
    { label: 'Coach bonus (1.5x)', value: result.breakdown.coachMultiplier, show: !!result.breakdown.coachMultiplier },
    { label: 'Personal Best!', value: result.breakdown.personalBest, show: !!result.breakdown.personalBest },
    { label: '7-day streak milestone', value: result.breakdown.streakBonus, show: !!result.breakdown.streakBonus },
    { label: '4+ runs this week', value: result.breakdown.consistencyBonus, show: !!result.breakdown.consistencyBonus },
  ].filter(i => i.show);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-bg-secondary border border-orange-500/30 rounded-2xl p-6 w-full max-w-sm space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                className="text-4xl"
              >
                🔥
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-orange-400"
              >
                +{animatedPoints} Kendu
              </motion.p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">earned this run</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              {breakdownItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center justify-between text-[12px]"
                >
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="text-orange-300 font-semibold">+{item.value}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-between pt-3 border-t border-bg-tertiary"
            >
              <div className="text-center">
                <p className="text-[13px] font-bold text-zinc-200">{result.newBalance.toLocaleString()}</p>
                <p className="text-[9px] text-zinc-500">Balance</p>
              </div>
              <div className="text-center">
                <p className="text-[13px] font-bold text-zinc-200">🔥 {result.streakDays}d</p>
                <p className="text-[9px] text-zinc-500">Streak</p>
              </div>
              {result.cappedToday && (
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-amber-400">Max today</p>
                  <p className="text-[9px] text-zinc-500">Daily cap reached</p>
                </div>
              )}
            </motion.div>

            {/* PB Celebration */}
            {result.breakdown.personalBest && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="text-center bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg py-2"
              >
                <p className="text-[12px] font-bold text-yellow-400">New Personal Best!</p>
              </motion.div>
            )}

            {/* Close */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-orange-500/20 text-orange-400 text-[13px] font-semibold hover:bg-orange-500/30 transition-colors"
            >
              Nice!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
