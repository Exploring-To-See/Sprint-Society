import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../lib/api';

export function CoachCard() {
  const navigate = useNavigate();

  const { data: week } = useQuery({
    queryKey: ['training-week'],
    queryFn: () => api.get('/training/week').then(r => r.data).catch(() => null),
  });

  const { data: plan } = useQuery({
    queryKey: ['training-plan'],
    queryFn: () => api.get('/training/plan').then(r => r.data).catch(() => null),
  });

  const { data: dna } = useQuery({
    queryKey: ['profiling-dna'],
    queryFn: () => api.get('/profiling/dna').then(r => r.data).catch(() => null),
  });

  const coachStyle = dna?.coach_style || 'Warrior';
  const coachIcon = coachStyle === 'Warrior' ? '⚔️' : coachStyle === 'Analyst' ? '🔬' : coachStyle === 'Zen' ? '🧘' : '⚔️';

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const sessions = week?.sessions || [];
  const todaySession = sessions[todayIndex];

  const currentDay = plan?.current_day || 0;
  const totalDays = plan?.total_days || (plan?.total_weeks ? plan.total_weeks * 7 : 56);

  const hasGoal = !!plan && (plan.race_name || plan.goal_name);

  if (!hasGoal) {
    return (
      <motion.button
        onClick={() => navigate('/coach')}
        className="w-full rounded-2xl bg-gradient-to-br from-accent/[0.06] to-red-500/[0.03] border border-accent/20 p-4 text-left active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/12 flex items-center justify-center text-[18px]">{coachIcon}</div>
          <div>
            <p className="text-[12px] font-bold text-white">The {coachStyle}</p>
            <p className="text-[10px] text-zinc-500">Your AI Coach</p>
          </div>
        </div>
        <p className="text-[14px] font-bold text-white mb-1">Set your running goal</p>
        <p className="text-[11px] text-zinc-400 leading-relaxed">What are you training for? Tell me and I'll build a plan around your life.</p>
        <span className="inline-block mt-3 px-4 py-2 rounded-lg bg-accent text-white text-[11px] font-bold">Set Goal →</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={() => navigate('/coach')}
      className="w-full rounded-2xl bg-gradient-to-br from-accent/[0.06] to-red-500/[0.03] border border-accent/20 p-4 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-9 h-9 rounded-xl bg-red-500/12 flex items-center justify-center text-[18px]">{coachIcon}</div>
        <div className="flex-1">
          <p className="text-[12px] font-bold text-white">The {coachStyle}</p>
          <p className="text-[10px] text-zinc-500">
            {todaySession ? `Today: ${todaySession.name || todaySession.type}` : 'Rest day'}
          </p>
        </div>
        <span className="text-[9px] text-zinc-600">Day {currentDay}/{totalDays}</span>
      </div>

      {todaySession && todaySession.type !== 'rest' && (
        <p className="text-[12px] text-zinc-300 mb-1">
          {todaySession.target_pace || todaySession.description || `${todaySession.distance_km || ''}km ${todaySession.type}`}
        </p>
      )}

      <p className="text-[10px] text-accent/80 italic">
        {coachStyle === 'Warrior' ? '"Recovery is strategy. Trust the process."' :
         coachStyle === 'Analyst' ? '"Data shows you\'re on track. Stay disciplined."' :
         coachStyle === 'Zen' ? '"Listen to your body. It knows the way."' :
         '"Push through. Champions are built in the grind."'}
      </p>

      {todaySession && todaySession.type !== 'rest' && (
        <span
          onClick={(e) => { e.stopPropagation(); navigate('/run/track'); }}
          className="inline-block mt-3 px-4 py-2 rounded-lg bg-accent text-white text-[11px] font-bold"
        >
          Start Run →
        </span>
      )}
    </motion.button>
  );
}
