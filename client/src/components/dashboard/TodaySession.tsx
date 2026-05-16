import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const SESSION_ICONS: Record<string, string> = {
  easy: '🏃',
  long: '🛤️',
  tempo: '⚡',
  interval: '🔥',
  recovery: '🧘',
  rest: '😴',
  cross_training: '🏊',
  fartlek: '🎲',
};

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function TodaySession() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['training-week'],
    queryFn: () => api.get('/training/week').then(r => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: (payload: { week_number: number; day: number }) =>
      api.post('/training/complete-session', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-week'] });
      queryClient.invalidateQueries({ queryKey: ['xp'] });
    },
  });

  if (isLoading || !data?.week) return null;

  const today = new Date().getDay() || 7; // 1=Mon ... 7=Sun
  const todaySession = data.week.sessions.find((s: any) => s.day === today);

  if (!todaySession) return null;

  const icon = SESSION_ICONS[todaySession.type] || '🏃';
  const isRest = todaySession.type === 'rest';

  return (
    <motion.div variants={fadeUp} className="card p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="label">Today's Training</p>
        <span className="text-[10px] text-zinc-600">Week {data.current_week}/{data.total_weeks}</span>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-white">{todaySession.title}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{todaySession.description}</p>
          {todaySession.target_pace_per_km && !isRest && (
            <p className="text-[11px] text-accent mt-1 font-mono">
              Target: {formatPace(todaySession.target_pace_per_km)}/km • RPE {todaySession.rpe}/10
            </p>
          )}
        </div>
        {!isRest && (
          <button
            onClick={() => completeMutation.mutate({ week_number: data.current_week, day: today })}
            disabled={completeMutation.isPending}
            className="shrink-0 text-[11px] font-medium text-accent hover:text-accent-warm transition-colors px-3 py-1.5 rounded-lg border border-accent/20 hover:border-accent/40"
          >
            {completeMutation.isPending ? '...' : 'Done ✓'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
