// Deterministic post-run analysis for the one-way coach.
// Ported from the Python lab (engine/run_analysis.py).
//
// Produces the *numbers* the post-run inference is built from: how the run was
// paced (even / negative / positive split), how closely it tracked the plan, and
// whether the runner is improving versus their own history. No LLM — these are the
// grounded facts the persona narrates in cueLibrary.postRunText. If there isn't
// enough history to judge a trend, we say so (cold_start) rather than inventing one.

import { formatPace } from '../paceCalculator';
import { RunSnapshot, PlannedRun } from './runState';

export interface RunHistoryItem {
  type: string;
  avg_pace_s_per_km: number;
}

export interface RunAnalysis {
  km: number;
  duration_s: number;
  avg_pace: string | null;
  avg_pace_s_per_km: number | null;
  type: string;
  split_shape: 'negative' | 'even' | 'positive' | null;
  first_half_pace: string | null;
  second_half_pace: string | null;
  adherence_pct: number | null;
  improvement: string | null;
  cold_start: boolean;
}

function totalDistance(samples: RunSnapshot[]): number {
  return samples.reduce((m, s) => Math.max(m, s.dist_m), 0);
}

function totalTime(samples: RunSnapshot[]): number {
  return samples.reduce((m, s) => Math.max(m, s.t_s), 0);
}

function avgPaceSPerKm(distM: number, timeS: number): number | null {
  if (distM <= 0) return null;
  return timeS / (distM / 1000.0);
}

function splitShape(samples: RunSnapshot[], totalD: number): ['negative' | 'even' | 'positive' | null, number | null, number | null] {
  if (totalD <= 0 || samples.length < 4) return [null, null, null];
  const mid = totalD / 2.0;
  const first = samples.filter(s => s.dist_m <= mid);
  const second = samples.filter(s => s.dist_m > mid);
  if (first.length === 0 || second.length === 0) return [null, null, null];

  const halfPace = (seg: RunSnapshot[]): number | null => {
    const d = seg[seg.length - 1].dist_m - seg[0].dist_m;
    const t = seg[seg.length - 1].t_s - seg[0].t_s;
    if (d <= 0) return null;
    return t / (d / 1000.0);
  };

  const firstPace = halfPace(first);
  const secondPace = halfPace(second);
  if (!firstPace || !secondPace) return [null, firstPace, secondPace];

  const diff = secondPace - firstPace; // +ve => second half slower
  const tol = Math.max(8.0, 0.03 * firstPace);
  if (diff < -tol) return ['negative', firstPace, secondPace];
  if (diff > tol) return ['positive', firstPace, secondPace];
  return ['even', firstPace, secondPace];
}

function adherencePct(samples: RunSnapshot[], targetPace: number | undefined): number | null {
  if (!targetPace) return null;
  const paced = samples.filter(s => s.cur_pace_s_per_km || s.avg_pace_s_per_km);
  if (paced.length === 0) return null;
  const tol = Math.max(12.0, 0.06 * targetPace);
  let on = 0;
  for (const s of paced) {
    const p = (s.cur_pace_s_per_km ?? s.avg_pace_s_per_km) as number;
    if (Math.abs(p - targetPace) <= tol) on++;
  }
  return (100.0 * on) / paced.length;
}

/** Compare this run's average pace to recent same-type runs. Needs >=3 to claim a trend. */
export function analyzeImprovement(
  avgPace: number | null, runType: string, history: RunHistoryItem[]
): [string | null, boolean] {
  if (avgPace == null) return [null, true];
  const comparable = history.filter(h => h.type === runType && h.avg_pace_s_per_km).map(h => h.avg_pace_s_per_km);
  if (comparable.length < 3) return [null, true];
  const sorted = [...comparable].sort((a, b) => a - b);
  const baseline = sorted[Math.floor(sorted.length / 2)]; // median
  const delta = baseline - avgPace; // +ve => faster than baseline
  if (Math.abs(delta) < Math.max(5.0, 0.02 * baseline)) {
    return [`This is right in line with your recent ${runType} runs - consistency is building.`, false];
  }
  if (delta > 0) {
    return [`That's about ${Math.round(delta)}s/km faster than your recent ${runType} average - clear improvement.`, false];
  }
  return [`A touch slower than your recent ${runType} average (~${Math.round(Math.abs(delta))}s/km) - could be fatigue, heat, or terrain; one run doesn't define a trend.`, false];
}

/** Full deterministic post-run summary used to build the spoken inference. */
export function analyzeRun(
  planned: PlannedRun, samples: RunSnapshot[], history: RunHistoryItem[] = []
): RunAnalysis {
  const totalD = totalDistance(samples);
  const totalT = totalTime(samples);
  const avgPace = avgPaceSPerKm(totalD, totalT);
  const targetPace = planned.target_pace_s_per_km;

  const [shape, firstPace, secondPace] = splitShape(samples, totalD);
  const adherence = adherencePct(samples, targetPace);
  const [improvement, coldStart] = analyzeImprovement(avgPace, planned.type ?? 'easy', history);

  return {
    km: Math.round((totalD / 1000.0) * 100) / 100,
    duration_s: Math.round(totalT),
    avg_pace: avgPace ? formatPace(Math.trunc(avgPace)) : null,
    avg_pace_s_per_km: avgPace ? Math.round(avgPace * 10) / 10 : null,
    type: planned.type ?? 'easy',
    split_shape: shape,
    first_half_pace: firstPace ? formatPace(Math.trunc(firstPace)) : null,
    second_half_pace: secondPace ? formatPace(Math.trunc(secondPace)) : null,
    adherence_pct: adherence == null ? null : Math.round(adherence * 10) / 10,
    improvement,
    cold_start: coldStart,
  };
}
