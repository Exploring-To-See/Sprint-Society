import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { isNative } from '../../lib/native';

export function PageTransition({ children }: { children: ReactNode }) {
  // Native (APK / iOS): enter-only animation. Exit animations require
  // AnimatePresence mode="wait", which holds the OLD page mounted until its
  // exit completes — on slower WebViews that meant blank frames and, when the
  // exit never resolved, pages that swallowed taps ("buttons don't work").
  // A mount-time fade+lift gives every new page a smooth arrival with zero
  // wait states. Web keeps the full cross-fade under AnimatePresence.
  if (isNative) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    );
  }
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
