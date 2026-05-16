import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const CATEGORY_ICONS: Record<string, string> = {
  bodyweight: '💪', nutrition: '🥗', hydration: '💧',
  technique: '🎯', gear: '👟', breathing: '🌬️', running: '🏃',
};

const AUTO_DETECT_CATEGORIES = ['running', 'technique'];

const CATEGORY_TIPS: Record<string, string> = {
  bodyweight: '🧍 Body still, core tight. If it burns, you\'re doing it right.',
  nutrition: '🍽️ No need to be perfect — just hit the target most days.',
  hydration: '💧 Carry a bottle everywhere. Clear pee = good hydration.',
  technique: '👣 Focus on one thing per run. Don\'t change everything at once.',
  gear: '👟 Good shoes matter more than anything else.',
  breathing: '🫁 Match breath to steps. 3 steps in, 2 out.',
  running: '🏃 Start slow. If you can\'t talk, you\'re going too fast.',
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

  if (isLoading) return null;
  if (!challenges || challenges.length === 0) return null;

  return (
    <div className="space-y-2">
      {challenges.map((challenge: any) => {
        const isAutoDetect = AUTO_DETECT_CATEGORIES.includes(challenge.category);
        const canManualComplete = !isAutoDetect && !challenge.completed;

        return (
          <div key={challenge.id} className={`card overflow-hidden ${challenge.completed ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-3 p-3.5">
              <span className="text-lg shrink-0">{CATEGORY_ICONS[challenge.category] || '⭐'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium ${challenge.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                  {challenge.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-zinc-500">
                    {challenge.category} • +{challenge.xp_reward} XP
                  </p>
                  {isAutoDetect && !challenge.completed && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                      Auto-tracked
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!challenge.completed && (
                  <button
                    onClick={() => setExpanded(expanded === challenge.id ? null : challenge.id)}
                    className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded border border-bg-tertiary"
                  >
                    {expanded === challenge.id ? '×' : '?'}
                  </button>
                )}
                {canManualComplete && (
                  <button
                    onClick={() => completeMutation.mutate(challenge.id)}
                    disabled={completeMutation.isPending}
                    className="w-6 h-6 rounded-full border border-zinc-600 hover:border-accent hover:bg-accent/10 flex items-center justify-center transition-colors"
                  >
                    <span className="text-[10px] text-zinc-400">✓</span>
                  </button>
                )}
                {challenge.completed && (
                  <span className="text-accent-green text-sm">✓</span>
                )}
              </div>
            </div>

            {expanded === challenge.id && !challenge.completed && (
              <div className="px-3.5 pb-3.5 border-t border-bg-tertiary pt-3">
                <div className="bg-bg-primary rounded-lg p-3">
                  <p className="text-[12px] text-zinc-300 leading-relaxed">{challenge.description}</p>
                  <p className="text-[11px] text-zinc-500 mt-2 italic">
                    {CATEGORY_TIPS[challenge.category] || '💡 Take it one step at a time.'}
                  </p>
                  {challenge.target_value && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Target:</span>
                      <span className="font-mono text-[13px] font-medium text-accent">
                        {challenge.target_value} {challenge.target_unit || ''}
                      </span>
                    </div>
                  )}
                  {isAutoDetect && (
                    <p className="text-[10px] text-accent/60 mt-2">
                      This challenge completes automatically when your run data matches the target.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
