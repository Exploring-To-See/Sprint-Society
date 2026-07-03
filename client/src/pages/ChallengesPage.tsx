import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import { Medal, Plus, Bolt } from '../components/ss/icons';

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

// status → semantic ss-tag recipe (amber = needs action / lapsed, violet = queued,
// green = live, muted = settled)
const STATUS_TAG: Record<ChallengeStatus, string> = {
  pending: 'maybe',
  accepted: 'soon',
  active: 'go',
  completed: 'full',
  expired: 'maybe',
  declined: 'full',
};

const METRIC_LABELS: Record<string, string> = {
  distance: 'Total Distance',
  pace: 'Best Pace',
  streak: 'Streak Length',
  runs_count: 'Number of Runs',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 11,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13px var(--body)', color: 'var(--fg)', outline: 'none',
};

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

  return (
    <SSScreen bodyLabel="1v1 Challenges">
      <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6, paddingBottom: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>
              1v1 Challenges
            </h1>
            <p style={{ font: '500 11.5px var(--body)', color: 'var(--muted)', marginTop: 2 }}>
              Stake Kendu, compete, win big
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="ss-qchip accent"
            style={{ height: 38 }}
            data-testid="challenges-create"
          >
            <span className="qi"><Plus width={13} height={13} style={{ color: 'var(--accent-2)' }} /></span>
            Challenge
          </button>
        </div>

        {/* Balance strip */}
        {balance && (
          <div className="tile recess" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
            <span style={{ width: 28, height: 28, borderRadius: 9, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(249,115,22,.14)', border: '1px solid rgba(249,115,22,.28)' }}>
              <Bolt width={13} height={13} style={{ color: 'var(--accent-2)' }} />
            </span>
            <span className="num" style={{ font: '700 15px var(--mono)', color: 'var(--fg)' }}>
              {balance.spendable_balance}
            </span>
            <span style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>Kendu available</span>
            <span className="num" style={{ marginLeft: 'auto', font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>
              Stake 5–50
            </span>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map(i => <SSSkeleton key={i} height={104} style={{ borderRadius: 18 }} />)}
          </div>
        ) : challenges.length === 0 ? (
          <SSEmpty
            icon={<Medal width={22} height={22} />}
            title="No challenges yet"
            body="Challenge a friend and put your Kendu on the line."
            testid="challenges-empty"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {challenges.map((c: Challenge) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="tile"
                style={{ gap: 10, padding: 14 }}
              >
                {/* Versus row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ font: '600 12.5px var(--body)', color: 'var(--fg)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {c.challenger_name}
                  </span>
                  <span style={{ font: '600 9px var(--body)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted-2)', flex: 'none' }}>
                    vs
                  </span>
                  <span style={{ font: '600 12.5px var(--body)', color: 'var(--fg)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {c.opponent_name}
                  </span>
                  <span className={`ss-tag ${STATUS_TAG[c.status]}`} style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>
                    {c.status}
                  </span>
                </div>

                {/* Metric + stake */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>
                    {METRIC_LABELS[c.metric] || c.metric}
                  </span>
                  <span className="num" style={{ font: '700 12px var(--mono)', color: 'var(--accent-2)' }}>
                    {c.stake_amount} Kendu each
                  </span>
                </div>

                {/* Deadline + pot */}
                <div className="num" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>
                  <span>Deadline {new Date(c.deadline).toLocaleDateString()}</span>
                  <span>Pot {c.stake_amount * 2} · winner gets {Math.floor(c.stake_amount * 2 * 0.8)}</span>
                </div>

                {/* Pending actions */}
                {c.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <button
                      className="ss-btn ss-btn-primary"
                      style={{ height: 40, fontSize: 13 }}
                      onClick={() => acceptMutation.mutate(c.id)}
                      disabled={acceptMutation.isPending}
                    >
                      Accept ({c.stake_amount} Kendu)
                    </button>
                    <button
                      className="ss-btn ss-btn-soft"
                      style={{ height: 40, fontSize: 13 }}
                      onClick={() => declineMutation.mutate(c.id)}
                      disabled={declineMutation.isPending}
                    >
                      Decline
                    </button>
                  </div>
                )}

                {/* Winner banner */}
                {c.status === 'completed' && c.winner_id && (
                  <div style={{ textAlign: 'center', padding: '7px 0', borderRadius: 10, background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.22)' }}>
                    <span style={{ font: '600 11px var(--body)', color: 'var(--green)' }}>
                      Winner: {c.winner_id === c.challenger_id ? c.challenger_name : c.opponent_name}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {showCreate && <CreateChallengeModal onClose={() => setShowCreate(false)} />}
      </div>
    </SSScreen>
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

  const labelStyle: React.CSSProperties = {
    display: 'block', font: '600 var(--lbl) var(--body)', textTransform: 'uppercase',
    letterSpacing: 'var(--trk-sm)', color: 'var(--muted)', marginBottom: 6,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,5,11,.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: 16 }}
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="ss-surface"
        style={{ borderRadius: 22, padding: 18, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label="Create challenge"
      >
        <h3 style={{ font: '600 15px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)', textAlign: 'center', margin: 0 }}>
          Create Challenge
        </h3>

        <div>
          <label style={labelStyle}>Opponent User ID</label>
          <input
            type="number"
            value={opponentId}
            onChange={e => setOpponentId(e.target.value)}
            style={inputStyle}
            placeholder="Enter their user ID"
          />
        </div>

        <div>
          <label style={labelStyle}>Stake (5–50 Kendu)</label>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={stakeAmount}
            onChange={e => setStakeAmount(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <p className="num" style={{ textAlign: 'center', font: '700 13px var(--mono)', color: 'var(--accent-2)', marginTop: 4 }}>
            {stakeAmount} Kendu
          </p>
        </div>

        <div>
          <label style={labelStyle}>Metric</label>
          <select
            value={metric}
            onChange={e => setMetric(e.target.value)}
            style={{ ...inputStyle, appearance: 'none' as const }}
          >
            <option value="distance">Total Distance</option>
            <option value="pace">Best Pace</option>
            <option value="runs_count">Number of Runs</option>
            <option value="streak">Streak Length</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {error && (
          <p style={{ font: '500 11px var(--body)', color: 'var(--amber)', textAlign: 'center', margin: 0 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 9 }}>
          <button type="button" className="ss-btn ss-btn-soft" style={{ height: 44, fontSize: 13.5 }} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ss-btn ss-btn-primary" style={{ height: 44, fontSize: 13.5 }} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : `Stake ${stakeAmount} Kendu`}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
