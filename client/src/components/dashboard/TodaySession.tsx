import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const SESSION_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  easy: { icon: '🏃', color: 'text-accent-green', bg: 'bg-accent-green/8' },
  long: { icon: '🛤️', color: 'text-blue-400', bg: 'bg-blue-400/8' },
  tempo: { icon: '⚡', color: 'text-accent', bg: 'bg-accent/8' },
  interval: { icon: '🔥', color: 'text-red-400', bg: 'bg-red-400/8' },
  recovery: { icon: '🧘', color: 'text-purple-400', bg: 'bg-purple-400/8' },
  rest: { icon: '😴', color: 'text-zinc-500', bg: 'bg-zinc-800/50' },
  cross_training: { icon: '🏊', color: 'text-cyan-400', bg: 'bg-cyan-400/8' },
  fartlek: { icon: '🎲', color: 'text-accent-warm', bg: 'bg-accent-warm/8' },
};

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function TodaySession({ streak = 0 }: { streak?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['training-week'],
    queryFn: () => api.get('/training/week').then(r => r.data),
  });

  if (isLoading) {
    return <motion.div variants={fadeUp} className="h-[88px] rounded-xl bg-bg-secondary border border-bg-tertiary animate-pulse" />;
  }

  if (!data?.week) return null;

  const today = new Date().getDay() || 7;
  const todaySession = data.week.sessions.find((s: any) => s.day === today);
  if (!todaySession) return null;

  const config = SESSION_CONFIG[todaySession.type] || SESSION_CONFIG.easy;
  const isRest = todaySession.type === 'rest';

  const urgencyText = streak >= 7
    ? `Keep the ${streak}-day fire alive`
    : streak >= 3
    ? `Don't break your ${streak}-day streak`
    : null;

  return (
    <motion.div variants={fadeUp} className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">Today</p>
          {urgencyText && (
            <span className="text-[11px] text-accent font-medium">{urgencyText}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-zinc-700">W{data.current_week}/{data.total_weeks}</span>
          <span className={`text-[11px] px-1.5 py-[1px] rounded font-medium capitalize ${config.bg} ${config.color}`}>
            {data.week.phase}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center text-xl shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-white leading-tight">{todaySession.title}</p>
          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">{todaySession.description}</p>
        </div>
      </div>

      {/* Pace + RPE bar */}
      {!isRest && todaySession.target_pace_per_km && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-bg-tertiary/70">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-600 uppercase tracking-wider">Pace</span>
            <span className={`font-mono text-[12px] font-semibold ${config.color}`}>
              {formatPace(todaySession.target_pace_per_km)}/km
            </span>
          </div>
          {todaySession.rpe > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-600 uppercase tracking-wider">RPE</span>
              <div className="flex gap-[2px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-[4px] h-[10px] rounded-[1px] ${
                      i < todaySession.rpe
                        ? i < 4 ? 'bg-accent-green' : i < 7 ? 'bg-amber-400' : 'bg-red-400'
                        : 'bg-bg-tertiary'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          <span className="ml-auto text-[11px] text-zinc-700 font-medium">Auto-tracked</span>
        </div>
      )}
    </motion.div>
  );
}
