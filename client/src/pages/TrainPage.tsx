import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const BIOMES = {
  base: { gradient: 'from-emerald-500/20 to-green-800/10', label: 'Base Building', icon: '🌿', color: 'text-emerald-400' },
  speed: { gradient: 'from-violet-500/20 to-blue-600/10', label: 'Speed Work', icon: '⚡', color: 'text-violet-400' },
  race: { gradient: 'from-amber-500/20 to-red-600/10', label: 'Race Prep', icon: '🏔️', color: 'text-amber-400' },
  recovery: { gradient: 'from-cyan-500/20 to-teal-600/10', label: 'Recovery', icon: '💧', color: 'text-cyan-400' },
};

type BiomeKey = keyof typeof BIOMES;

interface WorkoutNode {
  id: number;
  day: number;
  type: 'easy' | 'tempo' | 'interval' | 'long' | 'rest' | 'race';
  title: string;
  description: string;
  distance_km?: number;
  pace_zone?: string;
  completed: boolean;
  current: boolean;
  biome: BiomeKey;
}

const KENDU_COACHES: Record<string, { name: string; title: string; color: string }> = {
  'The Scientist': { name: 'The Scientist', title: 'The Scientist', color: 'text-blue-400' },
  'The Energizer': { name: 'The Energizer', title: 'The Energizer', color: 'text-pink-400' },
  'The Warrior': { name: 'The Warrior', title: 'The Warrior', color: 'text-red-400' },
  'The Sage': { name: 'The Sage', title: 'The Sage', color: 'text-emerald-400' },
};

function generateWindingPath(nodeCount: number): string {
  const rows = Math.ceil(nodeCount / 2);
  const height = rows * 80;
  let d = `M 50 20`;
  for (let i = 0; i < rows; i++) {
    const y = 20 + i * 80;
    const nextY = y + 80;
    if (i % 2 === 0) {
      d += ` C 50 ${y + 30}, 250 ${y + 30}, 250 ${nextY}`;
    } else {
      d += ` C 250 ${y + 30}, 50 ${y + 30}, 50 ${nextY}`;
    }
  }
  return d;
}

