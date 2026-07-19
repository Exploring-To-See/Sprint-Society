import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ComponentType, SVGProps } from 'react';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import {
  Bell, Heart, Chat, Hand, Calendar, Check, Send, CommunityOutline, Trophy, Chart, Spark,
} from '../components/ss/icons';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

type SsIcon = ComponentType<SVGProps<SVGSVGElement>>;

const NOTIFICATION_ICONS: Record<string, SsIcon> = {
  kudos: Heart,
  comment: Chat,
  follow: Hand,
  event_reminder: Calendar,
  event_rsvp: Check,
  community_post: Send,
  community_join: CommunityOutline,
  achievement: Trophy,
  level_up: Chart,
  xp_award: Spark,
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
  if (n.target_type === 'activity') return '/social';
  if (n.target_type === 'event') return `/events/${n.target_id}`;
  if (n.target_type === 'community') return `/communities/${n.target_id}`;
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

  const invalidateUnread = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    // the shell badge reads 'notifications-unread'; the legacy key is kept for safety
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
  };

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: invalidateUnread,
  });

  return (
    <SSScreen bodyLabel="Notifications">
      <motion.div variants={stagger} initial="hidden" animate="show" className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6, paddingBottom: 24 }}>

        {/* Header */}
        <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>
              Notifications
            </h1>
            {data?.unread_count > 0 && (
              <p className="num" style={{ font: '600 11px var(--mono)', color: 'var(--accent-2)', marginTop: 3 }}>
                {data.unread_count} new
              </p>
            )}
          </div>
          {data?.unread_count > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              style={{ font: '600 11px var(--body)', color: 'var(--accent-2)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
            >
              Mark all read
            </button>
          )}
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2, 3, 4].map(i => <SSSkeleton key={i} height={58} style={{ borderRadius: 14 }} />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!data?.notifications || data.notifications.length === 0) && (
          <SSEmpty
            icon={<Bell width={22} height={22} />}
            title="No notifications yet"
            body="Kudos, comments and event reminders will land here."
            testid="notifications-empty"
          />
        )}

        {/* Notification list */}
        {data?.notifications?.map((n: any) => {
          const link = getNotificationLink(n);
          const Icon = NOTIFICATION_ICONS[n.type] || Bell;
          return (
            <motion.div key={n.id} variants={fadeUp}>
              <button
                onClick={() => {
                  if (!n.read) {
                    api.post(`/notifications/${n.id}/read`);
                    invalidateUnread();
                  }
                  if (link) navigate(link);
                }}
                className={`tile ${n.read ? 'recess' : ''} w-full`}
                style={{
                  flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: '12px 13px',
                  cursor: 'pointer', textAlign: 'left', opacity: n.read ? 0.62 : 1,
                }}
              >
                {/* Actor avatar or type icon */}
                <span style={{ width: 34, height: 34, borderRadius: '50%', flex: 'none', overflow: 'hidden', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--hair)' }}>
                  {n.actor_image ? (
                    <img src={n.actor_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon width={14} height={14} style={{ color: n.read ? 'var(--muted-2)' : 'var(--accent-2)' }} />
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', font: '600 12.5px var(--body)', color: 'var(--fg)', lineHeight: 1.35 }}>
                    {n.title}
                  </span>
                  {n.body && (
                    <span style={{ display: 'block', font: '400 11px var(--body)', color: 'var(--muted-2)', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {n.body}
                    </span>
                  )}
                </span>
                <span className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', flex: 'none', marginTop: 2 }}>
                  {formatTimeAgo(n.created_at)}
                </span>
                {!n.read && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flex: 'none', marginTop: 6, boxShadow: '0 0 0 3px rgba(249,115,22,.16)' }} />
                )}
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </SSScreen>
  );
}
