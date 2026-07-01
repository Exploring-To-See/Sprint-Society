import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventName: string;
  eventDate: string;
}

export function RegistrationModal({ isOpen, onClose, onConfirm, eventName, eventDate }: RegistrationModalProps) {
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const name = (user as any)?.name || '';
  const phone = (user as any)?.phone || '';
  const email = (user as any)?.email || '';

  const handleConfirm = async () => {
    if (!agreed) return;
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-bg-secondary border border-bg-tertiary rounded-2xl p-6"
          >
            <h3 className="text-[16px] font-bold text-white mb-1">Register for Event</h3>
            <p className="text-[11px] text-zinc-500 mb-5">{eventName} · {eventDate}</p>

            <div className="space-y-3">
              <div className="px-3.5 py-2.5 rounded-lg bg-bg-primary border border-bg-tertiary text-[11px] text-zinc-300">
                {name || 'Your name'}
              </div>
              <div className="px-3.5 py-2.5 rounded-lg bg-bg-primary border border-bg-tertiary text-[11px] text-zinc-300">
                {phone || 'Phone number'}
              </div>
              <div className="px-3.5 py-2.5 rounded-lg bg-bg-primary border border-bg-tertiary text-[11px] text-zinc-300">
                {email || 'Email'}
              </div>
            </div>

            <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 accent-accent"
              />
              <span className="text-[10px] text-zinc-400">I commit to show up or notify 24h before</span>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!agreed || submitting}
              className="w-full mt-5 py-3 rounded-lg bg-accent text-white text-[12px] font-bold disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {submitting ? 'Registering...' : 'Confirm Registration'}
            </button>

            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-[11px] text-zinc-500 text-center"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
