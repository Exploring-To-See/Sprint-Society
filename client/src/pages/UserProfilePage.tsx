import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';

const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  advanced: { bg: 'bg-accent-gold/10 border-accent-gold/20', text: 'text-accent-gold' },
  intermediate: { bg: 'bg-accent/10 border-accent/20', text: 'text-accent' },
  beginner: { bg: 'bg-accent-green/10 border-accent-green/20', text: 'text-accent-green' },
};

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [showGift, setShowGift] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => api.get(`/profile/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const followMutation = useMutation({
    mutationFn: (following: boolean) =>
      following ? api.delete(`/social/follow/${id}`) : api.post(`/social/follow/${id}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['user-profile', id] }),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse pt-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-bg-tertiary rounded" />
              <div className="h-3 w-24 bg-bg-tertiary rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-16 flex-1 bg-bg-tertiary rounded-xl" />
            <div className="h-16 flex-1 bg-bg-tertiary rounded-xl" />
            <div className="h-16 flex-1 bg-bg-tertiary rounded-xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="flex flex-col items-center py-20 gap-3">
          <span className="text-3xl">🤷</span>
          <p className="text-zinc-500 text-[13px]">User not found</p>
          <button onClick={() => navigate(-1)} className="text-accent text-[12px] font-semibold">Go back</button>
        </div>
      </AppShell>
    );
  }

  const isOwnProfile = (currentUser as any)?.id === profile.id;
  const tierStyle = TIER_STYLES[profile.current_tier || 'beginner'] || TIER_STYLES.beginner;

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-6">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[12px] font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary border-2 border-bg-tertiary overflow-hidden flex items-center justify-center">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-zinc-500">{profile.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-[20px] font-bold text-white">{profile.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {profile.current_tier && (
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tierStyle.bg} ${tierStyle.text}`}>
                  {profile.current_tier}
                </span>
              )}
              <span className="text-[10px] text-zinc-600 font-mono">L{profile.current_level}</span>
              {profile.current_streak_days > 0 && (
                <span className="text-[10px] text-zinc-600">🔥 {profile.current_streak_days}</span>
              )}
            </div>
          </div>
        </div>

        {/* Follow + Gift buttons */}
        {!isOwnProfile && (
          <div className="flex gap-2">
            <button
              onClick={() => followMutation.mutate(profile.is_following)}
              disabled={followMutation.isPending}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-[13px] active:scale-[0.98] transition-all ${
                profile.is_following
                  ? 'bg-bg-secondary border border-bg-tertiary text-zinc-400'
                  : 'bg-accent text-white'
              }`}
            >
              {profile.is_following ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={() => setShowGift(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-semibold text-[13px] active:scale-[0.98] transition-all"
            >
              Gift Kendu
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="flex rounded-xl bg-bg-secondary border border-bg-tertiary divide-x divide-bg-tertiary overflow-hidden">
          <div className="flex-1 p-3 text-center">
            <p className="font-mono font-bold text-[16px] text-white">{profile.total_runs}</p>
            <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Runs</p>
          </div>
          <div className="flex-1 p-3 text-center">
            <p className="font-mono font-bold text-[16px] text-white">{profile.total_distance_km}</p>
            <p className="text-[11px] text-zinc-600 uppercase tracking-wider">km</p>
          </div>
          <div className="flex-1 p-3 text-center">
            <p className="font-mono font-bold text-[16px] text-white">{profile.followers_count}</p>
            <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Followers</p>
          </div>
          <div className="flex-1 p-3 text-center">
            <p className="font-mono font-bold text-[16px] text-white">{profile.following_count}</p>
            <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Following</p>
          </div>
        </div>

        {/* Achievements */}
        {profile.recent_achievements?.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {profile.recent_achievements.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-secondary border border-bg-tertiary">
                  <span className="text-sm">{a.icon}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communities */}
        {profile.communities?.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Communities</h3>
            <div className="flex flex-wrap gap-2">
              {profile.communities.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/communities/${c.id}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-secondary border border-bg-tertiary active:scale-95 transition-all"
                >
                  <span className="text-[11px] text-zinc-400">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Member since */}
        <p className="text-[10px] text-zinc-700 text-center pt-2">
          Member since {new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {!isOwnProfile && (
        <GiftKenduModal
          isOpen={showGift}
          onClose={() => setShowGift(false)}
          toUserId={profile.id}
          toUserName={profile.name}
        />
      )}
    </AppShell>
  );
}

function GiftKenduModal({ isOpen, onClose, toUserId, toUserName }: { isOpen: boolean; onClose: () => void; toUserId: number; toUserName: string }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
    enabled: isOpen,
  });

  const giftMutation = useMutation({
    mutationFn: () => api.post('/kendu/spend/gift', { toUserId, amount, message: message || undefined }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['kendu-balance'] });
      setTimeout(() => { onClose(); setSuccess(false); setAmount(5); setMessage(''); }, 1500);
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Gift failed'),
  });

  const fee = Math.ceil(amount * 0.15);
  const totalCost = amount + fee;
  const canAfford = (balance?.spendable_balance ?? 0) >= totalCost;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-bg-secondary border border-orange-500/20 rounded-2xl p-5 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-3xl">🎁</p>
                <p className="text-[14px] font-bold text-green-400">Sent {amount} Kendu to {toUserName}!</p>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <p className="text-[15px] font-bold text-zinc-100">Gift Kendu</p>
                  <p className="text-[12px] text-zinc-400">Send Kendu to {toUserName}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Amount (min 3)</label>
                    <input
                      type="number"
                      min={3}
                      max={balance?.spendable_balance ?? 100}
                      value={amount}
                      onChange={e => { setAmount(Math.max(3, parseInt(e.target.value) || 3)); setError(''); }}
                      className="w-full bg-bg-tertiary border border-zinc-700 rounded-lg px-3 py-2 text-[14px] text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Message (optional)</label>
                    <input
                      type="text"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Keep running!"
                      maxLength={100}
                      className="w-full bg-bg-tertiary border border-zinc-700 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="bg-bg-tertiary/50 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Gift amount</span>
                    <span className="text-zinc-200">{amount} Kendu</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Platform fee (15%)</span>
                    <span className="text-red-400">+{fee} burned</span>
                  </div>
                  <div className="border-t border-zinc-700/50 pt-1.5 flex justify-between text-[12px]">
                    <span className="text-zinc-400 font-semibold">You pay</span>
                    <span className="text-orange-400 font-bold">{totalCost} Kendu</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">Your balance</span>
                    <span className={canAfford ? 'text-zinc-400' : 'text-red-400'}>{balance?.spendable_balance ?? 0}</span>
                  </div>
                </div>

                {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-bg-tertiary text-zinc-400 text-[13px] font-medium">
                    Cancel
                  </button>
                  <button
                    onClick={() => giftMutation.mutate()}
                    disabled={!canAfford || giftMutation.isPending}
                    className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-[13px] font-semibold disabled:opacity-40"
                  >
                    {giftMutation.isPending ? 'Sending...' : `Send ${amount}`}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
