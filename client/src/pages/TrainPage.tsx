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
  'Kendu_Ishu': { name: 'Kendu_Ishu', title: 'The Scientist', color: 'text-blue-400' },
  'Kendu_Nainu': { name: 'Kendu_Nainu', title: 'The Energizer', color: 'text-pink-400' },
  'Kendu_Goggins': { name: 'Kendu_Goggins', title: 'The Warrior', color: 'text-red-400' },
  'Kendu_Kip': { name: 'Kendu_Kip', title: 'The Sage', color: 'text-emerald-400' },
};

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

  const coachName = profile?.ai_coach_name || 'Kendu_Nainu';
  const coach = KENDU_COACHES[coachName] || KENDU_COACHES['Kendu_Nainu'];
  const trainingDays = profile?.training_days || 4;
  const nodes = generateSamplePath(trainingDays);
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
              {coachName === 'Kendu_Goggins' && "No days off. Today's tempo run builds mental steel. You kendu this."}
              {coachName === 'Kendu_Ishu' && "Your acute load is 85 TSS. Today's tempo targets lactate threshold at 4:38/km. Optimal adaptation zone."}
              {coachName === 'Kendu_Nainu' && "Hey! Today's a tempo day — you're gonna feel amazing after this one. Let's go! 🔥"}
              {coachName === 'Kendu_Kip' && "Patience builds champions. Today's tempo is about controlled effort — 80% feel, 100% consistency."}
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

      {/* THE PATH — Gamified Visual */}
      <div className="px-5">
        <div className="relative">
          {/* Path connector line */}
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent/30 via-accent/10 to-bg-tertiary" />

          {/* Nodes */}
          <div className="space-y-3">
            {nodes.map((node, idx) => {
              const biome = BIOMES[node.biome];
              const isCompleted = node.completed;
              const isCurrent = node.current;
              const isFuture = !isCompleted && !isCurrent;

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedNode(node)}
                  className={`relative flex items-center gap-4 cursor-pointer group ${isFuture ? 'opacity-50' : ''}`}
                >
                  {/* Node Circle */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCurrent ? 'bg-accent/20 border-accent scale-110 shadow-lg shadow-accent/20' :
                    isCompleted ? 'bg-accent-green/20 border-accent-green/50' :
                    'bg-bg-secondary border-bg-tertiary group-hover:border-zinc-600'
                  }`}>
                    {isCompleted ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#10b981" strokeWidth="2">
                        <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : isCurrent ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-[14px]"
                      >
                        🏃
                      </motion.div>
                    ) : (
                      <span className="text-[11px] font-mono text-zinc-600">{node.day}</span>
                    )}
                  </div>

                  {/* Node Content */}
                  <div className={`flex-1 rounded-xl p-3 border transition-all ${
                    isCurrent ? `bg-gradient-to-r ${biome.gradient} border-accent/20` :
                    isCompleted ? 'bg-bg-secondary/50 border-bg-tertiary/50' :
                    'bg-bg-secondary border-bg-tertiary group-hover:border-zinc-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[12px] font-semibold ${isCurrent ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {node.title}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{node.description}</p>
                      </div>
                      <div className="text-right">
                        {node.distance_km && (
                          <p className={`text-[12px] font-mono font-semibold ${isCurrent ? 'text-accent' : 'text-zinc-500'}`}>
                            {node.distance_km}km
                          </p>
                        )}
                        {node.pace_zone && (
                          <p className="text-[9px] text-zinc-600">{node.pace_zone} zone</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* What If Projection */}
      <div className="px-5 mt-6">
        <div className="rounded-xl bg-gradient-to-r from-accent/5 to-transparent border border-accent/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">If you stay consistent...</p>
          <p className="text-[13px] text-zinc-300">
            In 4 weeks: estimated 5K time drops by ~30s. In 8 weeks: you'll move from {profile?.tier || 'beginner'} towards the next tier.
          </p>
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

                {/* Why this workout */}
                <div className="rounded-xl bg-accent/5 border border-accent/10 p-3">
                  <p className="text-[10px] font-bold text-accent mb-1">Why this workout?</p>
                  <p className="text-[11px] text-zinc-400">
                    {selectedNode.type === 'easy' && 'Easy runs build your aerobic base — the engine behind every fast race. 80% of training should be here.'}
                    {selectedNode.type === 'tempo' && 'Tempo runs push your lactate threshold higher. This is where your race pace improves most directly.'}
                    {selectedNode.type === 'interval' && 'Intervals boost VO2max and running economy. Short bursts + recovery = speed gains.'}
                    {selectedNode.type === 'long' && 'Long runs build endurance, fat oxidation, and mental toughness. The foundation for any distance.'}
                    {selectedNode.type === 'rest' && 'Adaptation happens during rest. Your muscles rebuild stronger. Skip rest → skip gains.'}
                    {selectedNode.type === 'race' && 'Race pace simulation trains your body and mind for the specific demands of race day.'}
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
