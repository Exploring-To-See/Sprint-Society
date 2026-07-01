import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  earned: boolean;
}

interface RunStats {
  total_runs: number;
  total_distance: number;
  best_pace: number | null;
  current_streak?: number;
}

function computeProgress(achievement: Achievement, stats: RunStats | null): number {
  if (!stats) return 0;
  if (achievement.earned) return 1;

  const { requirement_type, requirement_value } = achievement;

  switch (requirement_type) {
    case 'total_runs':
      return Math.min(1, stats.total_runs / requirement_value);
    case 'single_distance_km':
      // Approximate: total distance suggests capability
      return Math.min(1, (stats.total_distance / 1000) / (requirement_value * 3));
    case 'total_distance_km':
      return Math.min(1, (stats.total_distance / 1000) / requirement_value);
    case 'streak_days':
      return Math.min(1, (stats.current_streak || 0) / requirement_value);
    case 'events_attended':
      // We don't have this data on client easily, show 0
      return 0;
    case 'communities_created':
    case 'community_members':
      return 0;
    default:
      return 0;
  }
}

function getRemainingText(achievement: Achievement, stats: RunStats | null): string {
  if (!stats) return 'Keep going!';
  if (achievement.earned) return 'Unlocked!';

  const { requirement_type, requirement_value } = achievement;

  switch (requirement_type) {
    case 'total_runs': {
      const remaining = Math.max(0, requirement_value - stats.total_runs);
      return `${remaining} more run${remaining !== 1 ? 's' : ''}!`;
    }
    case 'total_distance_km': {
      const currentKm = stats.total_distance / 1000;
      const remaining = Math.max(0, Math.ceil(requirement_value - currentKm));
      return `${remaining} km to go!`;
    }
    case 'streak_days': {
      const current = stats.current_streak || 0;
      const remaining = Math.max(0, requirement_value - current);
      return `${remaining} more day${remaining !== 1 ? 's' : ''}!`;
    }
    case 'single_distance_km':
      return `Run ${requirement_value}km in one go!`;
    default:
      return 'Keep going!';
  }
}

export function AchievementProgress() {
  const navigate = useNavigate();

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/gamification/achievements').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['run-stats'],
    queryFn: () => api.get('/runs/stats').then(r => r.data),
  });

  const { data: xp } = useQuery({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  if (!achievements || !stats) return null;

  // Merge streak data
  const enrichedStats: RunStats = {
    ...stats,
    current_streak: xp?.current_streak_days || 0,
  };

  // Filter unearned achievements, compute progress, sort by closest to done
  const unearned = (achievements as Achievement[])
    .filter(a => !a.earned)
    .map(a => ({
      ...a,
      progress: computeProgress(a, enrichedStats),
    }))
    .filter(a => a.progress > 0) // Only show ones with some progress
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  // If no achievements with progress, show the first 3 unearned
  const toShow = unearned.length > 0
    ? unearned
    : (achievements as Achievement[])
        .filter(a => !a.earned)
        .slice(0, 3)
        .map(a => ({ ...a, progress: 0 }));

  if (toShow.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-[14px]">Next achievements</h3>
        <button
          onClick={() => navigate('/profile')}
          className="text-[10px] text-accent font-medium"
        >
          View all
        </button>
      </div>

      <div className="space-y-2.5">
        {toShow.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
            className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3.5 flex items-center gap-3"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[18px]">{achievement.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[12px] font-semibold text-white truncate">
                  {achievement.name}
                </p>
                <span className="text-[10px] font-mono text-zinc-500 ml-2 flex-shrink-0">
                  {Math.round(achievement.progress * 100)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-[4px] rounded-full bg-bg-tertiary overflow-hidden mb-1.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, achievement.progress * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
                />
              </div>

              {/* Remaining text */}
              <p className="text-[10px] text-zinc-500">
                {getRemainingText(achievement, enrichedStats)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
