import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Bolt, Check } from '../ss/icons';

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
          style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,5,11,.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: 16 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="ss-surface"
            style={{ borderRadius: 22, padding: 20, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={step === 'confirm' ? 'Confirm redemption' : 'Redemption successful'}
          >
            {step === 'confirm' && (
              <>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ font: '600 15px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)', margin: 0 }}>
                    Redeem this offer?
                  </p>
                  <p style={{ font: '400 12px var(--body)', color: 'var(--muted)', margin: 0 }}>
                    <span style={{ font: '600 12px var(--body)', color: 'var(--fg)' }}>{offer.offer_title}</span> from {offer.brand_name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                    <Bolt width={15} height={15} style={{ color: 'var(--accent-2)', alignSelf: 'center' }} />
                    <span className="num" style={{ font: '700 20px var(--mono)', color: 'var(--accent-2)' }}>
                      -{offer.kendu_cost.toLocaleString()}
                    </span>
                    <span style={{ font: '500 11px var(--body)', color: 'var(--muted-2)' }}>Kendu</span>
                  </div>
                </div>

                {error && (
                  <p style={{ font: '500 11px var(--body)', color: 'var(--amber)', textAlign: 'center', margin: 0 }}>{error}</p>
                )}

                <div style={{ display: 'flex', gap: 9 }}>
                  <button className="ss-btn ss-btn-soft" style={{ height: 44, fontSize: 13.5 }} onClick={handleClose}>
                    Cancel
                  </button>
                  <button className="ss-btn ss-btn-primary" style={{ height: 44, fontSize: 13.5 }} onClick={handleConfirm} disabled={loading}>
                    {loading ? 'Redeeming…' : 'Confirm'}
                  </button>
                </div>
              </>
            )}

            {step === 'success' && (
              <>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    style={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(52,211,153,.14)', border: '1px solid rgba(52,211,153,.3)' }}
                  >
                    <Check width={20} height={20} style={{ color: 'var(--green)' }} />
                  </motion.span>
                  <p style={{ font: '600 15px var(--head)', color: 'var(--green)', margin: 0 }}>Redeemed!</p>
                  <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: 0 }}>Here's your coupon code:</p>

                  <button
                    onClick={copyCode}
                    className="tile recess w-full"
                    style={{ alignItems: 'center', padding: '13px 12px', cursor: 'pointer' }}
                  >
                    <span className="num" style={{ font: '700 18px var(--mono)', letterSpacing: '.08em', color: 'var(--fg)' }}>
                      {couponCode}
                    </span>
                    <span style={{ font: '500 10.5px var(--body)', color: 'var(--muted-2)', marginTop: 4 }}>Tap to copy</span>
                  </button>

                  <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', margin: 0 }}>
                    New balance: {newBalance.toLocaleString()} Kendu
                  </p>
                </div>

                <button className="ss-btn ss-btn-soft" style={{ height: 44, fontSize: 13.5 }} onClick={handleClose}>
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
