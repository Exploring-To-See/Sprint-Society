import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const DISTANCE_ICONS: Record<string, string> = {
  '1K': '🏃', '3K': '💨', '5K': '🔥', '10K': '⚡',
  'Half Marathon': '🏅', 'Marathon': '👑',
};

export function RecordsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['records'],
    queryFn: () => api.get('/records').then(r => r.data),
  });

  const { data: timeline } = useQuery({
    queryKey: ['records-timeline'],
    queryFn: () => api.get('/records/timeline').then(r => r.data).catch(() => null),
  });

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 pb-6">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Performance</p>
          <h1 className="font-heading text-[22px] font-bold">Personal Records</h1>
          {data?.total_count > 0 && (
            <p className="text-[12px] text-zinc-500 mt-1">{data.total_count} records tracked</p>
          )}
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[68px] rounded-xl bg-bg-secondary border border-bg-tertiary animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!data || data.total_count === 0) && (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-bg-tertiary flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-[13px] text-zinc-500 text-center max-w-[240px]">
              Your personal records will appear here after you log a few runs.
            </p>
          </motion.div>
        )}

        {/* Race PRs */}
        {data?.race_prs?.length > 0 && (
          <motion.div variants={fadeUp}>
            <p className="label mb-3">Race Distances</p>
            <div className="space-y-2">
              {data.race_prs.map((pr: any, i: number) => {
                const distName = pr.category.replace('Best ', '');
                const icon = DISTANCE_ICONS[distName] || '🏃';
                const isRecent = Date.now() - new Date(pr.date).getTime() < 14 * 86400000;

                return (
                  <motion.div
                    key={pr.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 200, damping: 25 }}
                    className={`card p-4 flex items-center gap-3 ${isRecent ? 'border-accent-gold/20' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center text-base shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-white">{distName}</p>
                        {isRecent && (
                          <span className="text-[11px] px-1.5 py-[1px] rounded bg-accent-gold/10 text-accent-gold font-bold uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-[15px] font-bold text-white">{pr.formatted}</p>
                      {pr.improvement && (
                        <p className="text-[10px] font-mono text-accent-green mt-0.5">
                          -{pr.improvement.formatted}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Effort PRs */}
        {data?.effort_prs?.length > 0 && (
          <motion.div variants={fadeUp}>
            <p className="label mb-3">Effort Records</p>
            <div className="grid grid-cols-2 gap-2">
              {data.effort_prs.map((pr: any) => (
                <div key={pr.id} className="card p-3.5">
                  <p className="text-[10px] text-zinc-600 capitalize mb-1">{pr.category}</p>
                  <p className="font-mono text-[14px] font-bold text-white">{pr.formatted}</p>
                  <p className="text-[11px] text-zinc-700 mt-1">
                    {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* PR Timeline */}
        {timeline?.timeline?.length > 0 && (
          <motion.div variants={fadeUp}>
            <p className="label mb-3">PR Timeline</p>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-bg-tertiary" />

              <div className="space-y-3">
                {timeline.timeline.slice(0, 8).map((entry: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="w-[15px] h-[15px] rounded-full bg-bg-secondary border-2 border-accent shrink-0 mt-0.5 relative z-10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-white">{entry.category}: {entry.value}</span>
                        {entry.improvement && (
                          <span className="text-[10px] font-mono text-accent-green">{entry.improvement}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
