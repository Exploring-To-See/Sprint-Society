// Club feed — content-only lane rendered inside SocialPage's SSScreen shell.
// Hooks preserved: GET /social/feed, POST/DELETE /social/kudos/:activityId
// {reaction_type}, POST /social/comments/:activityId. The reaction picker still
// sends the same reaction_type strings; the UI renders crafted SVG (zero emoji).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import api from '../lib/api';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import { Hand, Flame, Dumbbell, Medal, Bolt, Chat as ChatIcon, CommunityOutline } from '../components/ss/icons';

type ReactionIcon = (p: React.SVGProps<SVGSVGElement>) => JSX.Element;

const REACTIONS: { type: string; emoji: string; label: string; Icon: ReactionIcon }[] = [
  { type: 'high_five', emoji: '\u{1F64C}', label: 'High five', Icon: Hand },
  { type: 'fire', emoji: '\u{1F525}', label: 'Fire', Icon: Flame },
  { type: 'impressive', emoji: '\u{1F4AA}', label: 'Impressive', Icon: Dumbbell },
  { type: 'respect', emoji: '\u{1FAE1}', label: 'Respect', Icon: Medal },
  { type: 'lets_go', emoji: '⚡', label: "Let's go", Icon: Bolt },
];

// server stores the emoji the user reacted with — map it back to the crafted icon
const EMOJI_TO_ICON: Record<string, ReactionIcon> = Object.fromEntries(
  REACTIONS.map((r) => [r.emoji, r.Icon]),
);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function FeedPage() {
  const queryClient = useQueryClient();
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get('/social/feed').then(r => r.data),
  });

  const [floatingReactions, setFloatingReactions] = useState<{ id: number; Icon: ReactionIcon; x: number }[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);

  const kudosMutation = useMutation({
    mutationFn: ({ activityId, remove, reactionType }: { activityId: number; remove: boolean; reactionType?: string }) =>
      remove
        ? api.delete(`/social/kudos/${activityId}`)
        : api.post(`/social/kudos/${activityId}`, { reaction_type: reactionType || 'high_five' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const handleReaction = useCallback((activityId: number, Icon: ReactionIcon, reactionType: string) => {
    kudosMutation.mutate({ activityId, remove: false, reactionType });
    setShowReactionPicker(null);
    const id = Date.now() + Math.random();
    const x = 20 + Math.random() * 60;
    setFloatingReactions(prev => [...prev, { id, Icon, x }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 1200);
  }, [kudosMutation]);

  const commentMutation = useMutation({
    mutationFn: ({ activityId, body }: { activityId: number; body: string }) =>
      api.post(`/social/comments/${activityId}`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setCommentText('');
      setCommentingOn(null);
    },
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 13, paddingBottom: 24 }}>
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em' }}>Club feed</h1>
        <p style={{ font: '500 11.5px var(--body)', color: 'var(--muted)', marginTop: 2 }}>Your crew's latest runs</p>
      </motion.div>

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map(i => <SSSkeleton key={i} height={148} style={{ borderRadius: 18 }} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!data?.feed || data.feed.length === 0) && (
        <SSEmpty
          icon={<CommunityOutline width={22} height={22} />}
          title="Your feed is quiet"
          body="Follow club members to see their runs here. Check the Discover tab to find runners."
          testid="feed-empty"
        />
      )}

      {/* Feed items */}
      {data?.feed?.length > 0 && data.feed.map((activity: any) => {
        const ReactedIcon = (activity.user_reaction_emoji && EMOJI_TO_ICON[activity.user_reaction_emoji]) || Hand;
        return (
          <motion.article
            key={activity.id}
            variants={fadeUp}
            className="tile recess"
            style={{ borderRadius: 18, padding: 13, gap: 11, overflow: 'visible' }}
          >
            {/* User header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="ss-puck" style={{ width: 32, height: 32, fontSize: 11, overflow: 'hidden' }} aria-hidden="true">
                {activity.profile_image_url ? (
                  <img src={activity.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  activity.user_name?.[0]?.toUpperCase()
                )}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ font: '600 13px var(--body)', color: 'var(--fg)' }}>{activity.user_name}</p>
                <p style={{ font: '500 10px var(--body)', color: 'var(--muted-2)' }}>{formatTimeAgo(activity.start_date)}</p>
              </div>
            </div>

            {/* Run stats — mono instrument strip */}
            <div className="glass recess" style={{ display: 'flex', gap: 18, padding: '11px 14px', borderRadius: 13 }}>
              {[
                { k: 'Distance', v: activity.distance_km, unit: 'km', hue: 'var(--fg)' },
                { k: 'Duration', v: formatDuration(activity.moving_time_seconds), unit: '', hue: 'var(--fg)' },
                { k: 'Pace', v: activity.pace_formatted, unit: '/km', hue: 'var(--accent-2)' },
                ...(activity.elevation_gain > 0 ? [{ k: 'Elev', v: String(Math.round(activity.elevation_gain)), unit: 'm', hue: 'var(--fg)' }] : []),
              ].map((s) => (
                <div key={s.k}>
                  <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)' }}>{s.k}</p>
                  <p className="num" style={{ font: '700 15px var(--mono)', color: s.hue, marginTop: 3, display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    {s.v}
                    {s.unit && <small style={{ font: '500 10px var(--mono)', color: 'var(--muted)' }}>{s.unit}</small>}
                  </p>
                </div>
              ))}
            </div>

            {/* Actions — Reactions + Comment */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--hair)', paddingTop: 10 }}>
              <button
                onClick={() => activity.user_gave_kudos
                  ? kudosMutation.mutate({ activityId: activity.id, remove: true })
                  : setShowReactionPicker(showReactionPicker === activity.id ? null : activity.id)
                }
                aria-label={activity.user_gave_kudos ? 'Remove kudos' : 'Give kudos'}
                aria-pressed={!!activity.user_gave_kudos}
                className="num"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 12px', borderRadius: 16,
                  cursor: 'pointer', font: '600 11px var(--mono)',
                  background: activity.user_gave_kudos ? 'rgba(249,115,22,.14)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${activity.user_gave_kudos ? 'rgba(249,115,22,.3)' : 'var(--hair)'}`,
                  color: activity.user_gave_kudos ? 'var(--accent-2)' : 'var(--muted)',
                }}
              >
                <ReactedIcon width={13} height={13} />
                {activity.kudos_count > 0 && activity.kudos_count}
              </button>

              {/* Reaction picker */}
              <AnimatePresence>
                {showReactionPicker === activity.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="ss-surface"
                    style={{
                      position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, zIndex: 10,
                      display: 'flex', gap: 4, padding: '6px 8px', borderRadius: 14, background: 'rgba(11,10,22,.9)',
                    }}
                    role="menu"
                    aria-label="Pick a reaction"
                  >
                    {REACTIONS.map(r => (
                      <button
                        key={r.type}
                        onClick={() => handleReaction(activity.id, r.Icon, r.type)}
                        aria-label={r.label}
                        title={r.label}
                        style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--muted)' }}
                      >
                        <r.Icon width={16} height={16} />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setCommentingOn(commentingOn === activity.id ? null : activity.id)}
                aria-label="Comment"
                className="num"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 12px', borderRadius: 16,
                  cursor: 'pointer', font: '600 11px var(--mono)',
                  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)', color: 'var(--muted)',
                }}
              >
                <ChatIcon width={13} height={13} />
                {activity.comments_count > 0 && activity.comments_count}
              </button>

              {/* Floating reactions */}
              <AnimatePresence>
                {floatingReactions.map(fr => (
                  <motion.span
                    key={fr.id}
                    initial={{ opacity: 1, y: 0, x: `${fr.x}%` }}
                    animate={{ opacity: 0, y: -60 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ position: 'absolute', bottom: '100%', pointerEvents: 'none', color: 'var(--accent-2)' }}
                    aria-hidden="true"
                  >
                    <fr.Icon width={20} height={20} />
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {/* Comment input */}
            <AnimatePresence>
              {commentingOn === activity.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Nice run!"
                      maxLength={500}
                      className="ss-input"
                      style={{ height: 40 }}
                      aria-label="Write a comment"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && commentText.trim()) {
                          commentMutation.mutate({ activityId: activity.id, body: commentText });
                        }
                      }}
                    />
                    <button
                      onClick={() => commentText.trim() && commentMutation.mutate({ activityId: activity.id, body: commentText })}
                      disabled={!commentText.trim() || commentMutation.isPending}
                      className="ss-btn ss-btn-primary"
                      style={{ height: 40, padding: '0 16px', flex: 'none', fontSize: 12, borderRadius: 11 }}
                    >
                      Post
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        );
      })}

      {/* End of feed indicator */}
      {!isLoading && data?.feed && data.feed.length > 0 && (
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 0' }}>
          <span style={{ width: 32, height: 2, borderRadius: 1, background: 'var(--hair)' }} aria-hidden="true" />
          <p style={{ font: '500 11px var(--body)', color: 'var(--muted-2)' }}>You're all caught up</p>
        </motion.div>
      )}
    </motion.div>
  );
}
