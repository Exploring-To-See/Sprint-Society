import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

export function ProgressPill() {
  const [expanded, setExpanded] = useState(false);

  const { data: plan } = useQuery({
    queryKey: ['training-plan'],
    queryFn: () => api.get('/training/plan').then(r => r.data).catch(() => null),
  });

  if (!plan || (!plan.race_name && !plan.goal_name)) return null;

  const goalName = plan.race_name || plan.goal_name || 'Training';
  const currentWeek = plan.current_week || 1;
  const totalWeeks = plan.total_weeks || 8;
  const daysLeft = plan.race_date ? Math.ceil((new Date(plan.race_date).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 active:scale-[0.97] transition-transform"
      >
        <span className="text-[10px] font-bold text-accent-green">✓ On track</span>
        <span className="text-[10px] text-accent-green/70">· Week {currentWeek}/{totalWeeks}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-[10px] text-zinc-400 leading-relaxed">
              <span className="font-bold text-white">{goalName}</span>
              {daysLeft && <span> · {daysLeft} days to race</span>}
              <br />
              Week {currentWeek} of {totalWeeks} · Phase: {plan.current_phase || 'Build'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
