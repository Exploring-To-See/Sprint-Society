import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [postText, setPostText] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: () => api.get(`/communities/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: members } = useQuery({
    queryKey: ['community-members', id],
    queryFn: () => api.get(`/communities/${id}/members`).then(r => r.data),
    enabled: !!id && showMembers,
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${id}/join`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id] });
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/communities/${id}/leave`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id] });
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
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

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse pt-4">
          <div className="h-6 w-32 bg-bg-tertiary rounded" />
          <div className="h-8 w-48 bg-bg-tertiary rounded" />
          <div className="h-4 w-full bg-bg-tertiary rounded" />
          <div className="h-12 w-full bg-bg-tertiary rounded-lg" />
        </div>
      </AppShell>
    );
  }

  if (!community) {
    return (
      <AppShell>
        <div className="flex flex-col items-center py-20 gap-3">
          <span className="text-3xl">🤷</span>
          <p className="text-zinc-500 text-[13px]">Community not found</p>
          <button onClick={() => navigate('/communities')} className="text-accent text-[12px] font-semibold">
            Back to communities
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/communities')}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[12px] font-medium">Communities</span>
        </button>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
              {community.avatar_url ? (
                <img src={community.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-2xl">{getCategoryIcon(community.category)}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-[20px] font-bold text-white">{community.name}</h1>
                {community.is_verified && (
                  <svg width="16" height="16" viewBox="0 0 16 16" className="text-accent">
                    <path d="M8 1l1.5 2.5L12.5 4l-.5 3 2 2.5-2.5 1.5L11 14l-3-1-3 1-.5-3L2 9.5 4 7l-.5-3 3-.5L8 1z" fill="currentColor"/>
                    <path d="M6 8l1.5 1.5L10 6.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">{community.member_count} members · by {community.owner_name}</p>
            </div>
          </div>
          {community.description && (
            <p className="text-[12px] text-zinc-400 leading-relaxed">{community.description}</p>
          )}
        </div>

        {/* Join/Leave + Members */}
        <div className="flex gap-2">
          {!community.is_member ? (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-accent text-white font-semibold text-[13px] active:scale-[0.98] transition-all"
            >
              Join Community
            </button>
          ) : (
            <>
              <div className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-center font-semibold text-[13px]">
                ✓ Member{community.user_role !== 'member' ? ` (${community.user_role})` : ''}
              </div>
              {community.user_role === 'member' && (
                <button
                  onClick={() => leaveMutation.mutate()}
                  className="px-4 py-2.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-zinc-500 text-[11px] font-medium active:scale-95 transition-all"
                >
                  Leave
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="px-4 py-2.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-zinc-400 text-[11px] font-medium active:scale-95 transition-all"
          >
            Members
          </button>
        </div>

        {/* Members panel */}
        <AnimatePresence>
          {showMembers && members && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="card p-3 space-y-2">
                {members.map((m: any) => (
                  <div key={m.user_id} className="flex items-center gap-2.5 py-1">
                    <div className="w-7 h-7 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center">
                      {m.profile_image_url ? (
                        <img src={m.profile_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-500">{m.name?.[0]}</span>
                      )}
                    </div>
                    <span className="text-[12px] text-white flex-1">{m.name}</span>
                    {m.role !== 'member' && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-accent">{m.role}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post input (only for members) */}
        {community.is_member && (
          <div className="space-y-2">
            <textarea
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="Share with the community..."
              maxLength={2000}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-bg-primary border border-bg-tertiary text-[12px] text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none resize-none"
            />
            <button
              onClick={() => postText.trim() && postMutation.mutate(postText)}
              disabled={!postText.trim() || postMutation.isPending}
              className="px-5 py-2 rounded-lg bg-accent text-white text-[12px] font-semibold disabled:opacity-30 active:scale-95 transition-all"
            >
              Post
            </button>
          </div>
        )}

        {/* Posts feed */}
        <div className="space-y-3">
          {community.recent_posts?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[12px] text-zinc-600">No posts yet. Be the first to share something!</p>
            </div>
          )}
          {community.recent_posts?.map((post: any) => (
            <div key={post.id} className="card p-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center">
                  {post.author_image ? (
                    <img src={post.author_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-zinc-500">{post.author_name?.[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-semibold text-white">{post.author_name}</span>
                  <span className="text-[10px] text-zinc-700 ml-2">
                    {formatTimeAgo(post.created_at)}
                  </span>
                </div>
                {post.pinned && (
                  <span className="text-[9px] font-semibold text-amber-400 uppercase">Pinned</span>
                )}
              </div>
              <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.body}</p>
              {post.image_url && (
                <img src={post.image_url} alt="" className="w-full rounded-lg mt-2" />
              )}
              <button
                onClick={() => likeMutation.mutate(post.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                  post.user_liked
                    ? 'bg-accent/10 text-accent'
                    : 'text-zinc-600 hover:text-zinc-400 hover:bg-bg-tertiary/50'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill={post.user_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2.5 6 2.5c1 0 1.7.5 2 1 .3-.5 1-1 2-1 1.5 0 3.5 1.5 3.5 4S8 14 8 14z"/>
                </svg>
                <span className="text-[11px] font-semibold">{post.likes_count || ''}</span>
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </AppShell>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    run_club: '🏃', training: '🎯', nutrition: '🥗', wellness: '🧘', social: '🎉', brand: '✨', custom: '⭐',
  };
  return icons[category] || '⭐';
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
