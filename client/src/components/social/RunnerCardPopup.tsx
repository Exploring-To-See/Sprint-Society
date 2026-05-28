import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const TIER_GRADIENTS: Record<string, string> = {
  advanced: 'from-amber-500/20 via-yellow-600/10 to-orange-500/20',
  intermediate: 'from-blue-500/20 via-cyan-500/10 to-indigo-500/20',
  beginner: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
};

const TIER_BORDERS: Record<string, string> = {
  advanced: 'border-accent-gold/30',
  intermediate: 'border-accent/30',
  beginner: 'border-accent-green/30',
};

interface RunnerCardPopupProps {
  userId: number | null;
  onClose: () => void;
}

export function RunnerCardPopup({ userId, onClose }: RunnerCardPopupProps) {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['runner-card', userId],
    queryFn: () => api.get(`/profile/${userId}`).then(r => r.data),
    enabled: !!userId,
  });

  const runner = profile ? {
    ...profile,
    tier: profile.current_tier || 'beginner',
    level: profile.current_level,
    total_km: profile.total_distance_km,
    best_pace: null,
    streak: profile.current_streak_days,
    top_badge: profile.recent_achievements?.[0] || null,
  } : null;

  return (
    <AnimatePresence>
      {userId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[280px]"
          >
            {runner ? (
              <div className={`rounded-2xl bg-gradient-to-b ${TIER_GRADIENTS[runner.tier] || TIER_GRADIENTS.beginner} border ${TIER_BORDERS[runner.tier] || TIER_BORDERS.beginner} bg-bg-secondary overflow-hidden`}>
                <div className="p-5 space-y-4">
                  {/* Avatar + Name */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-bg-tertiary border-2 border-bg-tertiary overflow-hidden mb-2">
                      {runner.profile_image_url ? (
                        <img src={runner.profile_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[20px] font-bold text-zinc-500">{runner.name?.[0]}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-[16px] text-white">{runner.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        runner.tier === 'advanced' ? 'bg-accent-gold/10 text-accent-gold' :
                        runner.tier === 'intermediate' ? 'bg-accent/10 text-accent' :
                        'bg-accent-green/10 text-accent-green'
                      }`}>
                        {runner.tier || 'New'}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">L{runner.level || 1}</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center px-2 py-2 rounded-lg bg-bg-primary/50">
                      <p className="font-mono font-bold text-[14px] text-white">{runner.total_km || 0}</p>
                      <p className="text-[11px] text-zinc-600 uppercase">km</p>
                    </div>
                    <div className="text-center px-2 py-2 rounded-lg bg-bg-primary/50">
                      <p className="font-mono font-bold text-[14px] text-accent">{runner.best_pace || '--'}</p>
                      <p className="text-[11px] text-zinc-600 uppercase">/km</p>
                    </div>
                    <div className="text-center px-2 py-2 rounded-lg bg-bg-primary/50">
                      <p className="font-mono font-bold text-[14px] text-white">{runner.streak || 0}</p>
                      <p className="text-[11px] text-zinc-600 uppercase">streak</p>
                    </div>
                  </div>

                  {/* Top badge */}
                  {runner.top_badge && (
                    <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg-primary/50 border border-bg-tertiary">
                      <span className="text-[14px]">{runner.top_badge.icon}</span>
                      <span className="text-[11px] font-medium text-zinc-400">{runner.top_badge.name}</span>
                    </div>
                  )}

                  {/* View Profile */}
                  <button
                    onClick={() => { onClose(); navigate(`/user/${userId}`); }}
                    className="w-full py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-semibold text-[12px] active:scale-[0.98] transition-all"
                  >
                    View Full Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-bg-secondary border border-bg-tertiary p-8 text-center">
                <div className="w-8 h-8 mx-auto rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
