import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  offer: { id: number; brand_name: string; offer_title: string; kendu_cost: number } | null;
  onConfirm: (offerId: number) => Promise<{ couponCode: string; newBalance: number } | null>;
}

export function RedeemModal({ isOpen, onClose, offer, onConfirm }: Props) {
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [couponCode, setCouponCode] = useState('');
  const [newBalance, setNewBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!offer) return;
    setLoading(true);
    setError('');
    const result = await onConfirm(offer.id);
    setLoading(false);
    if (result) {
      setCouponCode(result.couponCode);
      setNewBalance(result.newBalance);
      setStep('success');
    } else {
      setError('Redemption failed. Please try again.');
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setCouponCode('');
    setError('');
    onClose();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(couponCode);
  };

  if (!offer) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-6 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {step === 'confirm' && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-[14px] font-semibold text-zinc-200">Redeem this offer?</p>
                  <p className="text-[12px] text-zinc-400">
                    <span className="font-semibold text-zinc-300">{offer.offer_title}</span> from {offer.brand_name}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span>🔥</span>
                    <span className="text-lg font-bold text-orange-400">-{offer.kendu_cost.toLocaleString()}</span>
                    <span className="text-[11px] text-zinc-500">Kendu</span>
                  </div>
                </div>

                {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-lg bg-bg-tertiary text-zinc-400 text-[12px] font-semibold hover:bg-bg-tertiary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-[12px] font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Redeeming...' : 'Confirm'}
                  </button>
                </div>
              </>
            )}

            {step === 'success' && (
              <>
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="text-4xl"
                  >
                    🎉
                  </motion.div>
                  <p className="text-[14px] font-semibold text-emerald-400">Redeemed!</p>
                  <p className="text-[11px] text-zinc-400">Here's your coupon code:</p>

                  <button
                    onClick={copyCode}
                    className="w-full py-3 rounded-lg bg-bg-tertiary border border-bg-tertiary hover:border-orange-500/30 transition-colors"
                  >
                    <p className="text-lg font-mono font-bold text-zinc-100 tracking-wider">{couponCode}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Tap to copy</p>
                  </button>

                  <p className="text-[10px] text-zinc-500">New balance: {newBalance.toLocaleString()} Kendu</p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-lg bg-orange-500/20 text-orange-400 text-[12px] font-semibold hover:bg-orange-500/30 transition-colors"
                >
                  Done
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
