import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { isNative } from '../../lib/native';

export function PageTransition({ children }: { children: ReactNode }) {
  // Native (APK / iOS): no exit/enter fade. Under AnimatePresence mode="wait"
  // the old page fades out BEFORE the next (often lazy-loaded) page mounts, so
  // slower WebViews show a blank frame on every navigation — the "app keeps
  // going blank" report. Web keeps the subtle fade.
  if (isNative) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
