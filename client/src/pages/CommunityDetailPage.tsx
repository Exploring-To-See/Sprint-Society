// Community detail (/communities/:id) — rebuilt on ss-base. Every hook preserved:
// GET /communities/:id, /members, /chat, /digest, /leaderboard, /polls;
// POST join / mute / posts / posts/:pid/like / posts/:pid/react {emoji} / chat /
// polls / polls/:pid/vote / broadcasts; DELETE /leave; Kendu boost + sponsor spends.
// Reaction picker still SENDS emoji strings to the API (contract unchanged) — the
// buttons themselves render crafted SVG.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { backendWsUrl, WS_ENABLED, CHAT_POLL_MS } from '../lib/backend';
import { useAuth } from '../context/AuthContext';
import { KenduSpendConfirmModal } from '../components/kendu/KenduSpendConfirmModal';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSeg, type SegItem } from '../components/ss/SSSeg';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import {
  ArrowLeft, ChevronRight, Heart, Flame, Dumbbell, Spark, Bolt, Chat as ChatIcon,
  Trophy, Medal, BellOff, Send, Plus, Check, Lock, CommunityOutline,
} from '../components/ss/icons';
import { categoryIcon } from '../components/communities/categoryIcons';

type View = 'feed' | 'chat' | 'leaderboard' | 'members' | 'info';

const VIEW_TABS: SegItem<View>[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'chat', label: 'Chat' },
  { key: 'leaderboard', label: 'Ranking' },
  { key: 'members', label: 'Members' },
  { key: 'info', label: 'Info' },
];

