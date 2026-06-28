import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const NOTIFICATION_ICONS: Record<string, string> = {
  kudos: '❤️', comment: '💬', follow: '👋', event_reminder: '📅',
  event_rsvp: '🎉', community_post: '📝', community_join: '🏘️',
  achievement: '🏆', level_up: '⬆️', xp_award: '✨',
};

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationLink(n: any): string | null {
  // Social targets (feed/events/communities) are not linkable while the social
  // feature is hidden from the live app — they'd redirect to the dashboard.
  if (n.target_type === 'user') return `/user/${n.target_id}`;
  return null;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3 pb-6">
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-[22px] font-bold">Notifications</h1>
            {data?.unread_count > 0 && (
              <p className="text-[11px] text-accent mt-0.5">{data.unread_count} new</p>
            )}
          </div>
          {data?.unread_count > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-[11px] text-zinc-500 font-medium hover:text-zinc-300 transition-colors"
            >
              Mark all read
            </button>
          )}
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3 p-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-bg-tertiary" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-48 bg-bg-tertiary rounded" />
                  <div className="h-2.5 w-32 bg-bg-tertiary rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!data?.notifications || data.notifications.length === 0) && (
          <motion.div variants={fadeUp} className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-bg-tertiary flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
            <p className="text-[13px] text-zinc-500 text-center">No notifications yet</p>
          </motion.div>
        )}

        {/* Notification list */}
        {data?.notifications?.map((n: any) => {
          const link = getNotificationLink(n);
          return (
            <motion.div key={n.id} variants={fadeUp}>
              <button
                onClick={() => {
                  if (!n.read) {
                    api.post(`/notifications/${n.id}/read`);
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                    queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
                  }
                  if (link) navigate(link);
                }}
                className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all active:scale-[0.98] ${
                  n.read ? 'opacity-60' : 'bg-bg-secondary/50 border border-bg-tertiary/50'
                }`}
              >
                {/* Actor avatar or icon */}
                <div className="w-9 h-9 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center shrink-0">
                  {n.actor_image ? (
                    <img src={n.actor_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{NOTIFICATION_ICONS[n.type] || '🔔'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white font-medium leading-snug">{n.title}</p>
                  {n.body && <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{n.body}</p>}
                </div>
                <span className="text-[10px] text-zinc-700 font-mono shrink-0 mt-0.5">
                  {formatTimeAgo(n.created_at)}
                </span>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                )}
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </AppShell>
  );
}
