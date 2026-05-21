import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

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

  const kudosMutation = useMutation({
    mutationFn: ({ activityId, remove }: { activityId: number; remove: boolean }) =>
      remove
        ? api.delete(`/social/kudos/${activityId}`)
        : api.post(`/social/kudos/${activityId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

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
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 pb-6">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="font-heading text-[22px] font-bold">Club Feed</h1>
          <p className="text-[11px] text-zinc-600 mt-0.5">Your crew's latest runs</p>
        </motion.div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-tertiary" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-24 bg-bg-tertiary rounded" />
                    <div className="h-2 w-16 bg-bg-tertiary rounded" />
                  </div>
                </div>
                <div className="h-16 bg-bg-tertiary rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!data?.feed || data.feed.length === 0) && (
          <motion.div variants={fadeUp} className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-bg-tertiary flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-[13px] text-zinc-500 text-center max-w-[260px]">
              Follow club members to see their runs here. Check the Discover tab to find runners.
            </p>
          </motion.div>
        )}

        {/* Feed items */}
        {data?.feed?.map((activity: any) => (
          <motion.div
            key={activity.id}
            variants={fadeUp}
            className="card overflow-hidden"
          >
            {/* User header */}
            <div className="flex items-center gap-3 p-4 pb-0">
              <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-bg-tertiary overflow-hidden flex items-center justify-center shrink-0">
                {activity.profile_image_url ? (
                  <img src={activity.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-zinc-500">
                    {activity.user_name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white">{activity.user_name}</p>
                <p className="text-[10px] text-zinc-600">{formatTimeAgo(activity.start_date)}</p>
              </div>
            </div>

            {/* Run stats */}
            <div className="p-4">
              <div className="flex gap-4 py-3 px-4 rounded-lg bg-bg-primary/60 border border-bg-tertiary/50">
                <div>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Distance</p>
                  <p className="font-mono text-[15px] font-bold text-white">{activity.distance_km}<span className="text-[10px] text-zinc-600 ml-0.5">km</span></p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Duration</p>
                  <p className="font-mono text-[15px] font-bold text-white">{formatDuration(activity.moving_time_seconds)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Pace</p>
                  <p className="font-mono text-[15px] font-bold text-accent">{activity.pace_formatted}<span className="text-[10px] text-zinc-600">/km</span></p>
                </div>
                {activity.elevation_gain > 0 && (
                  <div>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Elev</p>
                    <p className="font-mono text-[15px] font-bold text-white">{Math.round(activity.elevation_gain)}<span className="text-[10px] text-zinc-600">m</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions — Kudos + Comment */}
            <div className="flex items-center gap-1 px-4 pb-3 border-t border-bg-tertiary/50 pt-3">
              <button
                onClick={() => kudosMutation.mutate({ activityId: activity.id, remove: activity.user_gave_kudos })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95 ${
                  activity.user_gave_kudos
                    ? 'bg-accent/10 text-accent'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-bg-tertiary/50'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill={activity.user_gave_kudos ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2.5 6 2.5c1 0 1.7.5 2 1 .3-.5 1-1 2-1 1.5 0 3.5 1.5 3.5 4S8 14 8 14z"/>
                </svg>
                <span className="text-[11px] font-semibold">{activity.kudos_count || ''}</span>
              </button>

              <button
                onClick={() => setCommentingOn(commentingOn === activity.id ? null : activity.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-bg-tertiary/50 transition-all duration-150 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2H6l-3 2.5V11H4a2 2 0 01-2-2V4z"/>
                </svg>
                <span className="text-[11px] font-semibold">{activity.comments_count || ''}</span>
              </button>
            </div>

            {/* Comment input */}
            <AnimatePresence>
              {commentingOn === activity.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Nice run!"
                      maxLength={500}
                      className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-bg-tertiary text-[12px] text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && commentText.trim()) {
                          commentMutation.mutate({ activityId: activity.id, body: commentText });
                        }
                      }}
                    />
                    <button
                      onClick={() => commentText.trim() && commentMutation.mutate({ activityId: activity.id, body: commentText })}
                      disabled={!commentText.trim() || commentMutation.isPending}
                      className="px-3 py-2 rounded-lg bg-accent text-white text-[11px] font-semibold disabled:opacity-30 active:scale-95 transition-all"
                    >
                      Post
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </AppShell>
  );
}