// reaction payloads are part of the API contract — UI renders SVG, API gets the emoji string
const REACTIONS: { emoji: string; label: string; Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element }[] = [
  { emoji: '\u{1F525}', label: 'Fire', Icon: Flame },
  { emoji: '\u{1F4AA}', label: 'Strong', Icon: Dumbbell },
  { emoji: '\u{1F44F}', label: 'Applause', Icon: Spark },
];

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [postText, setPostText] = useState('');
  const [activeView, setActiveView] = useState<View>('feed');
  const [boostPostId, setBoostPostId] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: () => api.get(`/communities/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: members } = useQuery({
    queryKey: ['community-members', id],
    queryFn: () => api.get(`/communities/${id}/members`).then(r => r.data),
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${id}/join`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id] });
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/communities/${id}/leave`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id] });
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
    },
  });

  const postMutation = useMutation({
    mutationFn: (body: string) => api.post(`/communities/${id}/posts`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id] });
      setPostText('');
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) => api.post(`/communities/${id}/posts/${postId}/like`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['community', id] }),
  });

  const muteMutation = useMutation({
    mutationFn: () => api.post(`/communities/${id}/mute`),
    onSuccess: () => setMuted(true),
  });

  const { data: kenduBalance } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
  });

  const boostMutation = useMutation({
    mutationFn: (postId: number) => api.post('/kendu/spend/boost-post', { postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id] });
      queryClient.invalidateQueries({ queryKey: ['kendu-balance'] });
      setBoostPostId(null);
    },
  });

  if (isLoading) {
    return (
      <SSScreen active="community" bodyLabel="Community">
        <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SSSkeleton height={56} style={{ borderRadius: 16 }} />
          <SSSkeleton height={40} style={{ borderRadius: 13 }} />
          <SSSkeleton height={120} style={{ borderRadius: 18 }} />
          <SSSkeleton height={120} style={{ borderRadius: 18 }} />
        </div>
      </SSScreen>
    );
  }

  if (!community) {
    return (
      <SSScreen active="community" bodyLabel="Community">
        <div className="ss-pad">
          <SSEmpty
            icon={<CommunityOutline width={22} height={22} />}
            title="Community not found"
            body="It may have been removed, or the link is off."
            cta={
              <button className="ss-btn ss-btn-soft" style={{ height: 42, padding: '0 22px', flex: 'none' }} onClick={() => navigate('/communities')}>
                Back to communities
              </button>
            }
            testid="community-not-found"
          />
        </div>
      </SSScreen>
    );
  }

  const CatIcon = categoryIcon(community.category);
  const isAdminRole = community.user_role === 'owner' || community.user_role === 'admin';

  return (
    <SSScreen active="community" bodyLabel={community.name}>
      {/* Community header — sticky under the topbar */}
      <div style={{ position: 'sticky', top: 50, zIndex: 15, padding: '4px 16px 10px', background: 'linear-gradient(180deg,var(--bg) 62%,transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button
            onClick={() => navigate('/communities')}
            aria-label="Back to communities"
            className="iconbtn"
            style={{ cursor: 'pointer' }}
          >
            <ArrowLeft width={16} height={16} style={{ color: 'var(--muted)' }} />
          </button>
          <span className="runico" style={{ width: 36, height: 36, borderRadius: 11, overflow: 'hidden' }}>
            {community.avatar_url ? (
              <img src={community.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }} />
            ) : (
              <CatIcon width={16} height={16} style={{ color: 'var(--accent-2)' }} />
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ font: '600 15px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {community.name}
            </h1>
            <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>{community.member_count} members</p>
          </div>
          {!community.is_member && (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="ss-btn ss-btn-primary"
              style={{ height: 36, padding: '0 16px', flex: 'none', fontSize: 12.5, borderRadius: 11 }}
              data-testid="community-join"
            >
              {joinMutation.isPending ? 'Joining…' : 'Join'}
            </button>
          )}
        </div>

        <SSSeg<View> items={VIEW_TABS} value={activeView} onChange={setActiveView} layoutId="community-subtab" ariaLabel="Community sections" testid="community-tab" />
      </div>

      <div className="ss-pad" style={{ paddingBottom: community.is_member && activeView === 'feed' ? 88 : 24 }}>
        {/* Keyed conditional mounts — an AnimatePresence mode="wait" nested under the route-level one stalls the entering child at opacity 0 */}
          {activeView === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Pinned post */}
              {community.recent_posts?.filter((p: any) => p.pinned).map((post: any) => (
                <div key={post.id} className="tile" style={{ borderRadius: 18, padding: 13, background: 'rgba(251,191,36,.07)', borderColor: 'rgba(251,191,36,.2)' }}>
                  <p className="ss-tag maybe" style={{ alignSelf: 'flex-start', marginBottom: 8 }}>Pinned</p>
                  <p style={{ font: '400 13.5px/1.55 var(--body)', color: 'var(--fg)' }}>{post.body}</p>
                  <p style={{ font: '500 10px var(--body)', color: 'var(--muted-2)', marginTop: 8 }}>{post.author_name} · {formatTimeAgo(post.created_at)}</p>
                </div>
              ))}

              {/* Empty */}
              {community.recent_posts?.filter((p: any) => !p.pinned).length === 0 && (
                <SSEmpty
                  icon={<ChatIcon width={22} height={22} />}
                  title="No posts yet"
                  body="Start a conversation — say hi, share a run, ask a question."
                  testid="community-feed-empty"
                />
              )}

              {/* Posts */}
              {community.recent_posts?.filter((p: any) => !p.pinned).map((post: any) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="tile recess"
                  style={{ borderRadius: 18, padding: 13, gap: 10 }}
                >
                  {/* Author Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="ss-puck" style={{ width: 32, height: 32, fontSize: 11, overflow: 'hidden' }} aria-hidden="true">
                      {post.author_image ? (
                        <img src={post.author_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        post.author_name?.[0]
                      )}
                    </span>
                    <div>
                      <p style={{ font: '600 13px var(--body)', color: 'var(--fg)' }}>{post.author_name}</p>
                      <p style={{ font: '500 10px var(--body)', color: 'var(--muted-2)' }}>{formatTimeAgo(post.created_at)}</p>
                    </div>
                  </div>

                  <p style={{ font: '400 13.5px/1.55 var(--body)', color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>
                    {post.body}
                  </p>

                  {post.image_url && (
                    <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 13 }} loading="lazy" />
                  )}

                  {/* Reactions Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <button
                      onClick={() => likeMutation.mutate(post.id)}
                      aria-label={post.user_liked ? 'Unlike' : 'Like'}
                      aria-pressed={!!post.user_liked}
                      className="num"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 12px', borderRadius: 16,
                        cursor: 'pointer', font: '600 11px var(--mono)',
                        background: post.user_liked ? 'rgba(249,115,22,.14)' : 'rgba(255,255,255,.04)',
                        border: `1px solid ${post.user_liked ? 'rgba(249,115,22,.3)' : 'var(--hair)'}`,
                        color: post.user_liked ? 'var(--accent-2)' : 'var(--muted)',
                      }}
                    >
                      <Heart width={13} height={13} />
                      {post.likes_count > 0 && post.likes_count}
                    </button>
                    {REACTIONS.map(({ emoji, label, Icon }) => (
                      <button
                        key={label}
                        aria-label={`React: ${label}`}
                        onClick={() => api.post(`/communities/${id}/posts/${post.id}/react`, { emoji }).then(() => queryClient.invalidateQueries({ queryKey: ['community', id] }))}
                        style={{
                          width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer',
                          background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)', color: 'var(--muted)',
                        }}
                      >
                        <Icon width={13} height={13} />
                      </button>
                    ))}
                    {post.author_id === (currentUser as any)?.id && !post.pinned && (
                      <button
                        onClick={() => setBoostPostId(post.id)}
                        className="ss-dchip warn"
                        style={{ marginLeft: 'auto', cursor: 'pointer', minHeight: 26 }}
                        data-testid={`boost-${post.id}`}
                      >
                        <Bolt width={10} height={10} /> Boost
                      </button>
                    )}
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}

          {activeView === 'chat' && community.is_member && (
            <CommunityChat communityId={id!} />
          )}

          {activeView === 'chat' && !community.is_member && (
            <motion.div key="chat-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SSEmpty
                icon={<Lock width={22} height={22} />}
                title="Members only"
                body="Join the community to jump into the chat."
                testid="community-chat-locked"
              />
            </motion.div>
          )}

          {activeView === 'leaderboard' && (
            <CommunityLeaderboard communityId={id!} />
          )}

          {activeView === 'members' && (
            <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="tlbl" style={{ marginBottom: 9 }}>{community.member_count} members</p>
              <div className="tile recess" style={{ borderRadius: 18, padding: '2px 13px' }}>
                {members?.map((m: any, i: number) => (
                  <button
                    key={m.user_id}
                    onClick={() => navigate(`/user/${m.user_id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 56, padding: '9px 0',
                      textAlign: 'left', cursor: 'pointer',
                      borderBottom: i === members.length - 1 ? 'none' : '1px solid var(--hair)',
                    }}
                  >
                    <span className="ss-puck" style={{ width: 36, height: 36, fontSize: 12, overflow: 'hidden' }} aria-hidden="true">
                      {m.profile_image_url ? (
                        <img src={m.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        m.name?.[0]
                      )}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', font: '500 13px var(--body)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                      {m.role !== 'member' && (
                        <span className="ss-tag now" style={{ marginTop: 3 }}>{m.role}</span>
                      )}
                    </span>
                    <ChevronRight width={14} height={14} style={{ color: 'var(--muted-2)', flex: 'none' }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'info' && (
            <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {community.description && (
                <div className="tile recess" style={{ borderRadius: 18, padding: 13 }}>
                  <p className="tlbl" style={{ marginBottom: 7 }}>About</p>
                  <p style={{ font: '400 13px/1.6 var(--body)', color: 'var(--fg)' }}>{community.description}</p>
                </div>
              )}

              <div className="tile recess" style={{ borderRadius: 18, padding: 13 }}>
                <p className="tlbl" style={{ marginBottom: 7 }}>Created by</p>
                <p style={{ font: '500 13px var(--body)', color: 'var(--fg)' }}>{community.owner_name}</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {community.is_member && (
                  <button
                    onClick={() => muteMutation.mutate()}
                    disabled={muted || muteMutation.isPending}
                    className="ss-btn ss-btn-soft"
                    style={{ justifyContent: 'flex-start', gap: 10, padding: '0 16px', height: 46 }}
                  >
                    <BellOff width={16} height={16} style={{ color: 'var(--muted)' }} />
                    {muted ? 'Notifications muted' : 'Mute notifications'}
                    {muted && <Check width={13} height={13} style={{ color: 'var(--green)', marginLeft: 'auto' }} />}
                  </button>
                )}
                {community.is_member && community.user_role === 'member' && (
                  <button
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                    className="ss-btn"
                    style={{ justifyContent: 'flex-start', gap: 10, padding: '0 16px', height: 46, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.22)', color: 'var(--amber)' }}
                    data-testid="community-leave"
                  >
                    <ArrowLeft width={16} height={16} />
                    {leaveMutation.isPending ? 'Leaving…' : 'Leave community'}
                  </button>
                )}
              </div>

              {community.is_member && <PollsSection communityId={parseInt(id!)} isMember={true} queryClient={queryClient} />}

              {isAdminRole && <BroadcastSection communityId={parseInt(id!)} />}
            </motion.div>
          )}
      </div>

      {/* Compose bar — floats above the glide-pill nav */}
      {community.is_member && activeView === 'feed' && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, bottom: 96, zIndex: 30, padding: '0 14px', pointerEvents: 'none' }}>
          <div
            className="ss-surface"
            style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 18, padding: 8, background: 'rgba(11,10,22,.78)' }}
          >
            <input
              type="text"
              value={postText}
              onChange={e => setPostText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && postText.trim() && postMutation.mutate(postText)}
              placeholder="Write something..."
              className="ss-input"
              style={{ height: 40 }}
              aria-label="Write a post"
            />
            <button
              onClick={() => postText.trim() && postMutation.mutate(postText)}
              disabled={!postText.trim() || postMutation.isPending}
              aria-label="Post"
              style={{
                width: 40, height: 40, borderRadius: 13, flex: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer',
                background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', border: 'none', color: '#fff',
                opacity: !postText.trim() || postMutation.isPending ? .4 : 1,
              }}
            >
              <Send width={16} height={16} />
            </button>
          </div>
        </div>
      )}

      <KenduSpendConfirmModal
        isOpen={boostPostId !== null}
        onClose={() => setBoostPostId(null)}
        onConfirm={() => boostPostId && boostMutation.mutate(boostPostId)}
        title="Boost Post"
        description="Pin your post to top of feed for 24 hours"
        cost={10}
        currentBalance={kenduBalance?.spendable_balance ?? 0}
        loading={boostMutation.isPending}
      />
    </SSScreen>
  );
}

