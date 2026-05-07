import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: stravaStatus } = useQuery({
    queryKey: ['strava-status'],
    queryFn: () => api.get('/strava/status').then(r => r.data),
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/gamification/achievements').then(r => r.data),
  });

  const { data: xp } = useQuery({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  const connectStrava = async () => {
    const { data } = await api.get('/strava/auth');
    window.location.href = data.url;
  };

  const syncMutation = useMutation({
    mutationFn: () => api.post('/strava/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      queryClient.invalidateQueries({ queryKey: ['run-stats'] });
    },
  });

  const earnedAchievements = achievements?.filter((a: any) => a.earned) || [];

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-5 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">{user?.name?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <h2 className="font-heading text-xl font-bold">{user?.name}</h2>
          <p className="text-white/40 text-sm">{user?.email}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-white/50">
            <span>Level {xp?.current_level || 1}</span>
            <span>•</span>
            <span>{xp?.total_xp || 0} XP</span>
            <span>•</span>
            <span>{xp?.current_streak_days || 0} day streak</span>
          </div>
        </motion.div>

        {/* Strava connection */}
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">
            Strava
          </h3>
          {stravaStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                <span className="text-sm text-white/70">Connected</span>
              </div>
              <Button
                onClick={() => syncMutation.mutate()}
                variant="secondary"
                size="sm"
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? 'Syncing...' : 'Sync Activities'}
              </Button>
              {syncMutation.isSuccess && (
                <p className="text-xs text-accent-green">Synced successfully!</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-white/50">Connect Strava to auto-sync your runs</p>
              <Button onClick={connectStrava} size="sm">
                Connect Strava
              </Button>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">
            Achievements ({earnedAchievements.length}/{achievements?.length || 0})
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {achievements?.slice(0, 12).map((achievement: any) => (
              <div
                key={achievement.id}
                className={`text-center p-2 rounded-xl ${achievement.earned ? 'bg-bg-tertiary' : 'bg-bg-tertiary/30 opacity-30'}`}
              >
                <span className="text-2xl block">{achievement.icon}</span>
                <p className="text-[9px] text-white/50 mt-1 line-clamp-1">{achievement.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard link / Logout */}
        <div className="space-y-3 pt-2">
          <Button onClick={logout} variant="ghost" fullWidth>
            Log out
          </Button>
        </div>

        <p className="text-center text-white/15 text-xs py-4">
          Sprint Society v1.0 — Kendu Entertainment
        </p>
      </div>
    </AppShell>
  );
}
