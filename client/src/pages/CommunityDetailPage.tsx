import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { backendWsUrl } from '../lib/backend';
import { useAuth } from '../context/AuthContext';
import { KenduSpendConfirmModal } from '../components/kendu/KenduSpendConfirmModal';

type View = 'feed' | 'chat' | 'leaderboard' | 'members' | 'info';

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [postText, setPostText] = useState('');
  const [activeView, setActiveView] = useState<View>('feed');
  const [showCompose, setShowCompose] = useState(false);
  const [boostPostId, setBoostPostId] = useState<number | null>(null);

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
      setShowCompose(false);
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) => api.post(`/communities/${id}/posts/${postId}/like`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['community', id] }),
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
      <div className="min-h-screen bg-bg-primary px-5 pt-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-5 w-20 bg-bg-tertiary rounded" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-bg-tertiary" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-bg-tertiary rounded" />
              <div className="h-3 w-20 bg-bg-tertiary rounded" />
            </div>
          </div>
          <div className="h-20 bg-bg-tertiary rounded-xl" />
          <div className="h-20 bg-bg-tertiary rounded-xl" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
        <span className="text-3xl mb-3">🤷</span>
        <p className="text-zinc-500 text-[13px]">Community not found</p>
        <button onClick={() => navigate('/communities')} className="text-accent text-[12px] font-semibold mt-3">
          Back to communities
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-bg-primary/95 backdrop-blur-lg border-b border-bg-tertiary/50 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/communities')} className="text-zinc-500 active:scale-90 transition-transform">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            {community.avatar_url ? (
              <img src={community.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <span className="text-[16px]">{getCategoryIcon(community.category)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-[15px] font-bold text-white truncate">{community.name}</h1>
            <p className="text-[10px] text-zinc-500">{community.member_count} members</p>
          </div>
          {!community.is_member && (
            <button
              onClick={() => joinMutation.mutate()}
              className="px-4 py-1.5 rounded-lg bg-accent text-white text-[11px] font-semibold active:scale-95"
            >
              Join
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-3">
          {(['feed', 'chat', 'leaderboard', 'members', 'info'] as View[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveView(tab)}
              className={`flex-1 py-2 text-center text-[11px] font-semibold rounded-lg transition-colors ${
                activeView === tab ? 'bg-accent/10 text-accent' : 'text-zinc-600'
              }`}
            >
              {tab === 'feed' ? 'Feed' : tab === 'chat' ? 'Chat' : tab === 'leaderboard' ? 'Ranking' : tab === 'members' ? 'Members' : 'Info'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
        <AnimatePresence mode="wait">
          {activeView === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Pinned post */}
              {community.recent_posts?.filter((p: any) => p.pinned).map((post: any) => (
                <div key={post.id} className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">📌 Pinned</p>
                  <p className="text-[14px] text-zinc-200 leading-relaxed">{post.body}</p>
                  <p className="text-[10px] text-zinc-600 mt-2">{post.author_name} · {formatTimeAgo(post.created_at)}</p>
                </div>
              ))}

              {/* Posts */}
              {community.recent_posts?.filter((p: any) => !p.pinned).length === 0 && (
                <div className="flex flex-col items-center py-16 text-center">
                  <span className="text-3xl mb-3">💬</span>
                  <p className="text-[13px] text-zinc-500">No posts yet</p>
                  <p className="text-[11px] text-zinc-700 mt-1">Start a conversation</p>
                </div>
              )}

              {community.recent_posts?.filter((p: any) => !p.pinned).map((post: any) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5"
                >
                  {/* Author Row */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center">
                      {post.author_image ? (
                        <img src={post.author_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500">{post.author_name?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white">{post.author_name}</p>
                      <p className="text-[10px] text-zinc-600">{formatTimeAgo(post.created_at)}</p>
                    </div>
                  </div>

                  {/* Post Body — generous sizing */}
                  <p className="text-[14px] text-zinc-200 leading-relaxed whitespace-pre-wrap pl-[42px]">
                    {post.body}
                  </p>

                  {post.image_url && (
                    <img src={post.image_url} alt="" className="w-full rounded-xl ml-[42px] max-w-[calc(100%-42px)]" />
                  )}

                  {/* Reactions Row */}
                  <div className="flex items-center gap-2 pl-[42px]">
                    <button
                      onClick={() => likeMutation.mutate(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-all active:scale-95 ${
                        post.user_liked ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-bg-secondary border border-bg-tertiary text-zinc-500'
                      }`}
                    >
                      ❤️ {post.likes_count > 0 && <span className="font-semibold">{post.likes_count}</span>}
                    </button>
                    {['🔥', '💪', '👏'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => api.post(`/communities/${id}/posts/${post.id}/react`, { emoji }).then(() => queryClient.invalidateQueries({ queryKey: ['community', id] }))}
                        className="w-8 h-8 rounded-full bg-bg-secondary border border-bg-tertiary flex items-center justify-center text-[13px] active:scale-90 transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                    {post.author_id === (currentUser as any)?.id && !post.pinned && (
                      <button
                        onClick={() => setBoostPostId(post.id)}
                        className="ml-auto px-2.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 font-semibold active:scale-95 transition-all"
                      >
                        🚀 Boost
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-b border-bg-tertiary/30 ml-[42px]" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeView === 'chat' && community.is_member && (
            <CommunityChat communityId={id!} />
          )}

          {activeView === 'chat' && !community.is_member && (
            <motion.div key="chat-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <span className="text-2xl">🔒</span>
              <p className="text-[12px] text-zinc-500 mt-2">Join to access chat</p>
            </motion.div>
          )}

          {activeView === 'leaderboard' && (
            <CommunityLeaderboard communityId={id!} />
          )}

          {activeView === 'members' && (
            <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <p className="text-[11px] text-zinc-600 mb-3">{community.member_count} members</p>
              {members?.map((m: any) => (
                <button
                  key={m.user_id}
                  onClick={() => navigate(`/user/${m.user_id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary active:scale-[0.98] transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center">
                    {m.profile_image_url ? (
                      <img src={m.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[12px] font-bold text-zinc-500">{m.name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-medium text-white">{m.name}</p>
                    {m.role !== 'member' && (
                      <p className="text-[10px] text-accent font-semibold uppercase">{m.role}</p>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-700">
                    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </motion.div>
          )}

          {activeView === 'info' && (
            <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Description */}
              {community.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-2">About</p>
                  <p className="text-[14px] text-zinc-300 leading-relaxed">{community.description}</p>
                </div>
              )}

              {/* Created by */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-2">Created by</p>
                <p className="text-[13px] text-zinc-300">{community.owner_name}</p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {community.is_member && (
                  <button
                    onClick={() => api.post(`/communities/${id}/mute`)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-[13px] text-zinc-400 active:scale-[0.98]"
                  >
                    🔕 <span>Mute notifications</span>
                  </button>
                )}
                {community.is_member && community.user_role === 'member' && (
                  <button
                    onClick={() => leaveMutation.mutate()}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/5 border border-red-500/15 text-[13px] text-red-400 active:scale-[0.98]"
                  >
                    ← <span>Leave community</span>
                  </button>
                )}
              </div>

              {/* Polls Section */}
              {community.is_member && <PollsSection communityId={parseInt(id!)} isMember={true} queryClient={queryClient} />}

              {/* Broadcast (admin only) */}
              {(community.user_role === 'owner' || community.user_role === 'admin') && (
                <BroadcastSection communityId={parseInt(id!)} queryClient={queryClient} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Compose Bar (Bottom — like WhatsApp) */}
      {community.is_member && activeView === 'feed' && (
        <div className="fixed bottom-16 left-0 right-0 z-20 bg-bg-primary border-t border-bg-tertiary/50 px-4 py-3">
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <input
              type="text"
              value={postText}
              onChange={e => setPostText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && postText.trim() && postMutation.mutate(postText)}
              placeholder="Write something..."
              className="flex-1 px-4 py-2.5 rounded-full bg-bg-secondary border border-bg-tertiary text-[13px] text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            <button
              onClick={() => postText.trim() && postMutation.mutate(postText)}
              disabled={!postText.trim() || postMutation.isPending}
              className="w-9 h-9 rounded-full bg-accent flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
                <path d="M14 2L7 9M14 2l-5 12-2-5-5-2 12-5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
    </div>
  );
}

function BroadcastSection({ communityId, queryClient }: { communityId: number; queryClient: any }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const broadcastMutation = useMutation({
    mutationFn: (body: string) => api.post(`/communities/${communityId}/broadcasts`, { body }),
    onSuccess: () => { setText(''); setSent(true); setTimeout(() => setSent(false), 3000); },
  });

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-2">📢 Broadcast</p>
      {sent ? (
        <p className="text-[12px] text-emerald-400 py-2">Sent to all members.</p>
      ) : (
        <div className="flex gap-2">
          <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Announce something..."
            className="flex-1 px-3 py-2.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-[12px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600" />
          <button onClick={() => text.trim() && broadcastMutation.mutate(text)} disabled={!text.trim()}
            className="px-4 py-2.5 rounded-xl bg-accent text-white text-[11px] font-semibold disabled:opacity-30 active:scale-95">
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Polls</p>
        {isMember && !showCreate && (
          <button onClick={() => setShowCreate(true)} className="text-[11px] text-accent font-medium active:scale-95">+ New</button>
        )}
      </div>

      {showCreate && (
        <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4 space-y-2">
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question..."
            className="w-full px-3 py-2.5 rounded-lg bg-bg-primary border border-bg-tertiary text-[13px] text-white placeholder:text-zinc-700 focus:outline-none" />
          {options.map((opt, i) => (
            <input key={i} value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
              placeholder={`Option ${i + 1}`}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-primary border border-bg-tertiary text-[13px] text-white placeholder:text-zinc-700 focus:outline-none" />
          ))}
          <div className="flex items-center gap-3 pt-1">
            {options.length < 4 && <button onClick={() => setOptions([...options, ''])} className="text-[11px] text-accent">+ Option</button>}
            <div className="flex-1" />
            <button onClick={() => setShowCreate(false)} className="text-[11px] text-zinc-600">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
              className="px-4 py-2 rounded-lg bg-accent text-white text-[11px] font-semibold disabled:opacity-30 active:scale-95">Create</button>
          </div>
        </div>
      )}

      {polls?.map((poll: any) => (
        <div key={poll.id} className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4 space-y-3">
          <p className="text-[14px] font-semibold text-white">{poll.question}</p>
          <p className="text-[10px] text-zinc-600">{poll.total_votes} votes</p>
          <div className="space-y-2">
            {poll.options.map((opt: string, i: number) => {
              const voteCount = poll.votes?.find((v: any) => v.option_index === i)?.count || 0;
              const percent = poll.total_votes > 0 ? Math.round((voteCount / poll.total_votes) * 100) : 0;
              const hasVoted = poll.user_vote !== null && poll.user_vote !== undefined;
              const isVoted = poll.user_vote === i;
              return (
                <button key={i} onClick={() => !hasVoted && voteMutation.mutate({ pollId: poll.id, optionIndex: i })} disabled={hasVoted}
                  className={`w-full relative px-4 py-3 rounded-xl text-left text-[13px] overflow-hidden transition-all ${
                    isVoted ? 'border border-accent/30 text-accent' : hasVoted ? 'border border-bg-tertiary text-zinc-400' : 'border border-bg-tertiary text-zinc-300 hover:border-zinc-600 active:scale-[0.99]'
                  }`}>
                  {hasVoted && <div className="absolute inset-y-0 left-0 bg-accent/8 rounded-xl" style={{ width: `${percent}%` }} />}
                  <span className="relative">{opt}</span>
                  {hasVoted && <span className="relative float-right font-mono text-[11px] text-zinc-500">{percent}%</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = { run_club: '🏃', training: '🎯', nutrition: '🥗', wellness: '🧘', social: '🎉', brand: '✨', custom: '⭐' };
  return icons[category] || '⭐';
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

  const { data: history } = useQuery({
    queryKey: ['community-chat', communityId],
    queryFn: () => api.get(`/communities/${communityId}/chat`).then(r => r.data),
  });

  useEffect(() => {
    if (history?.messages) setMessages(history.messages);
  }, [history]);

  const connectWs = () => {
    const token = localStorage.getItem('token');
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
    connectWs();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [communityId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'chat', body: input.trim() }));
    setInput('');
  };

  return (
    <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-zinc-600">
          {connectionLost ? (
            <button onClick={handleRetry} className="text-red-400 active:scale-95 transition-transform">
              ● Connection lost. Tap to retry.
            </button>
          ) : connected ? (
            <span className="text-accent-green">● Live</span>
          ) : (
            <span className="text-zinc-600">○ Connecting...</span>
          )}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <span className="text-xl">💬</span>
            <p className="text-[11px] text-zinc-600 mt-2">Start the conversation</p>
          </div>
        )}
        {messages.map((msg: any) => (
          <div key={msg.id} className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[11px] font-bold text-zinc-500">{msg.user_name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-semibold text-zinc-300">{msg.user_name}</span>
                <span className="text-[11px] text-zinc-700">
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 break-words">{msg.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-bg-tertiary/50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={connected ? 'Type a message...' : 'Connecting...'}
          disabled={!connected}
          maxLength={1000}
          className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-bg-tertiary text-[12px] text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none disabled:opacity-40"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !connected}
          className="px-3 py-2 rounded-lg bg-accent text-white text-[11px] font-semibold disabled:opacity-30 active:scale-95 transition-all"
        >
          Send
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

  if (isLoading) return <div className="py-10 text-center text-zinc-600 text-sm">Loading...</div>;

  return (
    <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Sponsor button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowSponsor(true)}
          className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-400 active:scale-95 transition-all"
        >
          🏆 Sponsor Board (500 K)
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
        <div className="rounded-xl bg-accent/5 border border-accent/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-2">This Week</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-mono text-lg font-bold text-white">{digest.active_members}</p>
              <p className="text-[11px] text-zinc-500 uppercase">Active</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-white">{digest.total_runs}</p>
              <p className="text-[11px] text-zinc-500 uppercase">Runs</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-white">{digest.total_distance_km}</p>
              <p className="text-[11px] text-zinc-500 uppercase">km</p>
            </div>
          </div>
          {digest.top_runner && (
            <p className="text-[10px] text-zinc-500 mt-2 text-center">
              Top runner: <span className="text-accent font-medium">{digest.top_runner.name}</span> ({digest.top_runner.distance_km} km)
            </p>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {data?.my_rank && (
        <p className="text-[11px] text-zinc-500">Your rank: <span className="text-accent font-semibold">#{data.my_rank}</span></p>
      )}

      {data?.leaderboard?.length > 0 ? (
        <div className="space-y-1.5">
          {data.leaderboard.map((entry: any) => (
            <div key={entry.user_id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
              entry.rank <= 3 ? 'bg-accent-gold/5 border border-accent-gold/10' : 'bg-bg-secondary border border-bg-tertiary'
            }`}>
              <span className={`w-6 text-center font-mono text-[12px] font-bold ${
                entry.rank === 1 ? 'text-accent-gold' : entry.rank === 2 ? 'text-zinc-400' : entry.rank === 3 ? 'text-amber-600' : 'text-zinc-600'
              }`}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
              </span>
              <div className="w-7 h-7 rounded-full bg-bg-tertiary overflow-hidden flex-shrink-0">
                {entry.profile_image_url ? (
                  <img src={entry.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-zinc-500">
                    {entry.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-white truncate">{entry.name}</p>
                <p className="text-[11px] text-zinc-600">{entry.total_runs} runs</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[12px] font-bold text-accent">{entry.total_distance_km} km</p>
                {entry.streak > 0 && <p className="text-[11px] text-zinc-600">🔥 {entry.streak}d</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <span className="text-2xl">🏆</span>
          <p className="text-[12px] text-zinc-500 mt-2">No activity this week yet</p>
        </div>
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
