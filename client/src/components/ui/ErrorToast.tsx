import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastMessage {
  id: number;
  message: string;
}

let toastId = 0;

export function ErrorToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (e: CustomEvent<{ message: string; code: string; status: number }>) => {
      if (e.detail.status === 401) return;
      const id = ++toastId;
      setToasts(prev => [...prev.slice(-2), { id, message: e.detail.message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    window.addEventListener('sprint:api-error', handler as EventListener);
    return () => window.removeEventListener('sprint:api-error', handler as EventListener);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[90vw] max-w-[340px]">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-[13px] font-medium shadow-lg"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
