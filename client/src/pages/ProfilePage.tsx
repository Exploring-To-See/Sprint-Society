import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import type { Achievement, PersonalRecord, UserXP } from '../../../shared/types';

// --- Animations ---
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

// --- Tier Styling ---
const TIER_CONFIG: Record<string, { bg: string; border: string; text: string; gradient: string; label: string }> = {
  advanced: {
    bg: 'bg-accent-gold/10',
    border: 'border-accent-gold/30',
    text: 'text-accent-gold',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
    label: 'Advanced',
  },
  intermediate: {
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    text: 'text-accent',
    gradient: 'from-blue-500/20 via-cyan-500/10 to-indigo-500/20',
    label: 'Intermediate',
  },
  beginner: {
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/30',
    text: 'text-accent-green',
    gradient: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
    label: 'Beginner',
  },
};

// --- Count-up Hook ---
function useCountUp(target: number, duration = 1200, enabled = true): number {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration, enabled]);

  return value;
}

// --- Helpers ---
function formatPace(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}


// --- Components ---

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-bg-tertiary/50 ${className}`} />;
}

function CountUpStat({ label, value, unit, accent }: { label: string; value: number; unit?: string; accent?: boolean }) {
  const animated = useCountUp(value);
  return (
    <div className="flex-1 text-center p-3">
      <div className="flex items-baseline justify-center gap-0.5">
        <span className={`font-mono font-bold text-[20px] tabular-nums tracking-tight ${accent ? 'text-accent' : 'text-white'}`}>
          {animated}
        </span>
        {unit && <span className="text-[9px] text-zinc-600 font-medium">{unit}</span>}
      </div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

function RunningDNACard({ dna, tier }: { dna: any; tier: string }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.beginner;

  return (
    <motion.div
      variants={fadeUp}
      className={`relative rounded-2xl overflow-hidden border ${config.border}`}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-60`} />
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '20px 20px',
      }} />

      <div className="relative p-5 space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Running DNA</p>
            <h3 className="font-heading text-[16px] font-bold text-white mt-0.5">Athlete Card</h3>
          </div>
          <div className={`px-2.5 py-1 rounded-lg ${config.bg} border ${config.border}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* VO2max */}
        {dna?.estimated_vo2max && (
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-zinc-500">VO2max</p>
              <p className="font-mono text-[28px] font-bold text-white leading-none mt-0.5">
                {dna.estimated_vo2max}
              </p>
            </div>
            {/* Pace zones mini */}
            {dna.pace_zones && (
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Easy', value: dna.pace_zones.easy, color: 'text-emerald-400' },
                  { label: 'Tempo', value: dna.pace_zones.tempo, color: 'text-amber-400' },
                  { label: 'Interval', value: dna.pace_zones.interval, color: 'text-red-400' },
                  { label: 'Race', value: dna.pace_zones.race, color: 'text-accent' },
                ].map(z => (
                  <div key={z.label} className="flex items-baseline justify-between px-2 py-1.5 rounded-md bg-black/20">
                    <span className="text-[8px] text-zinc-500">{z.label}</span>
                    <span className={`font-mono text-[11px] font-bold ${z.color}`}>{z.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personality tags */}
        {dna?.personality_tags && dna.personality_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dna.personality_tags.slice(0, 5).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-semibold text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Coach badge */}
        {dna?.ai_coach_name && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            <span className="text-[10px] text-zinc-600">Coach:</span>
            <span className="text-[11px] font-semibold text-accent">{dna.ai_coach_name}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PRBoard({ records }: { records: any }) {
  const racePRs: PersonalRecord[] = records?.race_prs || [];

  const prMap: Record<string, PersonalRecord | undefined> = {
    '5K': racePRs.find(r => r.category === '5k' || r.distance_meters === 5000),
    '10K': racePRs.find(r => r.category === '10k' || r.distance_meters === 10000),
    'Half': racePRs.find(r => r.category === 'half_marathon' || r.distance_meters === 21097),
    'Marathon': racePRs.find(r => r.category === 'marathon' || r.distance_meters === 42195),
  };

  return (
    <motion.div variants={fadeUp} className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Personal Records</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(prMap).map(([label, pr]) => (
          <div
            key={label}
            className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary"
          >
            <div>
              <p className="text-[10px] text-zinc-500 font-medium">{label}</p>
              <p className="font-mono font-bold text-[14px] text-white mt-0.5">
                {pr ? pr.formatted : '--:--'}
              </p>
            </div>
            {pr?.improvement && (
              <div className="flex items-center gap-0.5">
                <svg width="10" height="10" viewBox="0 0 10 10" className="text-accent-green">
                  <path d="M5 2L8 6H2L5 2Z" fill="currentColor" />
                </svg>
                <span className="text-[9px] font-mono text-accent-green">
                  {pr.improvement.percent > 0 ? `${pr.improvement.percent.toFixed(1)}%` : ''}
                </span>
              </div>
            )}
            {!pr && (
              <span className="text-[9px] text-zinc-700">No data</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AchievementShowcase({ achievements }: { achievements: Achievement[] }) {
  const earned = achievements.filter(a => a.earned).slice(0, 4);
  if (earned.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Achievements</h3>
        <span className="text-[10px] font-mono text-zinc-600">{earned.length} earned</span>
      </div>
      <div className="flex gap-2">
        {earned.map((a) => (
          <div
            key={a.id}
            className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-bg-secondary border border-bg-tertiary"
          >
            <span className="text-[22px]">{a.icon}</span>
            <span className="text-[8px] text-zinc-500 font-medium text-center line-clamp-1">{a.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CommunitiesList({ communities }: { communities: { id: number; name: string; category: string }[] }) {
  const navigate = useNavigate();
  if (!communities || communities.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Communities</h3>
      <div className="flex flex-wrap gap-2">
        {communities.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/communities/${c.id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-secondary border border-bg-tertiary active:scale-[0.97] transition-all hover:border-zinc-600"
          >
            <span className="text-[11px] text-zinc-300 font-medium">{c.name}</span>
            <span className="text-[9px] text-zinc-600 capitalize">{c.category.replace('_', ' ')}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: stravaStatus } = useQuery({
    queryKey: ['strava-status'],
    queryFn: () => api.get('/strava/status').then(r => r.data),
  });

  const connectStrava = async () => {
    const { data } = await api.get('/strava/auth');
    window.location.href = data.url;
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setPasswordErr('');
    setPasswordMsg('');
    try {
      const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
      setPasswordMsg(data.message || 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowPassword(false), 2000);
    } catch (err: any) {
      setPasswordErr(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Settings</h3>

      {/* Strava */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" fill="#FC4C02"/>
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-medium text-white">Strava</p>
            <p className="text-[9px] text-zinc-600">
              {stravaStatus?.connected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        {stravaStatus?.connected ? (
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
        ) : (
          <button onClick={connectStrava} className="text-[10px] font-semibold text-accent active:scale-95 transition-all">
            Connect
          </button>
        )}
      </div>

      {/* Notifications */}
      <button
        onClick={() => navigate('/notifications')}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-accent">
              <path d="M8 1.5a4 4 0 014 4v2.5l1.5 2.5H2.5L4 8V5.5a4 4 0 014-4zM6 12.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[12px] font-medium text-white">Notifications</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-600">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Subscription */}
      <button
        onClick={() => navigate('/subscription')}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-gold/10 flex items-center justify-center">
            <span className="text-[12px]">👑</span>
          </div>
          <p className="text-[12px] font-medium text-white">Subscription</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-600">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Change Password */}
      {!showPassword ? (
        <button
          onClick={() => setShowPassword(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-500/10 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-zinc-400">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[12px] font-medium text-white">Change Password</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-600">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      ) : (
        <div className="px-4 py-4 rounded-xl bg-bg-secondary border border-bg-tertiary space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-bg-primary border border-white/10 text-[13px] text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
          <input
            type="password"
            placeholder="New password (6+ chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-bg-primary border border-white/10 text-[13px] text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
          {passwordErr && <p className="text-red-400 text-[11px]">{passwordErr}</p>}
          {passwordMsg && <p className="text-accent-green text-[11px]">{passwordMsg}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleChangePassword} disabled={!currentPassword || newPassword.length < 6 || loading}>
              {loading ? 'Saving...' : 'Update'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowPassword(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-secondary border border-red-500/10 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-red-400">
              <path d="M6 2H4a2 2 0 00-2 2v8a2 2 0 002 2h2M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[12px] font-medium text-red-400">Log Out</p>
        </div>
      </button>
    </motion.div>
  );
}

// --- Main Profile Page ---

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch own profile using user id
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile', (user as any)?.id],
    queryFn: () => api.get(`/profile/${(user as any)?.id}`).then(r => r.data),
    enabled: !!(user as any)?.id,
  });

  // Fetch AI profiling DNA
  const { data: dna } = useQuery({
    queryKey: ['profiling-dna'],
    queryFn: () => api.get('/profiling/dna').then(r => r.data).catch(() => null),
  });

  // Fetch XP / gamification
  const { data: xp } = useQuery<UserXP>({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  // Fetch records
  const { data: records } = useQuery({
    queryKey: ['records'],
    queryFn: () => api.get('/records').then(r => r.data).catch(() => null),
  });

  // Fetch achievements
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: () => api.get('/gamification/achievements').then(r => r.data).catch(() => []),
  });

  // Fetch run stats
  const { data: stats } = useQuery({
    queryKey: ['run-stats'],
    queryFn: () => api.get('/runs/stats').then(r => r.data).catch(() => null),
  });

  // Communities come from the profile query response

  if (profileLoading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  const currentTier: string = profile?.current_tier || dna?.tier || 'beginner';
  const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.beginner;
  const totalKm = stats?.total_distance ? Math.round(stats.total_distance / 1000) : (profile?.total_distance_km || 0);
  const avgPace = stats?.avg_pace || 0;
  const consistencyPercent = stats?.consistency_percent || 0;
  const longestStreak = xp?.longest_streak_days || 0;
  const currentLevel = xp?.current_level || 1;
  const memberSince = profile?.created_at || profile?.joined_at || (user as any)?.created_at;

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 pb-8">

        {/* === HEADER === */}
        <motion.div variants={fadeUp} className="flex items-center gap-4 pt-2">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full border-2 ${tierConfig.border} overflow-hidden flex items-center justify-center bg-bg-tertiary flex-shrink-0`}>
            {(profile?.profile_image_url || (user as any)?.profile_image_url) ? (
              <img
                src={profile?.profile_image_url || (user as any)?.profile_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-zinc-500">
                {(profile?.name || user?.name)?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-[22px] font-bold text-white truncate">
              {profile?.name || user?.name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border ${tierConfig.bg} ${tierConfig.border} ${tierConfig.text}`}>
                {tierConfig.label}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">L{currentLevel}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              {profile?.city && (
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-zinc-600">
                    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  {profile.city}
                </span>
              )}
              {memberSince && (
                <span className="text-[10px] text-zinc-600">
                  Since {new Date(memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* === RUNNING DNA CARD === */}
        {(dna || currentTier) && (
          <RunningDNACard dna={dna} tier={currentTier} />
        )}

        {/* === STATS SECTION (count-up) === */}
        <motion.div variants={fadeUp}>
          <div className="rounded-xl bg-bg-secondary border border-bg-tertiary overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-bg-tertiary">
              <CountUpStat label="Total KM" value={totalKm} unit="km" />
              <CountUpStat label="Level" value={currentLevel} accent />
              <CountUpStat label="Streak" value={xp?.current_streak_days || 0} unit="days" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-bg-tertiary border-t border-bg-tertiary">
              <div className="flex-1 text-center p-3">
                <span className="font-mono font-bold text-[20px] tabular-nums tracking-tight text-white">
                  {avgPace ? formatPace(avgPace) : '--:--'}
                </span>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mt-1">Avg Pace</p>
              </div>
              <CountUpStat label="Consistency" value={consistencyPercent} unit="%" />
              <CountUpStat label="Best Streak" value={longestStreak} unit="days" />
            </div>
          </div>
        </motion.div>

        {/* === PERSONAL RECORDS === */}
        {records && <PRBoard records={records} />}

        {/* === UPDATE AI BUTTON === */}
        <motion.div variants={fadeUp}>
          <button
            onClick={() => navigate('/profiling')}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-gradient-to-r from-accent/10 to-accent-gold/5 border border-accent/20 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-accent">
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M12.5 3.5L11 5M5 11l-1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-white">Update AI Profile</p>
                <p className="text-[10px] text-zinc-500">Re-analyze your running DNA</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-accent group-hover:translate-x-0.5 transition-transform">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>

        {/* === ACHIEVEMENTS SHOWCASE === */}
        {achievements && achievements.length > 0 && (
          <AchievementShowcase achievements={achievements} />
        )}

        {/* === COMMUNITIES === */}
        <CommunitiesList communities={profile?.communities || []} />

        {/* === SETTINGS === */}
        <SettingsSection />

        {/* Footer */}
        <p className="text-center text-white/10 text-[10px] pt-4">
          Sprint Society v1.0 — Kendu Entertainment
        </p>
      </motion.div>
    </AppShell>
  );
}
