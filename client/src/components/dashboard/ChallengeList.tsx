import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

const CATEGORY_ICONS: Record<string, string> = {
  bodyweight: '💪', nutrition: '🥗', hydration: '💧',
  technique: '🎯', gear: '👟', breathing: '🌬️', running: '🏃',
};

const AUTO_DETECT_CATEGORIES = ['running', 'technique'];

const CATEGORY_TIPS: Record<string, string> = {
  bodyweight: 'Body still, core tight. If it burns, you\'re doing it right.',
  nutrition: 'No need to be perfect — just hit the target most days.',
  hydration: 'Carry a bottle everywhere. Clear pee = good hydration.',
  technique: 'Focus on one thing per run. Don\'t change everything at once.',
  gear: 'Good shoes matter more than anything else.',
  breathing: 'Match breath to steps. 3 steps in, 2 out.',
  running: 'Start slow. If you can\'t talk, you\'re going too fast.',
};

export function ChallengeList() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);

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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[60px] rounded-xl bg-bg-secondary border border-bg-tertiary animate-pulse" />
        ))}
      </div>
    );
  }

  if (!challenges || challenges.length === 0) return null;

  return (
    <div className="space-y-2">
      {challenges.map((challenge: any, index: number) => {
        const isAutoDetect = AUTO_DETECT_CATEGORIES.includes(challenge.category);
        const canManualComplete = !isAutoDetect && !challenge.completed;
        const isExpanded = expanded === challenge.id;

        return (
          <motion.div
            key={challenge.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
            className={`rounded-xl border transition-colors duration-200 ${
              challenge.completed
                ? 'bg-bg-secondary/50 border-accent-green/10'
                : isExpanded
                  ? 'bg-bg-secondary border-zinc-700'
                  : 'bg-bg-secondary border-bg-tertiary'
            }`}
          >
            <button
              onClick={() => !challenge.completed && setExpanded(isExpanded ? null : challenge.id)}
              className="w-full flex items-center gap-3 p-3.5 text-left"
            >
              {/* Icon */}
              <span className={`text-base shrink-0 ${challenge.completed ? 'grayscale opacity-50' : ''}`}>
                {CATEGORY_ICONS[challenge.category] || '⭐'}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium leading-tight ${
                  challenge.completed ? 'text-zinc-600 line-through' : 'text-white'
                }`}>
                  {challenge.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-600 capitalize">{challenge.category}</span>
                  <span className="text-[10px] text-zinc-700">·</span>
                  <span className="text-[10px] font-mono text-zinc-600">+{challenge.xp_reward}</span>
                  {isAutoDetect && !challenge.completed && (
                    <span className="text-[8px] px-1.5 py-[1px] rounded bg-accent/8 text-accent/70 font-semibold uppercase tracking-wider">
                      Auto
                    </span>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              <div className="shrink-0">
                {challenge.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="w-6 h-6 rounded-full bg-accent-green/15 flex items-center justify-center"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-accent-green">
                      <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                ) : canManualComplete ? (
                  <div
                    onClick={(e) => { e.stopPropagation(); completeMutation.mutate(challenge.id); }}
                    className="w-6 h-6 rounded-full border border-zinc-700 hover:border-accent-green hover:bg-accent-green/10 flex items-center justify-center transition-all duration-150 active:scale-90"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-zinc-600">
                      <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 12 12" className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <path d="M3 5L6 8L9 5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* Expandable detail */}
            <AnimatePresence>
              {isExpanded && !challenge.completed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 pt-0">
                    <div className="rounded-lg bg-bg-primary/80 p-3 border border-bg-tertiary/50">
                      <p className="text-[12px] text-zinc-400 leading-relaxed">{challenge.description}</p>
                      {challenge.target_value && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">Target</span>
                          <span className="font-mono text-[12px] font-semibold text-accent">
                            {challenge.target_value} {challenge.target_unit || ''}
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-zinc-600 mt-2 italic">
                        {CATEGORY_TIPS[challenge.category] || 'Take it one step at a time.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
