import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export function KenduWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
  });

  const { data: subs } = useQuery({
    queryKey: ['kendu-subscriptions'],
    queryFn: () => api.get('/kendu/subscriptions').then(r => r.data),
  });

  if (isLoading) {
    return <div className="h-[88px] rounded-xl bg-bg-tertiary/50 animate-pulse" />;
  }

  if (!data) return null;

  const progressPercent = data.level_progress_percent || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-600/5 border border-orange-500/20 p-4 space-y-3 cursor-pointer"
      onClick={() => navigate('/rewards')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-orange-400">
                {data.spendable_balance.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Kendu</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className="text-orange-400 text-sm">🔥</span>
            <span className="text-[13px] font-semibold text-zinc-300">{data.current_streak_days}d streak</span>
          </div>
          <span className="text-[10px] text-zinc-500">Level {data.current_level}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="h-[5px] rounded-full bg-bg-tertiary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.2 }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-600">{progressPercent}% to Level {data.current_level + 1}</span>
          <span className="text-[11px] text-zinc-600">Lifetime: {data.lifetime_earned.toLocaleString()}</span>
        </div>
      </div>

      {subs && subs.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/50">
          <span className="text-[10px] text-zinc-500">
            {subs.filter((s: any) => s.is_active).length} active subs
          </span>
          {subs.some((s: any) => s.is_active && new Date(s.next_due_at) <= new Date(Date.now() + 7 * 86400000)) && (
            <span className="text-[11px] text-amber-500 font-medium">• Due soon</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
