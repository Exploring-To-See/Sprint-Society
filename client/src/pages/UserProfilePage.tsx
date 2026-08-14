// Runner profile (/user/:id) — rebuilt on ss-base. Hooks preserved: GET /profile/:id,
// POST/DELETE /social/follow/:id, GET /kendu/balance, POST /kendu/spend/gift.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import { ArrowLeft, Flame, Trophy, Check, CommunityOutline } from '../components/ss/icons';
import { useAuth } from '../context/AuthContext';

const TIER_TAG: Record<string, string> = {
  advanced: 'maybe',
  intermediate: 'now',
  beginner: 'go',
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
    // Optimistic flip so the button reacts on tap instead of after the refetch.
    onMutate: async (following: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['user-profile', id] });
      const previous = queryClient.getQueryData<any>(['user-profile', id]);
      queryClient.setQueryData<any>(['user-profile', id], (old: any) =>
        old ? {
          ...old,
          is_following: !following,
          followers_count: Math.max(0, (Number(old.followers_count) || 0) + (following ? -1 : 1)),
        } : old,
      );
      return { previous };
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.previous) queryClient.setQueryData(['user-profile', id], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['user-profile', id] }),
  });

  if (isLoading) {
    return (
      <SSScreen active="community" bodyLabel="Runner profile">
        <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SSSkeleton height={72} style={{ borderRadius: 18 }} />
          <SSSkeleton height={48} style={{ borderRadius: 13 }} />
          <SSSkeleton height={72} style={{ borderRadius: 18 }} />
        </div>
      </SSScreen>
    );
  }

  if (!profile) {
    return (
      <SSScreen active="community" bodyLabel="Runner profile">
        <div className="ss-pad">
          <SSEmpty
            icon={<CommunityOutline width={22} height={22} />}
            title="Runner not found"
            body="This profile may have been removed."
            cta={
              <button className="ss-btn ss-btn-soft" style={{ height: 42, padding: '0 22px', flex: 'none' }} onClick={() => navigate(-1)}>
                Go back
              </button>
            }
            testid="user-not-found"
          />
        </div>
      </SSScreen>
    );
  }

  const isOwnProfile = (currentUser as any)?.id === profile.id;
  const tierTag = TIER_TAG[profile.current_tier || 'beginner'] || 'go';

  return (
    <SSScreen active="community" bodyLabel={`${profile.name}'s profile`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', font: '500 12px var(--body)', color: 'var(--muted)', minHeight: 34, padding: 0 }}
        >
          <ArrowLeft width={15} height={15} /> Back
        </button>

        {/* Header */}
        <div className="ss-surface ss-hero" style={{ borderRadius: 22, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            aria-hidden="true"
            style={{
              width: 60, height: 60, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', overflow: 'hidden',
              background: 'linear-gradient(135deg,var(--accent),var(--violet))', font: '700 20px var(--head)', color: '#fff',
            }}
          >
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile.name?.[0]?.toUpperCase()
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ font: '600 20px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)' }}>{profile.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {profile.current_tier && (
                <span className={`ss-tag ${tierTag}`}>{profile.current_tier}</span>
              )}
              <span className="schip" style={{ height: 24, padding: '0 8px', fontSize: 10 }}>L{profile.current_level}</span>
              {profile.current_streak_days > 0 && (
                <span className="schip" style={{ height: 24, padding: '0 8px', fontSize: 10 }}>
                  <Flame width={10} height={10} style={{ color: 'var(--amber)' }} /> {profile.current_streak_days}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Follow + Gift */}
        {!isOwnProfile && (
          <div style={{ display: 'flex', gap: 9 }}>
            <button
              onClick={() => followMutation.mutate(profile.is_following)}
              disabled={followMutation.isPending}
              className={`ss-btn ${profile.is_following ? 'ss-btn-soft' : 'ss-btn-primary'}`}
              style={{ height: 44 }}
              data-testid="follow-btn"
            >
              {profile.is_following ? <><Check width={14} height={14} /> Following</> : 'Follow'}
            </button>
            <button
              onClick={() => setShowGift(true)}
              className="ss-btn"
              style={{ flex: 'none', height: 44, padding: '0 18px', background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.24)', color: 'var(--accent-2)', fontSize: 13 }}
              data-testid="gift-btn"
            >
              Gift Kendu
            </button>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)' }}>
          {[
            { v: profile.total_runs, k: 'Runs' },
            { v: profile.total_distance_km, k: 'km' },
            { v: profile.followers_count, k: 'Followers' },
            { v: profile.following_count, k: 'Following' },
          ].map((s) => (
            <div key={s.k} className="tile recess" style={{ borderRadius: 16, padding: '11px 8px', alignItems: 'center' }}>
              <span className="num" style={{ font: '700 16px var(--mono)', color: 'var(--fg)', lineHeight: 1 }}>{s.v}</span>
              <span style={{ font: '600 8.5px var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 5 }}>{s.k}</span>
            </div>
          ))}
        </div>

        {/* Achievements */}
        {profile.recent_achievements?.length > 0 && (
          <div>
            <p className="tlbl" style={{ marginBottom: 8 }}>Achievements</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {profile.recent_achievements.map((a: any, i: number) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 11, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)' }}>
                  <Trophy width={12} height={12} style={{ color: 'var(--amber)', flex: 'none' }} />
                  <span style={{ font: '500 10.5px var(--body)', color: 'var(--fg)' }}>{a.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Communities */}
        {profile.communities?.length > 0 && (
          <div>
            <p className="tlbl" style={{ marginBottom: 8 }}>Communities</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {profile.communities.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/communities/${c.id}`)}
                  className="ss-tab on"
                  style={{ minHeight: 32, fontSize: 11 }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Member since */}
        <p style={{ font: '500 10px var(--body)', color: 'var(--muted-2)', textAlign: 'center', paddingTop: 6 }}>
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
    </SSScreen>
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

  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', font: '500 11px var(--body)' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(3,3,8,.7)', backdropFilter: 'blur(6px)', padding: 16 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Gift Kendu to ${toUserName}`}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="ss-surface"
            style={{ borderRadius: 22, padding: 18, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(11,10,22,.92)' }}
            onClick={e => e.stopPropagation()}
          >
            {success ? (
              <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span className="ss-dchip good" style={{ minHeight: 30 }}><Check width={13} height={13} /> Sent</span>
                <p style={{ font: '600 14px var(--body)', color: 'var(--green)' }}>Sent {amount} Kendu to {toUserName}</p>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ font: '600 15px var(--head)', color: 'var(--fg)' }}>Gift Kendu</p>
                  <p style={{ font: '400 12px var(--body)', color: 'var(--muted)', marginTop: 2 }}>Send Kendu to {toUserName}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>
                    Amount (min 3)
                    <input
                      type="number"
                      min={3}
                      max={balance?.spendable_balance ?? 100}
                      value={amount}
                      onChange={e => { setAmount(Math.max(3, parseInt(e.target.value) || 3)); setError(''); }}
                      className="ss-input num"
                      style={{ width: '100%', height: 42, marginTop: 5, font: '600 14px var(--mono)' }}
                    />
                  </label>
                  <label style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>
                    Message (optional)
                    <input
                      type="text"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Keep running!"
                      maxLength={100}
                      className="ss-input"
                      style={{ width: '100%', height: 42, marginTop: 5 }}
                    />
                  </label>
                </div>

                <div className="glass recess" style={{ borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={rowStyle}>
                    <span style={{ color: 'var(--muted)' }}>Gift amount</span>
                    <span className="num" style={{ color: 'var(--fg)' }}>{amount} Kendu</span>
                  </div>
                  <div style={rowStyle}>
                    <span style={{ color: 'var(--muted)' }}>Platform fee (15%)</span>
                    <span className="num" style={{ color: 'var(--amber)' }}>+{fee} burned</span>
                  </div>
                  <div style={{ ...rowStyle, borderTop: '1px solid var(--hair)', paddingTop: 6, font: '600 12px var(--body)' }}>
                    <span style={{ color: 'var(--muted)' }}>You pay</span>
                    <span className="num" style={{ color: 'var(--accent-2)', fontWeight: 700 }}>{totalCost} Kendu</span>
                  </div>
                  <div style={{ ...rowStyle, fontSize: 10 }}>
                    <span style={{ color: 'var(--muted-2)' }}>Your balance</span>
                    <span className="num" style={{ color: canAfford ? 'var(--muted)' : 'var(--amber)' }}>{balance?.spendable_balance ?? 0}</span>
                  </div>
                </div>

                {error && <p style={{ font: '500 11px var(--body)', color: 'var(--amber)', textAlign: 'center' }} role="alert">{error}</p>}

                <div style={{ display: 'flex', gap: 9 }}>
                  <button onClick={onClose} className="ss-btn ss-btn-soft" style={{ height: 44 }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => giftMutation.mutate()}
                    disabled={!canAfford || giftMutation.isPending}
                    className="ss-btn ss-btn-primary"
                    style={{ height: 44 }}
                  >
                    {giftMutation.isPending ? 'Sending…' : `Send ${amount}`}
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
