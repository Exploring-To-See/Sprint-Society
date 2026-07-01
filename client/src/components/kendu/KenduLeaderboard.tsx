import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

interface Props {
  eventId?: number;
  limit?: number;
}

export function KenduLeaderboard({ eventId, limit = 10 }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['kendu-leaderboard', eventId],
    queryFn: () => api.get(`/kendu/leaderboard?limit=${limit}${eventId ? `&eventId=${eventId}` : ''}`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[44px] rounded-lg bg-bg-tertiary/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-4">
        <p className="text-[11px] text-zinc-500">No Kendu earners yet</p>
      </div>
    );
  }

  const RANK_STYLES = ['text-yellow-400', 'text-zinc-300', 'text-amber-600'];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🔥</span>
        <h3 className="text-[13px] font-bold text-zinc-200">
          {eventId ? 'Event' : 'Top'} Kendu Earners
        </h3>
      </div>

      {data.map((entry: any, i: number) => (
        <motion.div
          key={entry.user_id}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-tertiary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`text-[13px] font-bold w-5 ${RANK_STYLES[i] || 'text-zinc-500'}`}>
              {entry.rank}
            </span>
            <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center overflow-hidden">
              {entry.profile_image_url ? (
                <img src={entry.profile_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-400">{entry.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-[12px] text-zinc-300 font-medium">{entry.name}</p>
              <p className="text-[11px] text-zinc-600">Level {entry.level} &middot; 🔥{entry.current_streak_days}d</p>
            </div>
          </div>
          <span className="text-[12px] font-bold text-orange-400">{entry.total_earned.toLocaleString()}</span>
        </motion.div>
      ))}
    </div>
  );
}
