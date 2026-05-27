import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const SOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  run_distance: { label: 'Run', icon: '🏃' },
  personal_best: { label: 'Personal Best', icon: '🏆' },
  coach_workout: { label: 'Workout Complete', icon: '📋' },
  training_plan: { label: 'Plan Complete', icon: '🎯' },
  streak_bonus: { label: 'Streak Milestone', icon: '🔥' },
  consistent_week: { label: '4+ Runs Week', icon: '💪' },
  community_event: { label: 'Event', icon: '🎉' },
  redemption: { label: 'Redeemed', icon: '🎁' },
  migration: { label: 'Welcome Bonus', icon: '✨' },
};

export function KenduHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['kendu-history'],
    queryFn: () => api.get('/kendu/history').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-[48px] rounded-lg bg-bg-tertiary/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data?.transactions?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-[12px] text-zinc-500">No transactions yet. Go for a run!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {data.transactions.map((tx: any, i: number) => {
        const source = SOURCE_LABELS[tx.source] || { label: tx.source, icon: '📍' };
        const isPositive = tx.amount > 0;
        const date = new Date(tx.created_at);
        const timeStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-tertiary/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm">{source.icon}</span>
              <div>
                <p className="text-[12px] text-zinc-300 font-medium">{source.label}</p>
                <p className="text-[9px] text-zinc-600">{timeStr}</p>
              </div>
            </div>
            <span className={`text-[13px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{tx.amount}
            </span>
          </motion.div>
        );
      })}

      {data.totalPages > 1 && (
        <p className="text-center text-[10px] text-zinc-600 pt-2">
          Page {data.page} of {data.totalPages}
        </p>
      )}
    </div>
  );
}
