import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface RunnerCardPopupProps {
  userId: number;
  onClose: () => void;
}

interface RunnerProfile {
  id: number;
  name: string;
  profile_image_url: string | null;
  running_experience: string | null;
  current_tier: 'beginner' | 'intermediate' | 'advanced' | null;
  current_level: number;
  total_xp: number;
  total_runs: number;
  total_distance_km: number;
  current_streak_days: number;
  recent_achievements: {
    name: string;
    description: string;
    icon: string;
    category: string;
    earned_at: string;
    earned: boolean;
  }[];
}

const tierGradients: Record<string, string> = {
  beginner: 'from-emerald-600 via-emerald-500 to-green-400',
  intermediate: 'from-orange-600 via-orange-500 to-amber-400',
  advanced: 'from-yellow-600 via-amber-500 to-yellow-300',
};

const tierLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const tierBorderColors: Record<string, string> = {
  beginner: 'border-emerald-400/50',
  intermediate: 'border-orange-400/50',
  advanced: 'border-amber-400/50',
};

export function RunnerCardPopup({ userId, onClose }: RunnerCardPopupProps) {
  const navigate = useNavigate();

  const { data: profile, isLoading, isError } = useQuery<RunnerProfile>({
    queryKey: ['runner-card', userId],
    queryFn: async () => {
      const res = await api.get(`/profile/${userId}`);
      return res.data;
    },
    staleTime: 30_000,
  });

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const tier = profile?.current_tier || 'beginner';
  const gradient = tierGradients[tier] || tierGradients.beginner;
  const borderColor = tierBorderColors[tier] || tierBorderColors.beginner;
  const topAchievement = profile?.recent_achievements?.[0];

  // Best pace placeholder — API returns total distance and runs, not pace.
  // Show avg km/run as a useful stat instead.
  const avgKmPerRun = profile && profile.total_runs > 0
    ? (profile.total_distance_km / profile.total_runs).toFixed(1)
    : '—';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close popup"
        />

        {/* Card */}
        <motion.div
          className={`relative w-full max-w-[320px] rounded-2xl border ${borderColor} bg-bg-secondary overflow-hidden shadow-2xl shadow-black/50`}
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          role="dialog"
          aria-modal="true"
          aria-label="Runner profile card"
        >
          {/* Gradient Header */}
          <div className={`h-24 bg-gradient-to-br ${gradient} relative`}>
            <div className="absolute inset-0 bg-black/10" />
            {/* Decorative dots like a Pokemon card */}
            <div className="absolute top-3 right-3 flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Profile Photo — overlaps header */}
          <div className="flex flex-col items-center -mt-10 px-5 pb-5">
            {isLoading ? (
              <div className="w-20 h-20 rounded-full bg-bg-tertiary animate-pulse border-4 border-bg-secondary" />
            ) : (
              <div className={`w-20 h-20 rounded-full border-4 border-bg-secondary overflow-hidden bg-bg-tertiary`}>
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-500">
                    {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}

            {/* Name */}
            {isLoading ? (
              <div className="mt-3 w-28 h-5 rounded bg-bg-tertiary animate-pulse" />
            ) : isError ? (
              <p className="mt-3 text-sm text-red-400">Failed to load profile</p>
            ) : (
              <>
                <h3 className="mt-3 text-lg font-bold text-white truncate max-w-full">
                  {profile?.name}
                </h3>

                {/* Badges row */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/10 text-white/90">
                    Level {profile?.current_level || 1}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r ${gradient} text-white`}>
                    {tierLabels[tier] || 'Beginner'}
                  </span>
                </div>

                {/* Stats */}
                <div className="w-full grid grid-cols-3 gap-2 mt-4 bg-bg-primary/50 rounded-xl p-3">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-white">
                      {profile?.total_distance_km || 0}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                      Total KM
                    </span>
                  </div>
                  <div className="flex flex-col items-center border-x border-bg-tertiary">
                    <span className="text-base font-bold text-white">
                      {avgKmPerRun}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                      Avg KM/Run
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-white">
                      {profile?.current_streak_days || 0}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                      Streak
                    </span>
                  </div>
                </div>

                {/* Top Achievement */}
                {topAchievement && (
                  <div className="w-full mt-3 flex items-center gap-2 bg-bg-primary/50 rounded-lg p-2.5">
                    <span className="text-xl">{topAchievement.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {topAchievement.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {topAchievement.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* View Full Profile button */}
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/user/${userId}`);
                  }}
                  className="w-full mt-4 py-2.5 rounded-lg bg-accent text-black text-sm font-semibold transition-all hover:bg-accent-warm active:scale-[0.97]"
                >
                  View Full Profile
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RunnerCardPopup;
