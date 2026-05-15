import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { RunCard } from '../components/social/RunCard';
import { useAuth } from '../context/AuthContext';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function SharePage() {
  const { user } = useAuth();
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ['runs-for-share'],
    queryFn: () => api.get('/runs?limit=10').then(r => r.data),
  });

  const { data: xp } = useQuery({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data),
  });

  const selectedRun = data?.runs.find((r: any) => r.id === selectedRunId);

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Social</p>
          <h1 className="font-heading text-xl font-bold mt-0.5">Share Your Run</h1>
        </motion.div>

        {!selectedRun ? (
          <>
            <motion.p variants={fadeUp} className="text-zinc-500 text-sm">
              Pick a run to create a shareable card for Instagram/WhatsApp
            </motion.p>
            <motion.div variants={fadeUp} className="space-y-2">
              {data?.runs.map((run: any) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className="w-full card p-4 text-left hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                        <span className="text-sm">🏃</span>
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold">{(run.distance_meters / 1000).toFixed(1)} km</p>
                        <p className="text-[11px] text-zinc-500">{formatDate(run.start_date)}</p>
                      </div>
                    </div>
                    <span className="text-zinc-600 text-sm">→</span>
                  </div>
                </button>
              ))}
              {(!data || data.runs.length === 0) && (
                <div className="text-center py-16">
                  <p className="text-3xl mb-3">🏆</p>
                  <p className="text-zinc-500 text-sm">Complete a run first</p>
                  <p className="text-zinc-600 text-xs mt-1">Then come back to create shareable cards</p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <motion.div variants={fadeUp} className="space-y-4">
            <button
              onClick={() => setSelectedRunId(null)}
              className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              ← Pick different run
            </button>
            <RunCard
              run={selectedRun}
              userName={user?.name || 'Runner'}
              streak={xp?.current_streak_days}
              tier={tier?.tier}
            />
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
