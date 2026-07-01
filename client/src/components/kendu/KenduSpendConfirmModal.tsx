import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  cost: number;
  currentBalance: number;
  loading?: boolean;
}

export function KenduSpendConfirmModal({ isOpen, onClose, onConfirm, title, description, cost, currentBalance, loading }: Props) {
  const canAfford = currentBalance >= cost;
  const remaining = currentBalance - cost;

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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-bg-secondary border border-orange-500/20 rounded-2xl p-5 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <p className="text-[15px] font-bold text-zinc-100">{title}</p>
              <p className="text-[12px] text-zinc-400">{description}</p>
            </div>

            <div className="bg-bg-tertiary/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-zinc-400">Cost</span>
                <span className="text-orange-400 font-bold">-{cost} Kendu</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-zinc-400">Your balance</span>
                <span className="text-zinc-200 font-semibold">{currentBalance} Kendu</span>
              </div>
              <div className="border-t border-zinc-700/50 pt-2 flex items-center justify-between text-[12px]">
                <span className="text-zinc-400">After</span>
                <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                  {canAfford ? `${remaining} Kendu` : `${Math.abs(remaining)} short`}
                </span>
              </div>
            </div>

            {!canAfford && (
              <p className="text-[11px] text-red-400 text-center">
                Keep running to earn more Kendu!
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg bg-bg-tertiary text-zinc-400 text-[13px] font-medium hover:bg-bg-tertiary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!canAfford || loading}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
              >
                {loading ? 'Processing...' : 'Spend'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
