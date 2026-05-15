import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const CATEGORY_TIPS: Record<string, string> = {
  bodyweight: '🧍 Body still, core tight. If it burns, you\'re doing it right. Rest if dizzy.',
  nutrition: '🍽️ No need to be perfect — just hit the target most days. Track with any free app.',
  hydration: '💧 Carry a bottle everywhere. Set phone reminders. Clear pee = good hydration.',
  technique: '👣 Focus on one thing per run. Don\'t change everything at once.',
  gear: '👟 Good shoes matter more than anything. Visit a running store if unsure.',
  breathing: '🫁 Breathe through both mouth and nose. Match breath to steps (e.g., 3 steps in, 2 out).',
  running: '🏃 Start slow. If you can\'t talk while running, you\'re going too fast.',
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
      {challenges.map((challenge: any) => (
        <div key={challenge.id} className={`card overflow-hidden ${challenge.completed ? 'opacity-40' : ''}`}>
          <div className="flex items-center gap-3 p-3.5">
            <span className="text-lg shrink-0">{CATEGORY_ICONS[challenge.category] || '⭐'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium ${challenge.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                {challenge.title}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {challenge.category} • +{challenge.xp_reward} XP
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!challenge.completed && (
                <>
                  <button
                    onClick={() => setExpanded(expanded === challenge.id ? null : challenge.id)}
                    className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded border border-bg-tertiary"
                  >
                    {expanded === challenge.id ? 'Close' : 'How?'}
                  </button>
                  <button
                    onClick={() => completeMutation.mutate(challenge.id)}
                    disabled={completeMutation.isPending}
                    className="text-[11px] font-medium text-accent hover:text-accent-warm transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
              {challenge.completed && (
                <span className="text-accent-green text-sm">✓</span>
              )}
            </div>
          </div>

          {expanded === challenge.id && !challenge.completed && (
            <div className="px-3.5 pb-3.5 pt-0 border-t border-bg-tertiary mt-0 pt-3">
              <div className="bg-bg-primary rounded-lg p-3">
                <p className="text-[12px] text-zinc-300 leading-relaxed">
                  {challenge.description}
                </p>
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
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
