import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function CoachingPanel() {
  const { user } = useAuth();

  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data),
  });

  const { data: pace } = useQuery({
    queryKey: ['ideal-pace'],
    queryFn: () => api.get('/coaching/ideal-pace').then(r => r.data),
  });

  const { data: transformation } = useQuery({
    queryKey: ['transformation'],
    queryFn: () => api.get('/coaching/transformation').then(r => r.data),
  });

  const formatPace = (seconds: number) => {
    if (!seconds) return '--:--';
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const milestones = transformation?.milestones || [];
  const currentWeek = Math.ceil((Date.now() - new Date(transformation?.generated_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Your journey</p>
        <h1 className="font-heading text-xl font-bold mt-0.5">Transformation</h1>
      </motion.div>

      {/* Current → Target */}
      {transformation && (
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 py-3">
          <div className="text-center">
            <p className="font-mono text-xl font-bold">{formatPace(transformation.current_pace_per_km)}</p>
            <p className="text-[10px] text-zinc-500">now</p>
          </div>
          <div className="w-10 h-0.5 rounded bg-gradient-to-r from-zinc-600 to-accent-gold" />
          <div className="text-center">
            <p className="font-mono text-xl font-bold text-accent-gold">{formatPace(transformation.target_pace_per_km)}</p>
            <p className="text-[10px] text-zinc-500">target</p>
          </div>
        </motion.div>
      )}

      {/* Journey Path */}
      {milestones.length > 0 && (
        <motion.div variants={fadeUp} className="relative pl-10">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-green via-accent to-bg-tertiary" />

          {milestones.map((milestone: any, i: number) => {
            const isCompleted = milestone.week < currentWeek;
            const isCurrent = milestone.week === currentWeek || (i === 0 && currentWeek <= milestone.week);
            const isCurrentNode = !isCompleted && (isCurrent || (i > 0 && milestones[i - 1]?.week < currentWeek && milestone.week >= currentWeek));

            return (
              <div key={i} className="relative mb-7 last:mb-0">
                {/* Node */}
                <div className="absolute -left-[22px] top-1">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-accent-green flex items-center justify-center text-[10px]">✓</div>
                  ) : isCurrentNode ? (
                    <div className="w-7 h-7 -ml-1 rounded-full border-2 border-accent overflow-hidden bg-bg-tertiary">
                      {(user as any)?.profile_image_url ? (
                        <img src={(user as any).profile_image_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-accent">
                          {user?.name?.[0]}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-bg-tertiary flex items-center justify-center text-[9px] text-zinc-600">
                      {milestone.week}
                    </div>
                  )}
                </div>

                {/* Content */}
                {isCurrentNode ? (
                  <div className="card border-accent p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-semibold text-accent">{milestone.focus_area}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">NOW</span>
                    </div>
                    <p className="text-[12px] text-zinc-400 mb-2">Target: {formatPace(milestone.target_pace)}/km</p>
                    {milestone.tips && (
                      <div className="space-y-1">
                        {milestone.tips.slice(0, 3).map((tip: string, j: number) => (
                          <p key={j} className="text-[11px] text-zinc-500">• {tip}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={isCompleted ? 'opacity-40' : ''}>
                    <p className={`text-[13px] ${isCompleted ? 'text-zinc-500' : 'text-zinc-300'}`}>
                      {milestone.focus_area}
                    </p>
                    <p className="text-[11px] text-zinc-600">
                      Week {milestone.week} • {formatPace(milestone.target_pace)}/km
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Finish node */}
          <div className="relative">
            <div className="absolute -left-[22px] top-1">
              <div className="w-5 h-5 rounded-full bg-accent-gold flex items-center justify-center text-[10px]">🏆</div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-accent-gold">Goal: {formatPace(transformation?.target_pace_per_km)}/km</p>
              <p className="text-[11px] text-zinc-600">
                Week {transformation?.estimated_weeks} • {transformation?.target_tier} tier
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* VO2max */}
      {tier?.estimated_vo2max && (
        <motion.div variants={fadeUp} className="card text-center py-5">
          <p className="label mb-1">Estimated VO2max</p>
          <p className="font-mono text-4xl font-bold text-accent-gold">{tier.estimated_vo2max.toFixed(1)}</p>
          <p className="text-[12px] text-zinc-500 mt-1">{tier.vo2max_category} — {tier.vo2max_percentile}</p>
        </motion.div>
      )}

      {/* Pace Zones */}
      {pace?.zones && (
        <motion.div variants={fadeUp}>
          <h3 className="font-heading font-semibold text-[15px] mb-3">Pace zones</h3>
          <div className="card p-4 space-y-3">
            {[
              { label: 'Easy', value: pace.zones.easy },
              { label: 'Tempo', value: pace.zones.tempo, highlight: true },
              { label: 'Interval', value: pace.zones.interval },
              { label: 'Race', value: pace.zones.race },
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
    </motion.div>
  );
}
