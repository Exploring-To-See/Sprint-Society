import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PaceChart } from './PaceChart';
import { ChallengeList } from './ChallengeList';
import { ReadinessCard } from './ReadinessCard';
import { TodaySession } from './TodaySession';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function Dashboard() {
  const { user } = useAuth();

  const { data: xp } = useQuery({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data),
  });

  const { data: paceData } = useQuery({
    queryKey: ['ideal-pace'],
    queryFn: () => api.get('/coaching/ideal-pace').then(r => r.data),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get('/coaching/challenges').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['run-stats'],
    queryFn: () => api.get('/runs/stats').then(r => r.data),
  });

  const level = xp?.current_level || 1;
  const totalXp = xp?.total_xp || 0;
  const streak = xp?.current_streak_days || 0;
  const progressPercent = xp?.level_progress_percent || 0;
  const xpToNext = xp?.xp_to_next_level || 100;
  const tierName = tier?.tier || 'beginner';
  const completedChallenges = challenges?.filter((c: any) => c.completed)?.length || 0;
  const totalChallenges = challenges?.length || 0;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const formatPace = (seconds: number) => {
    if (!seconds) return '--:--';
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Sprint Society</p>
          <h1 className="font-heading text-xl font-bold mt-0.5">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-bg-tertiary border border-bg-tertiary overflow-hidden flex items-center justify-center">
          {(user as any)?.profile_image_url ? (
            <img src={(user as any).profile_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-zinc-400">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      </motion.div>

      {/* Readiness + Today's Session */}
      <ReadinessCard />
      <TodaySession />

      {/* Tier + XP */}
      <motion.div variants={fadeUp} className="card p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-2xl">
              {tierName === 'advanced' ? '👑' : tierName === 'intermediate' ? '🔥' : '🌱'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                tierName === 'advanced' ? 'bg-accent-gold/10 text-accent-gold' :
                tierName === 'intermediate' ? 'bg-accent/10 text-accent' :
                'bg-accent-green/10 text-accent-green'
              }`}>
                {tierName.charAt(0).toUpperCase() + tierName.slice(1)}
              </span>
              <span className="text-xs text-zinc-500">Level {level}</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              {totalXp.toLocaleString()} XP — {xpToNext} to next level
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="label mb-1">Streak</p>
          <p className="font-mono font-bold text-2xl text-accent tabular-nums">{streak}</p>
          <p className="text-[10px] text-zinc-600">days</p>
        </div>
        <div className="card p-4 text-center">
          <p className="label mb-1">Runs</p>
          <p className="font-mono font-bold text-2xl text-white tabular-nums">{stats?.total_runs || 0}</p>
          <p className="text-[10px] text-zinc-600">total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="label mb-1">Distance</p>
          <p className="font-mono font-bold text-2xl text-white tabular-nums">
            {stats?.total_distance ? (stats.total_distance / 1000).toFixed(0) : '0'}
          </p>
          <p className="text-[10px] text-zinc-600">km</p>
        </div>
      </motion.div>

      {/* Pace Zones */}
      {paceData?.zones && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-[15px]">Pace zones</h3>
            <span className="text-[11px] text-accent font-medium">min/km</span>
          </div>
          <div className="card p-4 space-y-3">
            {[
              { label: 'Easy', value: paceData.zones.easy },
              { label: 'Tempo', value: paceData.zones.tempo, highlight: true },
              { label: 'Interval', value: paceData.zones.interval },
              { label: 'Race', value: paceData.zones.race },
            ].map((zone) => (
              <div key={zone.label} className="flex items-center justify-between">
                <span className="text-[13px] text-zinc-400">{zone.label}</span>
                <span className={`font-mono text-sm font-medium ${zone.highlight ? 'text-accent' : 'text-white'}`}>
                  {formatPace(zone.value)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pace Trend Chart */}
      <motion.div variants={fadeUp}>
        <h3 className="font-heading font-semibold text-[15px] mb-3">Pace trend</h3>
        <div className="card p-4">
          <PaceChart />
        </div>
      </motion.div>

      {/* Challenges */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-[15px]">This week</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg-tertiary text-zinc-400">
            {completedChallenges}/{totalChallenges}
          </span>
        </div>
        <ChallengeList />
      </motion.div>

      {/* Footer */}
      <motion.div variants={fadeUp} className="text-center py-4">
        <p className="text-[11px] text-zinc-700 italic">
          Every run counts. Keep showing up.
        </p>
      </motion.div>
    </motion.div>
  );
}
