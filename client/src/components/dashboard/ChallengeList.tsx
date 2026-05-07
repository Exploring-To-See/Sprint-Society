import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const CATEGORY_ICONS: Record<string, string> = {
  bodyweight: '💪',
  nutrition: '🥗',
  hydration: '💧',
  technique: '🎯',
  gear: '👟',
  breathing: '🌬️',
  running: '🏃',
};

export function ChallengeList() {
  const queryClient = useQueryClient();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get('/coaching/challenges').then(r => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/coaching/challenges/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['xp'] });
    },
  });

  if (isLoading) return null;
  if (!challenges || challenges.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">
        Weekly Challenges
      </h3>
      <div className="space-y-3">
        {challenges.map((challenge: any, i: number) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
              challenge.completed ? 'bg-accent-green/5 opacity-60' : 'bg-bg-tertiary/50'
            }`}
          >
            <span className="text-xl mt-0.5">{CATEGORY_ICONS[challenge.category] || '⭐'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${challenge.completed ? 'line-through text-white/40' : 'text-white'}`}>
                {challenge.title}
              </p>
              <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{challenge.description}</p>
              <p className="text-xs text-accent-gold mt-1">+{challenge.xp_reward} XP</p>
            </div>
            {!challenge.completed && (
              <button
                onClick={() => completeMutation.mutate(challenge.id)}
                disabled={completeMutation.isPending}
                className="shrink-0 w-8 h-8 rounded-full border-2 border-white/20 hover:border-accent-green hover:bg-accent-green/10 transition-all flex items-center justify-center"
              >
                <span className="text-xs">✓</span>
              </button>
            )}
            {challenge.completed && (
              <span className="text-accent-green text-lg">✓</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
