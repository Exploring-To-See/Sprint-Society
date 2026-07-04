// Weekly challenges — rows in a recess well, crafted SVG category icons (no emoji).
// Data: GET /coaching/challenges + POST /coaching/challenges/:id/complete (unchanged).
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { SSSkeleton } from '../ss/SSStates';
import { Check, ChevronDown, Target, Drop, Dumbbell, Leaf, Wind, Shoe, RunGlyph } from '../ss/icons';

const CATEGORY_ICONS: Record<string, (p: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  bodyweight: Dumbbell,
  nutrition: Leaf,
  hydration: Drop,
  technique: Target,
  gear: Shoe,
  breathing: Wind,
  running: RunGlyph,
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
    return <SSSkeleton height={168} style={{ borderRadius: 18 }} />;
  }

  if (!challenges || !Array.isArray(challenges) || challenges.length === 0) {
    return (
      <div className="tile recess" style={{ borderRadius: 18, padding: 20, alignItems: 'center', textAlign: 'center' }}>
        <span className="ticon" style={{ marginBottom: 8 }}><Target width={14} height={14} style={{ color: 'var(--muted)' }} /></span>
        <p style={{ font: '500 12px var(--body)', color: 'var(--muted)' }}>No challenges yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="tile recess" style={{ borderRadius: 18, padding: '2px 13px' }} data-testid="challenge-list">
      {challenges.map((challenge: any, i: number) => {
        const isAutoDetect = AUTO_DETECT_CATEGORIES.includes(challenge.category);
        const canManualComplete = !isAutoDetect && !challenge.completed;
        const isExpanded = expanded === challenge.id;
        const Icon = CATEGORY_ICONS[challenge.category] || Target;
        const isLast = i === challenges.length - 1;

        return (
          <div key={challenge.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--hair)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, minHeight: 56 }}>
              <button
                onClick={() => !challenge.completed && setExpanded(isExpanded ? null : challenge.id)}
                aria-expanded={!challenge.completed ? isExpanded : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, padding: '11px 0', textAlign: 'left', cursor: challenge.completed ? 'default' : 'pointer' }}
              >
                <span className="runico" style={{ opacity: challenge.completed ? .45 : 1 }}>
                  <Icon width={15} height={15} style={{ color: challenge.completed ? 'var(--muted-2)' : 'var(--muted)' }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'block', font: '600 13px var(--body)',
                    color: challenge.completed ? 'var(--muted-2)' : 'var(--fg)',
                    textDecoration: challenge.completed ? 'line-through' : 'none',
                  }}>
                    {challenge.title}
                  </span>
                  <span className="num" style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 10.5px var(--body)', color: 'var(--muted-2)', marginTop: 2, textTransform: 'capitalize' }}>
                    {challenge.category} · +{challenge.xp_reward} XP
                    {isAutoDetect && !challenge.completed && (
                      <span className="ss-tag now" style={{ fontSize: 7.5, padding: '1px 5px' }}>Auto</span>
                    )}
                  </span>
                </span>
              </button>

              {challenge.completed ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="ss-dchip good"
                  aria-label="Completed"
                >
                  <Check width={11} height={11} />
                </motion.span>
              ) : canManualComplete ? (
                <button
                  onClick={() => completeMutation.mutate(challenge.id)}
                  disabled={completeMutation.isPending}
                  aria-label={`Mark ${challenge.title} complete`}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
                    border: '1px solid var(--hair)', background: 'rgba(255,255,255,.04)', color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  <Check width={11} height={11} />
                </button>
              ) : (
                <ChevronDown
                  width={14} height={14} aria-hidden="true"
                  style={{ color: 'var(--muted-2)', flex: 'none', transition: 'transform .2s var(--ease)', transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                />
              )}
            </div>

            <AnimatePresence>
              {isExpanded && !challenge.completed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 0 12px' }}>
                    <div className="glass recess" style={{ borderRadius: 12, padding: 12 }}>
                      <p style={{ font: '400 12px/1.55 var(--body)', color: 'var(--muted)' }}>{challenge.description}</p>
                      {challenge.target_value && (
                        <p style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="tlbl">Target</span>
                          <span className="num" style={{ font: '600 12px var(--mono)', color: 'var(--accent-2)' }}>
                            {challenge.target_value} {challenge.target_unit || ''}
                          </span>
                        </p>
                      )}
                      <p style={{ font: '400 10.5px var(--body)', color: 'var(--muted-2)', marginTop: 8 }}>
                        {CATEGORY_TIPS[challenge.category] || 'Take it one step at a time.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
