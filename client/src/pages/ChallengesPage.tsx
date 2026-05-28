import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

type ChallengeStatus = 'pending' | 'accepted' | 'active' | 'completed' | 'expired' | 'declined';

interface Challenge {
  id: number;
  challenger_id: number;
  challenger_name: string;
  challenger_image?: string;
  opponent_id: number;
  opponent_name: string;
  opponent_image?: string;
  stake_amount: number;
  metric: string;
  deadline: string;
  status: ChallengeStatus;
  winner_id: number | null;
  created_at: string;
}

export default function ChallengesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['kendu-challenges'],
    queryFn: () => api.get('/kendu/challenges').then(r => r.data),
  });

  const { data: balance } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
  });

  const acceptMutation = useMutation({
    mutationFn: (challengeId: number) => api.post('/kendu/challenge/accept', { challengeId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kendu-challenges'] }),
  });

  const declineMutation = useMutation({
    mutationFn: (challengeId: number) => api.post('/kendu/challenge/decline', { challengeId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kendu-challenges'] }),
  });

  const statusColors: Record<ChallengeStatus, string> = {
    pending: 'text-yellow-400 bg-yellow-500/10',
    accepted: 'text-blue-400 bg-blue-500/10',
    active: 'text-green-400 bg-green-500/10',
    completed: 'text-zinc-400 bg-zinc-500/10',
    expired: 'text-red-400 bg-red-500/10',
    declined: 'text-zinc-500 bg-zinc-500/10',
  };

  const metricLabels: Record<string, string> = {
    distance: 'Total Distance',
    pace: 'Best Pace',
    streak: 'Streak Length',
    runs_count: 'Number of Runs',
  };

  return (
    <AppShell>
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">1v1 Challenges</h1>
          <p className="text-[12px] text-zinc-500">Stake Kendu, compete, win big</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-[12px] font-semibold hover:bg-orange-500/30 transition-colors"
        >
          + Challenge
        </button>
      </div>

      {balance && (
        <div className="flex items-center gap-2 text-[12px] text-zinc-400">
          <span className="text-orange-400 font-bold">{balance.spendable_balance}</span>
          <span>Kendu available</span>
          <span className="text-zinc-600">•</span>
          <span>Stake: 5-50 per challenge</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-bg-tertiary/50 animate-pulse" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-3xl">⚔️</p>
          <p className="text-zinc-400 text-[13px]">No challenges yet</p>
          <p className="text-zinc-500 text-[11px]">Challenge a friend and put your Kendu on the line</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c: Challenge) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-zinc-200">{c.challenger_name}</span>
                  <span className="text-zinc-500 text-[11px]">vs</span>
                  <span className="text-[12px] font-semibold text-zinc-200">{c.opponent_name}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>
                  {c.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>{metricLabels[c.metric] || c.metric}</span>
                <span className="text-orange-400 font-bold">{c.stake_amount} Kendu each</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Deadline: {new Date(c.deadline).toLocaleDateString()}</span>
                <span>Pot: {c.stake_amount * 2} (winner gets {Math.floor(c.stake_amount * 2 * 0.8)})</span>
              </div>

              {c.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => acceptMutation.mutate(c.id)}
                    disabled={acceptMutation.isPending}
                    className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-[11px] font-semibold hover:bg-green-500/30 transition-colors"
                  >
                    Accept ({c.stake_amount} Kendu)
                  </button>
                  <button
                    onClick={() => declineMutation.mutate(c.id)}
                    disabled={declineMutation.isPending}
                    className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}

              {c.status === 'completed' && c.winner_id && (
                <div className="text-center text-[11px] text-green-400 font-semibold bg-green-500/10 rounded-lg py-1.5">
                  Winner: {c.winner_id === c.challenger_id ? c.challenger_name : c.opponent_name}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && <CreateChallengeModal onClose={() => setShowCreate(false)} />}
    </div>
    </AppShell>
  );
}

function CreateChallengeModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [opponentId, setOpponentId] = useState('');
  const [stakeAmount, setStakeAmount] = useState(10);
  const [metric, setMetric] = useState('distance');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/kendu/spend/challenge', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kendu-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['kendu-balance'] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to create challenge'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentId || !deadline) {
      setError('Fill all fields');
      return;
    }
    createMutation.mutate({ opponentId: parseInt(opponentId), stakeAmount, metric, deadline });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 className="text-[15px] font-bold text-zinc-100 text-center">Create Challenge</h3>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Opponent User ID</label>
            <input
              type="number"
              value={opponentId}
              onChange={e => setOpponentId(e.target.value)}
              className="w-full bg-bg-tertiary border border-zinc-700 rounded-lg px-3 py-2 text-[13px] text-zinc-200"
              placeholder="Enter their user ID"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Stake (5-50 Kendu)</label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={stakeAmount}
              onChange={e => setStakeAmount(parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
            <p className="text-center text-orange-400 font-bold text-[13px]">{stakeAmount} Kendu</p>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Metric</label>
            <select
              value={metric}
              onChange={e => setMetric(e.target.value)}
              className="w-full bg-bg-tertiary border border-zinc-700 rounded-lg px-3 py-2 text-[13px] text-zinc-200"
            >
              <option value="distance">Total Distance</option>
              <option value="pace">Best Pace</option>
              <option value="runs_count">Number of Runs</option>
              <option value="streak">Streak Length</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full bg-bg-tertiary border border-zinc-700 rounded-lg px-3 py-2 text-[13px] text-zinc-200"
            />
          </div>
        </div>

        {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-bg-tertiary text-zinc-400 text-[13px] font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : `Stake ${stakeAmount} Kendu`}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
