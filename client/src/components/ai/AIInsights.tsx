import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// 1. PatternInsights — Surfaces running patterns from recent data
// ─────────────────────────────────────────────────────────────────────────────

interface Run {
  start_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  elapsed_time_seconds?: number;
  average_heartrate?: number;
  [key: string]: any;
}

interface Insight {
  id: string;
  icon: string;
  text: string;
  highlight: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getPaceMinKm(run: Run): number {
  if (!run.distance_meters || !run.moving_time_seconds) return 0;
  return (run.moving_time_seconds / 60) / (run.distance_meters / 1000);
}

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function computeInsights(runs: Run[]): Insight[] {
  if (!runs || runs.length < 3) return [];

  const insights: Insight[] = [];

  // Best day of week
  const dayPaces: Record<number, number[]> = {};
  runs.forEach(r => {
    const day = new Date(r.start_date).getDay();
    const pace = getPaceMinKm(r);
    if (pace > 0) {
      if (!dayPaces[day]) dayPaces[day] = [];
      dayPaces[day].push(pace);
    }
  });

  const dayAvgs = Object.entries(dayPaces)
    .filter(([, paces]) => paces.length >= 2)
    .map(([day, paces]) => ({
      day: Number(day),
      avg: paces.reduce((a, b) => a + b, 0) / paces.length,
    }));

  if (dayAvgs.length >= 2) {
    dayAvgs.sort((a, b) => a.avg - b.avg);
    const best = dayAvgs[0];
    const worst = dayAvgs[dayAvgs.length - 1];
    const diff = Math.round(((worst.avg - best.avg) / worst.avg) * 100);
    if (diff > 5) {
      insights.push({
        id: 'best-day',
        icon: '⚡',
        text: `You run ${diff}% faster on ${DAYS[best.day]}s. Coincidence?`,
        highlight: `${diff}% faster`,
      });
    }
  }

  // Best time of day
  const timePaces: Record<string, number[]> = { morning: [], afternoon: [], evening: [] };
  runs.forEach(r => {
    const hour = new Date(r.start_date).getHours();
    const pace = getPaceMinKm(r);
    if (pace > 0) timePaces[getTimeOfDay(hour)].push(pace);
  });

  const timeAvgs = Object.entries(timePaces)
    .filter(([, paces]) => paces.length >= 2)
    .map(([time, paces]) => ({
      time,
      avg: paces.reduce((a, b) => a + b, 0) / paces.length,
    }));

  if (timeAvgs.length >= 2) {
    timeAvgs.sort((a, b) => a.avg - b.avg);
    const best = timeAvgs[0];
    insights.push({
      id: 'best-time',
      icon: '🌅',
      text: `Your fastest runs happen in the ${best.time}. Your body knows.`,
      highlight: best.time,
    });
  }

  // Streak detection
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const runsThisWeek = runs.filter(r => new Date(r.start_date) >= thisWeekStart).length;
  if (runsThisWeek >= 3) {
    insights.push({
      id: 'streak',
      icon: '🔥',
      text: `${runsThisWeek} runs this week — you're building momentum.`,
      highlight: `${runsThisWeek} runs`,
    });
  }

  // Improvement detection (compare last 4 weeks avg pace vs prior 4 weeks)
  const fourWeeksAgo = new Date(now.getTime() - 28 * 86400000);
  const eightWeeksAgo = new Date(now.getTime() - 56 * 86400000);

  const recentPaces = runs
    .filter(r => new Date(r.start_date) >= fourWeeksAgo)
    .map(getPaceMinKm)
    .filter(p => p > 0);

  const olderPaces = runs
    .filter(r => {
      const d = new Date(r.start_date);
      return d >= eightWeeksAgo && d < fourWeeksAgo;
    })
    .map(getPaceMinKm)
    .filter(p => p > 0);

  if (recentPaces.length >= 3 && olderPaces.length >= 3) {
    const recentAvg = recentPaces.reduce((a, b) => a + b, 0) / recentPaces.length;
    const olderAvg = olderPaces.reduce((a, b) => a + b, 0) / olderPaces.length;
    const improvement = Math.round(((olderAvg - recentAvg) / olderAvg) * 100);

    if (improvement > 2) {
      insights.push({
        id: 'improvement',
        icon: '📈',
        text: `Avg pace improved ${improvement}% over last 4 weeks. The work is paying off.`,
        highlight: `${improvement}%`,
      });
    }
  }

  // Consistency pattern
  const dayCounts = Object.entries(dayPaces)
    .map(([day, paces]) => ({ day: Number(day), count: paces.length }))
    .sort((a, b) => b.count - a.count);

  const topDays = dayCounts.filter(d => d.count >= 2).slice(0, 3);
  if (topDays.length >= 2) {
    const dayNames = topDays.map(d => DAY_SHORT[d.day]).join('/');
    insights.push({
      id: 'consistency',
      icon: '📅',
      text: `You run most on ${dayNames}. Consistency is your superpower.`,
      highlight: dayNames,
    });
  }

  return insights;
}

export function PatternInsights({ runs }: { runs: Run[] }) {
  const insights = useMemo(() => computeInsights(runs), [runs]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % insights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [insights.length]);

  if (insights.length === 0) return null;

  const current = insights[activeIndex];

  return (
    <div className="card p-4 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center">
          <svg className="w-3 h-3 text-accent" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l2 4.5L15 6l-3.5 3.5L12.5 15 8 12.5 3.5 15l1-5.5L1 6l5-0.5L8 1z" />
          </svg>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
          AI Insight
        </span>
        {insights.length > 1 && (
          <div className="flex gap-1 ml-auto">
            {insights.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${
                  i === activeIndex ? 'bg-accent' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="min-h-[36px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex items-start gap-2"
          >
            <span className="text-base shrink-0">{current.icon}</span>
            <p className="text-[13px] text-zinc-300 leading-relaxed">
              {current.text.split(current.highlight).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="font-semibold text-accent">{current.highlight}</span>
                  )}
                </span>
              ))}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RacePredictor — Predicts race times from VO2max using Daniels VDOT
// ─────────────────────────────────────────────────────────────────────────────

interface RacePrediction {
  distance: string;
  distanceKm: number;
  time: string;
  confidence: number;
}

// Simplified Daniels VDOT formula:
// VO2 = -4.60 + 0.182258 * velocity + 0.000104 * velocity^2
// %VO2max = 0.8 + 0.1894393 * e^(-0.012778 * t) + 0.2989558 * e^(-0.1932605 * t)
// where velocity = meters/min, t = time in minutes
// We invert this to predict time from VDOT for each distance.
function predictTimeFromVDOT(vdot: number, distanceMeters: number): number {
  // Binary search for time that produces given VDOT at this distance
  let low = distanceMeters / 450; // fastest possible ~450m/min
  let high = distanceMeters / 100; // slowest ~100m/min

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const velocity = distanceMeters / mid; // m/min
    const percentVO2 = 0.8 + 0.1894393 * Math.exp(-0.012778 * mid) + 0.2989558 * Math.exp(-0.1932605 * mid);
    const vo2AtVelocity = -4.60 + 0.182258 * velocity + 0.000104 * velocity * velocity;
    const calculatedVDOT = vo2AtVelocity / percentVO2;

    if (calculatedVDOT > vdot) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2; // time in minutes
}

function formatRaceTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.round((minutes % 1) * 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function calculatePredictions(vo2max: number): RacePrediction[] {
  const distances = [
    { label: '5K', meters: 5000 },
    { label: '10K', meters: 10000 },
    { label: 'Half', meters: 21097 },
    { label: 'Marathon', meters: 42195 },
  ];

  return distances.map(d => {
    const timeMinutes = predictTimeFromVDOT(vo2max, d.meters);
    // Confidence decreases with distance (more variables affect longer races)
    const confidence = d.meters <= 5000 ? 0.92 : d.meters <= 10000 ? 0.87 : d.meters <= 21097 ? 0.78 : 0.70;
    return {
      distance: d.label,
      distanceKm: d.meters / 1000,
      time: formatRaceTime(timeMinutes),
      confidence,
    };
  });
}

export function RacePredictor({ vo2max, recentPace }: { vo2max: number; recentPace?: number }) {
  const predictions = useMemo(() => calculatePredictions(vo2max), [vo2max]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-semibold text-white">Race Day Predictions</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Based on your VO2max ({vo2max})</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <span className="text-xs">🏁</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {predictions.map((pred, i) => (
          <motion.div
            key={pred.distance}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
            className="flex-shrink-0 w-[100px] rounded-xl border border-bg-tertiary bg-bg-secondary/50 p-3 text-center"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 mb-1.5">
              {pred.distance}
            </p>
            <p className="font-mono text-[15px] font-bold text-white tabular-nums">
              {pred.time}
            </p>
            <div className="mt-2 flex items-center justify-center gap-1">
              <div className="h-1 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${pred.confidence * 100}%` }}
                  transition={{ delay: i * 0.08 + 0.3, duration: 0.5 }}
                />
              </div>
              <span className="text-[11px] text-zinc-600 font-mono">
                {Math.round(pred.confidence * 100)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {recentPace && (
        <p className="text-[10px] text-zinc-600 mt-3 text-center">
          Recent avg pace: <span className="font-mono text-zinc-400">{Math.floor(recentPace / 60)}:{(Math.round(recentPace % 60)).toString().padStart(2, '0')}</span>/km
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. InjuryRiskBanner — Training load spike warning
// ─────────────────────────────────────────────────────────────────────────────

type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

interface InjuryRiskBannerProps {
  risk: RiskLevel;
  acuteLoad: number;
  chronicLoad: number;
}

const RISK_BANNERS: Record<Exclude<RiskLevel, 'low'>, {
  bg: string;
  border: string;
  icon: string;
  iconBg: string;
  message: string;
  textColor: string;
}> = {
  moderate: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    icon: '⚠️',
    iconBg: 'bg-amber-500/10',
    message: 'Training load is building. Consider an easy day soon.',
    textColor: 'text-amber-300',
  },
  high: {
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/25',
    icon: '⚡',
    iconBg: 'bg-orange-500/10',
    message: 'Load spike detected. Your injury risk is elevated.',
    textColor: 'text-orange-300',
  },
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: '🛑',
    iconBg: 'bg-red-500/15',
    message: 'Take a rest day. Your acute:chronic ratio is dangerous.',
    textColor: 'text-red-300',
  },
};

export function InjuryRiskBanner({ risk, acuteLoad, chronicLoad }: InjuryRiskBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (risk === 'low') return null;

  const config = RISK_BANNERS[risk];
  const ratio = chronicLoad > 0 ? (acuteLoad / chronicLoad).toFixed(2) : '—';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`rounded-xl border ${config.border} ${config.bg} overflow-hidden`}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
          <span className="text-sm">{config.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-medium ${config.textColor} leading-relaxed`}>
            {config.message}
          </p>
          {risk === 'critical' && (
            <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-wider mt-1">
              A:C Ratio {ratio} — OVERREACHING
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 pt-0.5"
          aria-label={expanded ? 'Collapse details' : 'Learn more'}
        >
          {expanded ? 'Less' : 'Learn more'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3.5 pb-3.5"
          >
            <div className="border-t border-zinc-800/50 pt-3 space-y-2">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                The <span className="text-white font-medium">acute:chronic workload ratio</span> compares your
                recent training (7-day) to your long-term average (28-day). A ratio above 1.5 significantly
                increases injury risk.
              </p>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-[11px] text-zinc-600 uppercase tracking-wider">7-day load</p>
                  <p className="font-mono text-[12px] font-semibold text-white">{acuteLoad}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-600 uppercase tracking-wider">28-day avg</p>
                  <p className="font-mono text-[12px] font-semibold text-white">{chronicLoad}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Ratio</p>
                  <p className={`font-mono text-[12px] font-bold ${config.textColor}`}>{ratio}</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Ideal range: 0.8–1.3 • Danger zone: &gt;1.5
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PostEventInsights — Analysis after completing a run event
// ─────────────────────────────────────────────────────────────────────────────

interface EventRun {
  distance_meters: number;
  moving_time_seconds: number;
  splits?: { split: number; average_speed: number; elapsed_time: number }[];
  average_heartrate?: number;
  position?: number;
  total_participants?: number;
}

interface EventInsight {
  icon: string;
  text: string;
  type: 'celebrate' | 'coach' | 'neutral';
}

function generateEventInsights(eventRun: EventRun): EventInsight[] {
  const insights: EventInsight[] = [];
  const { distance_meters, moving_time_seconds, splits, average_heartrate, position, total_participants } = eventRun;

  // Pacing analysis from splits
  if (splits && splits.length >= 2) {
    const firstHalf = splits.slice(0, Math.floor(splits.length / 2));
    const secondHalf = splits.slice(Math.floor(splits.length / 2));

    const avgFirst = firstHalf.reduce((a, s) => a + s.elapsed_time, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, s) => a + s.elapsed_time, 0) / secondHalf.length;
    const diffSeconds = avgFirst - avgSecond;

    if (diffSeconds > 5) {
      // Negative split (second half faster)
      insights.push({
        icon: '🎯',
        text: `Negative split by ${Math.round(diffSeconds)}s/km — textbook execution`,
        type: 'celebrate',
      });
    } else if (diffSeconds < -10) {
      // Positive split (first half faster)
      insights.push({
        icon: '📊',
        text: `Positive split — you went out ${Math.abs(Math.round(diffSeconds))}s/km too fast. Bank energy early next time.`,
        type: 'coach',
      });
    } else {
      insights.push({
        icon: '⚖️',
        text: 'Even splits — excellent pace discipline throughout.',
        type: 'celebrate',
      });
    }
  }

  // Heart rate effort
  if (average_heartrate) {
    // Rough effort estimation (assuming max HR ~195)
    const estimatedMaxHR = 195;
    const effortPercent = Math.round((average_heartrate / estimatedMaxHR) * 100);

    if (effortPercent >= 90) {
      insights.push({
        icon: '💪',
        text: `Average HR ${average_heartrate} — you gave it ${effortPercent}% effort. All-out.`,
        type: 'celebrate',
      });
    } else if (effortPercent >= 80) {
      insights.push({
        icon: '❤️',
        text: `Average HR ${average_heartrate} — solid ${effortPercent}% effort. Room to push harder in the final km.`,
        type: 'neutral',
      });
    } else {
      insights.push({
        icon: '🧘',
        text: `Average HR ${average_heartrate} — controlled ${effortPercent}% effort. Great for aerobic building.`,
        type: 'neutral',
      });
    }
  }

  // Ranking
  if (position && total_participants && total_participants > 1) {
    const percentile = Math.round((1 - (position - 1) / total_participants) * 100);
    if (percentile >= 75) {
      insights.push({
        icon: '🏆',
        text: `You placed ${position}${getOrdinal(position)} of ${total_participants} — top ${100 - percentile}%!`,
        type: 'celebrate',
      });
    } else if (percentile >= 50) {
      insights.push({
        icon: '👟',
        text: `You placed ${position}${getOrdinal(position)} of ${total_participants} — upper half. Keep climbing.`,
        type: 'neutral',
      });
    } else {
      insights.push({
        icon: '🎬',
        text: `Finished ${position}${getOrdinal(position)} of ${total_participants}. Every race is a stepping stone.`,
        type: 'coach',
      });
    }
  }

  // Overall pace summary
  if (distance_meters && moving_time_seconds) {
    const paceMinKm = (moving_time_seconds / 60) / (distance_meters / 1000);
    const paceMin = Math.floor(paceMinKm);
    const paceSec = Math.round((paceMinKm - paceMin) * 60);
    const distanceKm = (distance_meters / 1000).toFixed(1);

    insights.push({
      icon: '⏱️',
      text: `${distanceKm}km at ${paceMin}:${paceSec.toString().padStart(2, '0')}/km — logged and locked.`,
      type: 'neutral',
    });
  }

  return insights;
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const INSIGHT_TYPE_STYLES = {
  celebrate: 'text-accent-green',
  coach: 'text-amber-300',
  neutral: 'text-zinc-300',
};

export function PostEventInsights({ eventRun }: { eventRun: EventRun }) {
  const insights = useMemo(() => generateEventInsights(eventRun), [eventRun]);

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
          <span className="text-xs">🧠</span>
        </div>
        <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-400">
          Post-Run Analysis
        </h3>
      </div>

      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-start gap-2.5"
          >
            <span className="text-sm shrink-0 mt-0.5">{insight.icon}</span>
            <p className={`text-[12px] leading-relaxed ${INSIGHT_TYPE_STYLES[insight.type]}`}>
              {insight.text}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
