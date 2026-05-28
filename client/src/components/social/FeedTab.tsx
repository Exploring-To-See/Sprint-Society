import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const REACTIONS = ['🙌', '🔥', '💪', '⚡', '🫡'];

export function FeedTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: feed, isLoading } = useQuery({
    queryKey: ['social-feed'],
    queryFn: () => api.get('/social/feed').then(r => r.data).catch(() => ({ activities: [] })),
  });

  const kudosMutation = useMutation({
    mutationFn: ({ activityId, type }: { activityId: number; type: string }) =>
      api.post(`/social/kudos/${activityId}`, { reaction_type: type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-feed'] }),
  });

  const activities = feed?.activities || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-bg-secondary animate-pulse" />)}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl mb-2">👟</p>
        <p className="text-[12px] font-bold text-zinc-400">No activity yet</p>
        <p className="text-[10px] text-zinc-600 mt-1">Follow runners to see their runs here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity: any) => (
        <div key={activity.id} className="py-3 border-b border-bg-tertiary/50">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-2">
            <button onClick={() => navigate(`/user/${activity.user_id}`)} className="active:scale-95">
              {activity.profile_image_url ? (
                <img src={activity.profile_image_url} className="w-8 h-8 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  {activity.user_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </button>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-white">{activity.user_name || 'Runner'}</p>
              <p className="text-[11px] text-zinc-600">{activity.time_ago || 'recently'}</p>
            </div>
            {activity.streak_days >= 7 && (
              <span className="text-[11px] text-accent font-bold">🔥{activity.streak_days}</span>
            )}
          </div>

          {/* Content */}
          {activity.caption && (
            <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">{activity.caption}</p>
          )}

          {/* Run stats */}
          <div className="flex gap-4 text-[10px] text-zinc-500 font-semibold">
            {activity.distance_km && <span>{activity.distance_km.toFixed(1)} km</span>}
            {activity.pace_formatted && <span>{activity.pace_formatted}/km</span>}
            {activity.duration_formatted && <span>{activity.duration_formatted}</span>}
          </div>

          {/* Reactions */}
          <div className="flex gap-2 mt-2">
            {REACTIONS.map(r => (
              <button
                key={r}
                onClick={() => kudosMutation.mutate({ activityId: activity.id, type: r })}
                className="text-[15px] opacity-50 hover:opacity-100 active:scale-125 transition-all"
              >
                {r}
              </button>
            ))}
            {activity.kudos_count > 0 && (
              <span className="text-[11px] text-zinc-600 self-center ml-1">{activity.kudos_count}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