function buildNodesFromPlan(plan: any): WorkoutNode[] {
  const nodes: WorkoutNode[] = [];
  const weeks = plan.weeks || [];
  const planStart = new Date(plan.generated_at || plan.start_date || Date.now());
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - planStart.getTime()) / 86400000);

  let nodeIdx = 0;
  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const week = weeks[weekIdx];
    const sessions = week.sessions || week.workouts || [];
    const weekBiome: BiomeKey = week.phase === 'speed' || week.phase === 'build'
      ? 'speed' : week.phase === 'race' || week.phase === 'peak'
      ? 'race' : week.phase === 'recovery' || week.phase === 'taper'
      ? 'recovery' : 'base';

    for (const session of sessions) {
      const isCompleted = nodeIdx < daysSinceStart - 1;
      const isCurrent = nodeIdx === Math.max(0, daysSinceStart);
      const type: WorkoutNode['type'] = session.type === 'easy' || session.type === 'recovery' ? 'easy'
        : session.type === 'tempo' || session.type === 'threshold' ? 'tempo'
        : session.type === 'interval' || session.type === 'speed' || session.type === 'vo2max' ? 'interval'
        : session.type === 'long' || session.type === 'long_run' ? 'long'
        : session.type === 'rest' || session.type === 'off' ? 'rest'
        : session.type === 'race' ? 'race' : 'easy';

      nodes.push({
        id: nodeIdx,
        day: nodeIdx + 1,
        type,
        title: session.title || session.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Run`,
        description: session.description || session.notes || '',
        distance_km: session.distance_km || session.target_distance_km,
        pace_zone: session.pace_zone || session.zone || type.charAt(0).toUpperCase() + type.slice(1),
        completed: isCompleted,
        current: isCurrent,
        biome: weekBiome,
      });
      nodeIdx++;
    }
  }

  if (nodes.length === 0) return generateSamplePath(4);
  return nodes;
}

function generateSamplePath(daysPerWeek: number): WorkoutNode[] {
  const nodes: WorkoutNode[] = [];
  const biomeSequence: BiomeKey[] = ['base', 'base', 'speed', 'base', 'speed', 'race', 'recovery'];

  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < daysPerWeek; day++) {
      const idx = week * daysPerWeek + day;
      const biome = biomeSequence[week] || 'base';
      const types: WorkoutNode['type'][] = ['easy', 'tempo', 'interval', 'long', 'easy', 'rest'];
      const type = types[day % types.length];

      nodes.push({
        id: idx,
        day: idx + 1,
        type,
        title: type === 'easy' ? 'Easy Run' : type === 'tempo' ? 'Tempo Run' : type === 'interval' ? 'Intervals' : type === 'long' ? 'Long Run' : type === 'rest' ? 'Rest Day' : 'Race Pace',
        description: type === 'easy' ? 'Comfortable conversational pace' : type === 'tempo' ? 'Comfortably hard — push the threshold' : type === 'interval' ? 'Fast repeats with recovery' : type === 'long' ? 'Build endurance at easy pace' : type === 'rest' ? 'Recovery & adaptation' : 'Race simulation',
        distance_km: type === 'rest' ? undefined : type === 'long' ? 8 + week : type === 'interval' ? 5 : 5 + week * 0.5,
        pace_zone: type === 'easy' ? 'Easy' : type === 'tempo' ? 'Tempo' : type === 'interval' ? 'Interval' : 'Easy',
        completed: idx < 5,
        current: idx === 5,
        biome,
      });
    }
  }
  return nodes;
}

export function TrainPage() {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<WorkoutNode | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profiling-dna'],
    queryFn: () => api.get('/profiling/dna').then(r => r.data).catch(() => null),
  });

  const { data: adaptive } = useQuery({
    queryKey: ['adaptive-summary'],
    queryFn: () => api.get('/adaptive/summary').then(r => r.data).catch(() => null),
  });

  const { data: trainingPlan } = useQuery({
    queryKey: ['training-plan'],
    queryFn: () => api.get('/training/plan').then(r => r.data).catch(() => null),
  });

  const coachName = profile?.ai_coach_name || 'The Energizer';
  const coach = KENDU_COACHES[coachName] || KENDU_COACHES['The Energizer'];
  const trainingDays = profile?.training_days || 4;

  // Use real plan data if available, otherwise fall back to sample
  const nodes = trainingPlan?.weeks ? buildNodesFromPlan(trainingPlan) : generateSamplePath(trainingDays);
  const currentNodeIdx = nodes.findIndex(n => n.current);
  const completedCount = nodes.filter(n => n.completed).length;
  const currentBiome = nodes[currentNodeIdx]?.biome || 'base';

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Your Training Path</p>
            <h1 className="font-heading text-[20px] font-bold">Week {Math.floor(currentNodeIdx / trainingDays) + 1}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${BIOMES[currentBiome].gradient} border border-white/5`}>
              <span className="text-[10px] font-semibold text-zinc-300">
                {BIOMES[currentBiome].icon} {BIOMES[currentBiome].label}
              </span>
            </div>
          </div>
        </div>

        {/* Coach Message */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl bg-bg-secondary border border-bg-tertiary p-3 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[12px]">🧠</span>
          </div>
          <div>
            <p className={`text-[10px] font-bold ${coach.color}`}>{coach.name}</p>
            <p className="text-[12px] text-zinc-400 mt-0.5">
              {coachName === 'The Warrior' && "No days off. Today's tempo run builds mental steel. You kendu this."}
              {coachName === 'The Scientist' && "Your acute load is 85 TSS. Today's tempo targets lactate threshold at 4:38/km. Optimal adaptation zone."}
              {coachName === 'The Energizer' && "Hey! Today's a tempo day — you're gonna feel amazing after this one. Let's go! 🔥"}
              {coachName === 'The Sage' && "Patience builds champions. Today's tempo is about controlled effort — 80% feel, 100% consistency."}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-zinc-600">Progress</span>
          <span className="text-[10px] font-mono text-zinc-500">{completedCount}/{nodes.length} workouts</span>
        </div>
        <div className="h-[4px] rounded-full bg-bg-tertiary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / nodes.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>
      </div>

      {/* THE PATH — Animated SVG Winding Road */}
      <div className="px-3">
        <div className="relative">
          {/* SVG Winding Path Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(0, 200, 200)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(0, 200, 200)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <motion.path
              d={generateWindingPath(nodes.length)}
              stroke="url(#pathGrad)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </svg>

          {/* Nodes on the winding path */}
          <div className="relative grid grid-cols-2 gap-3 py-2">
            {nodes.map((node, idx) => {
              const biome = BIOMES[node.biome];
              const isCompleted = node.completed;
              const isCurrent = node.current;
              const isFuture = !isCompleted && !isCurrent;
              const isLeft = idx % 2 === 0;

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isFuture ? 0.5 : 1, scale: 1 }}
                  transition={{ delay: idx * 0.04, type: 'spring', stiffness: 200 }}
                  onClick={() => setSelectedNode(node)}
                  className={`relative cursor-pointer active:scale-95 transition-transform ${isLeft ? '' : 'mt-6'}`}
                >
                  <div className={`rounded-xl p-3 border transition-all ${
                    isCurrent ? `bg-gradient-to-br ${biome.gradient} border-accent/30 shadow-lg shadow-accent/10` :
                    isCompleted ? 'bg-bg-secondary/80 border-accent-green/20' :
                    'bg-bg-secondary border-bg-tertiary'
                  }`}>
                    {/* Node indicator */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] border ${
                        isCurrent ? 'bg-accent/20 border-accent' :
                        isCompleted ? 'bg-accent-green/20 border-accent-green/40' :
                        'bg-bg-tertiary border-bg-tertiary'
                      }`}>
                        {isCompleted ? '✓' : isCurrent ? (
                          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>🏃</motion.span>
                        ) : (
                          <span className="font-mono text-zinc-600">{node.day}</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-semibold ${biome.color}`}>{biome.icon}</span>
                    </div>

                    {/* Content */}
                    <p className={`text-[11px] font-semibold leading-tight ${isCurrent ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {node.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {node.distance_km && (
                        <span className={`text-[10px] font-mono ${isCurrent ? 'text-accent' : 'text-zinc-600'}`}>{node.distance_km}km</span>
                      )}
                      {node.pace_zone && (
                        <span className="text-[8px] text-zinc-700 uppercase">{node.pace_zone}</span>
                      )}
                    </div>
                  </div>

                  {/* Milestone glow for completed */}
                  {isCompleted && isCurrent === false && idx > 0 && idx % 7 === 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.5, 0] }}
                      transition={{ delay: idx * 0.04 + 0.5, duration: 0.8 }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-gold/40"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* What If Projection */}
      <div className="px-5 mt-6">
        <div className="rounded-xl bg-gradient-to-br from-accent/8 via-bg-secondary to-bg-secondary border border-accent/15 p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent">What If You Stay Consistent</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center px-2 py-3 rounded-lg bg-bg-primary/50 border border-bg-tertiary">
              <p className="text-[9px] text-zinc-600 mb-1">4 weeks</p>
              <p className="font-mono font-bold text-[14px] text-white">-30s</p>
              <p className="text-[8px] text-zinc-600">5K time</p>
            </div>
            <div className="text-center px-2 py-3 rounded-lg bg-bg-primary/50 border border-bg-tertiary">
              <p className="text-[9px] text-zinc-600 mb-1">8 weeks</p>
              <p className="font-mono font-bold text-[14px] text-accent">+2</p>
              <p className="text-[8px] text-zinc-600">VO2max</p>
            </div>
            <div className="text-center px-2 py-3 rounded-lg bg-bg-primary/50 border border-bg-tertiary">
              <p className="text-[9px] text-zinc-600 mb-1">12 weeks</p>
              <p className="font-mono font-bold text-[14px] text-accent-gold">↑ Tier</p>
              <p className="text-[8px] text-zinc-600">promotion</p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 text-center">Based on your current {trainingDays}x/week at {profile?.running_experience || 'your'} level</p>
        </div>
      </div>

      {/* Workout Detail Modal */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setSelectedNode(null)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-bg-primary rounded-t-2xl border-t border-bg-tertiary p-5 pb-10"
            >
              <div className="w-10 h-1 rounded-full bg-bg-tertiary mx-auto mb-5" />
              <div className="space-y-4">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${BIOMES[selectedNode.biome].color} mb-1`}>
                    {BIOMES[selectedNode.biome].icon} {BIOMES[selectedNode.biome].label}
                  </p>
                  <h2 className="font-heading text-[20px] font-bold">{selectedNode.title}</h2>
                  <p className="text-[13px] text-zinc-400 mt-1">{selectedNode.description}</p>
                </div>

                {selectedNode.distance_km && (
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-xl bg-bg-secondary border border-bg-tertiary p-3 text-center">
                      <p className="text-[9px] text-zinc-600 uppercase">Distance</p>
                      <p className="font-mono font-bold text-[18px] text-white">{selectedNode.distance_km}<span className="text-[10px] text-zinc-600">km</span></p>
                    </div>
                    {selectedNode.pace_zone && (
                      <div className="flex-1 rounded-xl bg-bg-secondary border border-bg-tertiary p-3 text-center">
                        <p className="text-[9px] text-zinc-600 uppercase">Zone</p>
                        <p className="font-mono font-bold text-[18px] text-accent">{selectedNode.pace_zone}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Science Explainer */}
                <div className="rounded-xl bg-accent/5 border border-accent/10 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-accent">🔬 The Science</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {selectedNode.type === 'easy' && 'Easy runs build mitochondria and strengthen connective tissue. At this effort, your body burns fat efficiently. 80% of elite training is here — Kipchoge runs easy 4 days/week.'}
                    {selectedNode.type === 'tempo' && 'Tempo sits at your lactate threshold (~85-90% max HR). Training here pushes that threshold higher — directly improving race pace. Effect: +2-5s/km improvement after 4 weeks.'}
                    {selectedNode.type === 'interval' && 'Intervals at 95-100% VO2max boost your oxygen ceiling. Recovery between reps lets you accumulate more time at max effort. Norwegian method: 4x4min at 90-95% HR.'}
                    {selectedNode.type === 'long' && 'Long runs trigger fat oxidation, increase glycogen storage, build mental toughness. Your body learns to preserve carbs for when you need them. Always conversational pace.'}
                    {selectedNode.type === 'rest' && "Supercompensation: you get stronger during REST, not during training. Muscle fibers rebuild 10-15% stronger post-stress. Sleep drives 95% of recovery (7-9hrs). Active recovery > total rest."}
                    {selectedNode.type === 'race' && 'Race simulation teaches your neuromuscular system exact race demands. Pacing, fueling, mental rehearsal. Run at goal pace — not faster. Your body memorizes this effort.'}
                  </p>
                </div>

                {/* Coach's Take */}
                <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-3">
                  <p className={`text-[10px] font-bold ${coach.color}`}>{coach.name}:</p>
                  <p className="text-[11px] text-zinc-400 italic mt-0.5">
                    {coachName === 'The Scientist' && '"Track your HR drift. If it creeps above threshold, pull back. Data doesn\'t lie."'}
                    {coachName === 'The Energizer' && '"Don\'t overthink it! Shoes on, go. You\'ll feel amazing after 🔥"'}
                    {coachName === 'The Warrior' && '"Nobody cares about your excuses. Show up. Suffer. Grow."'}
                    {coachName === 'The Sage' && '"This single run means nothing alone — but accumulated over weeks, it builds champions."'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-[14px] active:scale-[0.98] transition-all"
                >
                  {selectedNode.completed ? 'Completed ✓' : selectedNode.current ? 'Start This Workout' : 'Got It'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
