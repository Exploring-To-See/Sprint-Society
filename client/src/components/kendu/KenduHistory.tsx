import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ComponentType, SVGProps } from 'react';
import api from '../../lib/api';
import { SSSkeleton, SSEmpty } from '../ss/SSStates';
import { Shoe, Trophy, Check, Target, Flame, Dumbbell, Calendar, Crown, Spark, Bolt, Pin } from '../ss/icons';

type SsIcon = ComponentType<SVGProps<SVGSVGElement>>;

const SOURCE_LABELS: Record<string, { label: string; Icon: SsIcon }> = {
  run_distance: { label: 'Run', Icon: Shoe },
  personal_best: { label: 'Personal Best', Icon: Trophy },
  coach_workout: { label: 'Workout Complete', Icon: Check },
  training_plan: { label: 'Plan Complete', Icon: Target },
  streak_bonus: { label: 'Streak Milestone', Icon: Flame },
  consistent_week: { label: '4+ Runs Week', Icon: Dumbbell },
  community_event: { label: 'Event', Icon: Calendar },
  redemption: { label: 'Redeemed', Icon: Crown },
  migration: { label: 'Welcome Bonus', Icon: Spark },
};

export function KenduHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['kendu-history'],
    queryFn: () => api.get('/kendu/history').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1, 2, 3, 4].map(i => <SSSkeleton key={i} height={48} style={{ borderRadius: 12 }} />)}
      </div>
    );
  }

  if (!data?.transactions?.length) {
    return (
      <SSEmpty
        icon={<Bolt width={22} height={22} />}
        title="No transactions yet"
        body="Go for a run — every kilometre earns Kendu."
        testid="kendu-history-empty"
      />
    );
  }

  return (
    <div className="ss-surface ss-recess" style={{ borderRadius: 16, overflow: 'hidden' }}>
      {data.transactions.map((tx: any, i: number) => {
        const source = SOURCE_LABELS[tx.source] || { label: tx.source, Icon: Pin };
        const { Icon } = source;
        const isPositive = tx.amount > 0;
        const date = new Date(tx.created_at);
        const timeStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 13px', borderTop: i === 0 ? 'none' : '1px solid var(--hair)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ width: 28, height: 28, borderRadius: 9, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--hair)' }}>
                <Icon width={13} height={13} style={{ color: 'var(--muted)' }} />
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ font: '600 12px var(--body)', color: 'var(--fg)', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {source.label}
                </p>
                <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', margin: '2px 0 0' }}>{timeStr}</p>
              </div>
            </div>
            <span
              className="num flex-none"
              style={{ font: '700 12.5px var(--mono)', color: isPositive ? 'var(--green)' : 'var(--amber)' }}
            >
              {isPositive ? '+' : ''}{tx.amount}
            </span>
          </motion.div>
        );
      })}

      {data.totalPages > 1 && (
        <p className="num" style={{ textAlign: 'center', font: '500 10px var(--mono)', color: 'var(--muted-2)', padding: '9px 0', borderTop: '1px solid var(--hair)', margin: 0 }}>
          Page {data.page} of {data.totalPages}
        </p>
      )}
    </div>
  );
}
