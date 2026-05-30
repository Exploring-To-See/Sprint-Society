import { motion } from 'framer-motion';

export function ChatTab() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚔️</span>
        </div>
        <h3 className="text-[16px] font-bold text-white mb-2">AI Coach Chat</h3>
        <p className="text-[12px] text-zinc-500 leading-relaxed max-w-[260px] mx-auto mb-4">
          Have a real conversation with your Warrior coach — ask about training, nutrition, recovery, race strategy, or anything running.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/8 border border-accent/15">
          <span className="text-[11px] text-accent font-semibold">Coming Soon</span>
        </div>
        <p className="text-[10px] text-zinc-600 mt-4 max-w-[220px] mx-auto">
          Your coach already guides you via training plans, pre-run briefs, and post-run analysis. Full chat launching soon.
        </p>
      </motion.div>
    </div>
  );
}
