import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { RunCard } from '../components/social/RunCard';
import { useAuth } from '../context/AuthContext';
import { formatDistance, formatRelativeDate } from '../lib/formatters';

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
      <div className="space-y-5">
        <h2 className="font-heading text-xl font-bold">Share Your Run</h2>

        {!selectedRun ? (
          <>
            <p className="text-white/40 text-sm">Select a run to create a shareable card</p>
            <div className="space-y-2">
              {data?.runs.map((run: any) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className="w-full glass-card p-4 text-left hover:border-accent-green/30 transition-colors border border-transparent"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold">{formatDistance(run.distance_meters)}</p>
                      <p className="text-xs text-white/40">{formatRelativeDate(run.start_date)}</p>
                    </div>
                    <span className="text-white/20">→</span>
                  </div>
                </button>
              ))}
              {(!data || data.runs.length === 0) && (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">📸</p>
                  <p className="text-white/50 text-sm">Complete a run first to create shareable cards</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedRunId(null)}
              className="text-white/50 text-sm hover:text-white transition-colors"
            >
              ← Select different run
            </button>
            <RunCard
              run={selectedRun}
              userName={user?.name || 'Runner'}
              streak={xp?.current_streak_days}
              tier={tier?.tier}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
