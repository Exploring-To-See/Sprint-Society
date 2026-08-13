// Plan progress strip — "On track · Week n/N" with an expandable plan summary.
// Data: GET /training/plan (unchanged).
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { Check } from '../ss/icons';

export function ProgressPill() {
  const [expanded, setExpanded] = useState(false);

  const { data: plan } = useQuery({
    queryKey: ['training-plan'],
    queryFn: () => api.get('/training/plan').then(r => r.data).catch(() => null),
  });

  if (!plan || (!plan.race_name && !plan.goal_name && !plan.goal?.race_name)) return null;

  const goalName = plan.race_name || plan.goal_name || plan.goal?.race_name || 'Training';
  const currentWeek = plan.current_week || 1;
  const totalWeeks = plan.total_weeks || 8;
  const daysLeft = plan.race_date ? Math.ceil((new Date(plan.race_date).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="ss-pad ss-rise" style={{ marginBottom: 11 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        data-testid="progress-pill"
        className="ss-tag go num"
        style={{ cursor: 'pointer', minHeight: 28 }}
      >
        <Check width={10} height={10} /> On track · Week {currentWeek}/{totalWeeks}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="tile recess" style={{ marginTop: 8, borderRadius: 14, padding: 12 }}>
              <p style={{ font: '600 12px var(--body)', color: 'var(--fg)' }}>
                {goalName}
                {daysLeft !== null && <span className="num" style={{ color: 'var(--muted)', fontWeight: 500 }}> · {daysLeft} days to race</span>}
              </p>
              <p className="num" style={{ font: '500 11px var(--body)', color: 'var(--muted)', marginTop: 3 }}>
                Week {currentWeek} of {totalWeeks} · Phase: {plan.current_phase || 'Build'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