function BroadcastSection({ communityId }: { communityId: number }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const broadcastMutation = useMutation({
    mutationFn: (body: string) => api.post(`/communities/${communityId}/broadcasts`, { body }),
    onSuccess: () => { setText(''); setSent(true); setTimeout(() => setSent(false), 3000); },
  });

  return (
    <div className="tile recess" style={{ borderRadius: 18, padding: 13 }}>
      <p className="tlbl" style={{ marginBottom: 8 }}>Broadcast</p>
      {sent ? (
        <p className="ss-dchip good" style={{ alignSelf: 'flex-start' }}><Check width={10} height={10} /> Sent to all members</p>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Announce something..."
            className="ss-input" style={{ height: 42 }} aria-label="Broadcast message"
          />
          <button
            onClick={() => text.trim() && broadcastMutation.mutate(text)}
            disabled={!text.trim() || broadcastMutation.isPending}
            className="ss-btn ss-btn-primary"
            style={{ height: 42, padding: '0 16px', flex: 'none', fontSize: 12.5 }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function PollsSection({ communityId, isMember, queryClient }: { communityId: number; isMember: boolean; queryClient: any }) {
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const { data: polls } = useQuery({
    queryKey: ['community-polls', communityId],
    queryFn: () => api.get(`/communities/${communityId}/polls`).then(r => r.data).catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/polls`, { question, options: options.filter(o => o.trim()) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['community-polls', communityId] }); setShowCreate(false); setQuestion(''); setOptions(['', '']); },
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: number; optionIndex: number }) =>
      api.post(`/communities/${communityId}/polls/${pollId}/vote`, { option_index: optionIndex }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-polls', communityId] }),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="tlbl">Polls</p>
        {isMember && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', font: '600 11px var(--body)', color: 'var(--accent-2)', minHeight: 32 }}
          >
            <Plus width={12} height={12} /> New
          </button>
        )}
      </div>

      {showCreate && (
        <div className="tile recess" style={{ borderRadius: 18, padding: 13, gap: 8 }}>
          <input
            value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question..."
            className="ss-input" style={{ height: 42, width: '100%' }} aria-label="Poll question"
          />
          {options.map((opt, i) => (
            <input
              key={i} value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
              placeholder={`Option ${i + 1}`}
              className="ss-input" style={{ height: 42, width: '100%' }} aria-label={`Poll option ${i + 1}`}
            />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 2 }}>
            {options.length < 4 && (
              <button onClick={() => setOptions([...options, ''])} style={{ background: 'none', border: 'none', cursor: 'pointer', font: '600 11px var(--body)', color: 'var(--accent-2)', minHeight: 32 }}>
                + Option
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', font: '500 11px var(--body)', color: 'var(--muted-2)', minHeight: 32 }}>
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || createMutation.isPending}
              className="ss-btn ss-btn-primary"
              style={{ height: 38, padding: '0 16px', flex: 'none', fontSize: 12, borderRadius: 11 }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {polls?.map((poll: any) => (
        <div key={poll.id} className="tile recess" style={{ borderRadius: 18, padding: 13, gap: 9 }}>
          <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)' }}>{poll.question}</p>
          <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>{poll.total_votes} votes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {poll.options.map((opt: string, i: number) => {
              const voteCount = poll.votes?.find((v: any) => v.option_index === i)?.count || 0;
              const percent = poll.total_votes > 0 ? Math.round((voteCount / poll.total_votes) * 100) : 0;
              const hasVoted = poll.user_vote !== null && poll.user_vote !== undefined;
              const isVoted = poll.user_vote === i;
              return (
                <button
                  key={i}
                  onClick={() => !hasVoted && voteMutation.mutate({ pollId: poll.id, optionIndex: i })}
                  disabled={hasVoted}
                  style={{
                    position: 'relative', width: '100%', minHeight: 44, padding: '11px 14px', borderRadius: 13, textAlign: 'left',
                    overflow: 'hidden', cursor: hasVoted ? 'default' : 'pointer', font: '500 12.5px var(--body)',
                    background: 'rgba(255,255,255,.03)',
                    border: `1px solid ${isVoted ? 'rgba(249,115,22,.35)' : 'var(--hair)'}`,
                    color: isVoted ? 'var(--accent-2)' : hasVoted ? 'var(--muted)' : 'var(--fg)',
                  }}
                >
                  {hasVoted && (
                    <span aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${percent}%`, background: 'rgba(249,115,22,.1)', borderRadius: 12 }} />
                  )}
                  <span style={{ position: 'relative' }}>{opt}</span>
                  {hasVoted && (
                    <span className="num" style={{ position: 'relative', float: 'right', font: '600 11px var(--mono)', color: 'var(--muted)' }}>{percent}%</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommunityChat({ communityId }: { communityId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When WebSocket is disabled (e.g. Vercel serverless) we keep chat fresh by
  // polling the history endpoint; with WebSocket on, history seeds the initial
  // list and live messages arrive over the socket.
  const { data: history, refetch: refetchChat } = useQuery({
    queryKey: ['community-chat', communityId],
    queryFn: () => api.get(`/communities/${communityId}/chat`).then(r => r.data),
    refetchInterval: WS_ENABLED ? false : CHAT_POLL_MS,
  });

  useEffect(() => {
    if (history?.messages) setMessages(history.messages);
  }, [history]);

  const connectWs = () => {
    const token = localStorage.getItem('sprint_society_token');
    if (!token) return;

    const wsUrl = backendWsUrl(`/ws?token=${token}&community=${communityId}`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setConnectionLost(false);
        reconnectAttempts.current = 0;
      };

      ws.onclose = () => {
        setConnected(false);
        if (reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          reconnectTimeout.current = setTimeout(connectWs, delay);
        } else {
          setConnectionLost(true);
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'chat') {
          setMessages(prev => [...prev, msg]);
        }
      };
    } catch {
      setConnected(false);
    }
  };

  const handleRetry = () => {
    reconnectAttempts.current = 0;
    setConnectionLost(false);
    connectWs();
  };

  useEffect(() => {
    if (!WS_ENABLED) return; // polling mode — no socket
    connectWs();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [communityId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // In polling mode the input is always usable; in WebSocket mode it follows the
  // live connection state.
  const canSend = WS_ENABLED ? connected : true;

  const sendMessage = async () => {
    const body = input.trim();
    if (!body) return;

    if (WS_ENABLED && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat', body }));
      setInput('');
      return;
    }

    // REST fallback (no socket): persist via POST, then refresh history.
    setInput('');
    try {
      await api.post(`/communities/${communityId}/chat`, { body });
      refetchChat();
    } catch {
      setInput(body); // restore so the user can retry
    }
  };

  const live = !WS_ENABLED || connected;

  return (
    <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
      <div style={{ marginBottom: 8 }}>
        {connectionLost ? (
          <button onClick={handleRetry} className="ss-dchip warn" style={{ cursor: 'pointer' }}>
            Connection lost — tap to retry
          </button>
        ) : live ? (
          <span className="ss-dchip good"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} aria-hidden="true" /> Live</span>
        ) : (
          <span className="ss-dchip neutral">Connecting…</span>
        )}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
        {messages.length === 0 && (
          <SSEmpty
            icon={<ChatIcon width={22} height={22} />}
            title="Start the conversation"
            body="Say hi — messages land here in real time."
            testid="community-chat-empty"
          />
        )}
        {messages.map((msg: any) => (
          <div key={msg.id} style={{ display: 'flex', gap: 9 }}>
            <span className="ss-puck" style={{ width: 26, height: 26, fontSize: 9, marginTop: 2 }} aria-hidden="true">
              {msg.user_name?.[0]?.toUpperCase()}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ font: '600 11px var(--body)', color: 'var(--fg)' }}>{msg.user_name}</span>
                <span className="num" style={{ font: '500 9.5px var(--mono)', color: 'var(--muted-2)' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ font: '400 12.5px/1.5 var(--body)', color: 'var(--muted)', wordBreak: 'break-word' }}>{msg.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--hair)' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={canSend ? 'Type a message...' : 'Connecting...'}
          disabled={!canSend}
          maxLength={1000}
          className="ss-input"
          style={{ height: 44, opacity: canSend ? 1 : .5 }}
          aria-label="Chat message"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !canSend}
          aria-label="Send message"
          style={{
            width: 44, height: 44, borderRadius: 13, flex: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer',
            background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', border: 'none', color: '#fff',
            opacity: !input.trim() || !canSend ? .4 : 1,
          }}
        >
          <Send width={16} height={16} />
        </button>
      </div>
    </motion.div>
  );
}

function CommunityLeaderboard({ communityId }: { communityId: string }) {
  const queryClient = useQueryClient();
  const [showSponsor, setShowSponsor] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['community-leaderboard', communityId],
    queryFn: () => api.get(`/communities/${communityId}/leaderboard`).then(r => r.data),
  });

  const { data: digest } = useQuery({
    queryKey: ['community-digest', communityId],
    queryFn: () => api.get(`/communities/${communityId}/digest`).then(r => r.data),
  });

  const { data: kenduBal } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
  });

  const sponsorMutation = useMutation({
    mutationFn: () => api.post('/kendu/spend/sponsor', { communityId: parseInt(communityId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kendu-balance'] });
      setShowSponsor(false);
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SSSkeleton height={96} style={{ borderRadius: 18 }} />
        {[0, 1, 2].map(i => <SSSkeleton key={i} height={56} style={{ borderRadius: 14 }} />)}
      </div>
    );
  }

  const medalColor = (rank: number) =>
    rank === 1 ? 'var(--amber)' : rank === 2 ? 'var(--muted)' : 'var(--accent-2)';

  return (
    <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {/* Sponsor button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowSponsor(true)}
          className="ss-dchip warn"
          style={{ cursor: 'pointer', minHeight: 30 }}
          data-testid="sponsor-board"
        >
          <Trophy width={11} height={11} /> Sponsor board · 500 K
        </button>
      </div>

      <KenduSpendConfirmModal
        isOpen={showSponsor}
        onClose={() => setShowSponsor(false)}
        onConfirm={() => sponsorMutation.mutate()}
        title="Sponsor Leaderboard"
        description="Your name displayed on this community's leaderboard for 7 days"
        cost={500}
        currentBalance={kenduBal?.spendable_balance ?? 0}
        loading={sponsorMutation.isPending}
      />

      {/* Weekly digest summary */}
      {digest && (
        <div className="tile recess" style={{ borderRadius: 18, padding: 13 }}>
          <p className="tlbl" style={{ color: 'var(--accent-2)', marginBottom: 10 }}>This week</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
            {[
              { v: digest.active_members, k: 'Active' },
              { v: digest.total_runs, k: 'Runs' },
              { v: digest.total_distance_km, k: 'km' },
            ].map((s) => (
              <div key={s.k}>
                <p className="num" style={{ font: '700 18px var(--mono)', color: 'var(--fg)', lineHeight: 1 }}>{s.v}</p>
                <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 5 }}>{s.k}</p>
              </div>
            ))}
          </div>
          {digest.top_runner && (
            <p style={{ font: '500 10.5px var(--body)', color: 'var(--muted-2)', marginTop: 10, textAlign: 'center' }}>
              Top runner: <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>{digest.top_runner.name}</span>
              <span className="num"> ({digest.top_runner.distance_km} km)</span>
            </p>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {data?.my_rank && (
        <p style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>
          Your rank: <span className="num" style={{ color: 'var(--accent-2)', fontWeight: 600 }}>#{data.my_rank}</span>
        </p>
      )}

      {data?.leaderboard?.length > 0 ? (
        <div className="tile recess" style={{ borderRadius: 18, padding: '4px 13px' }}>
          {data.leaderboard.map((entry: any, i: number) => (
            <div
              key={entry.user_id}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, minHeight: 56, padding: '9px 0',
                borderBottom: i === data.leaderboard.length - 1 ? 'none' : '1px solid var(--hair)',
              }}
            >
              <span style={{ width: 24, textAlign: 'center', flex: 'none' }}>
                {entry.rank <= 3 ? (
                  <Medal width={16} height={16} style={{ color: medalColor(entry.rank) }} aria-label={`Rank ${entry.rank}`} />
                ) : (
                  <span className="num" style={{ font: '700 11px var(--mono)', color: 'var(--muted-2)' }}>#{entry.rank}</span>
                )}
              </span>
              <span className="ss-puck" style={{ width: 30, height: 30, fontSize: 10, overflow: 'hidden' }} aria-hidden="true">
                {entry.profile_image_url ? (
                  <img src={entry.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  entry.name?.[0]?.toUpperCase()
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '500 12.5px var(--body)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                <span className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>{entry.total_runs} runs</span>
              </span>
              <span style={{ textAlign: 'right' }}>
                <span className="num" style={{ display: 'block', font: '700 12.5px var(--mono)', color: 'var(--accent-2)' }}>{entry.total_distance_km} km</span>
                {entry.streak > 0 && (
                  <span className="num" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, font: '500 10px var(--mono)', color: 'var(--amber)' }}>
                    <Flame width={9} height={9} /> {entry.streak}d
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <SSEmpty
          icon={<Trophy width={22} height={22} />}
          title="No activity this week yet"
          body="Log a run and the board lights up."
          testid="community-leaderboard-empty"
        />
      )}
    </motion.div>
  );
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
