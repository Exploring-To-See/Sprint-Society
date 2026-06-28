// Orchestrator for the Rs.9 one-way coach. Ported from coaching/one_way_coach.py.
//
// Public surface (everything the API/UI needs for the one-way plan):
//   - preRunBrief(...)   -> string                 : what the coach says before the run
//   - runCueStream(...)  -> {t_s, text}[]          : the timed during-run cues (the core)
//   - postRunReport(...) -> string                 : grounded inference after the run
//
// One-way by construction: the runner never sends input; every output is derived
// from telemetry + plan + profile + history. Numbers come from the engines; words
// come from the persona cue library. No network, no LLM.

import { formatPace, PaceZones } from '../paceCalculator';
import { RunSnapshot, PlannedRun, RunnerProfile, inferState } from './runState';
import { CuePlanner } from './runCues';
import { analyzeRun, RunHistoryItem } from './runAnalysis';
import { renderCue, preRunBriefText, postRunText } from './cueLibrary';

export interface TimedCue {
  t_s: number;
  text: string;
}

function zonePaceForType(zones: PaceZones | undefined, runType: string): number | undefined {
  if (!zones) return undefined;
  switch (runType) {
    case 'tempo': return zones.tempo_pace_per_km;
    case 'intervals': return zones.interval_pace_per_km;
    case 'race': return zones.race_pace_per_km;
    case 'easy':
    case 'long':
    default: return zones.easy_pace_per_km;
  }
}

function fmt(secondsPerKm: number | undefined): string {
  if (!secondsPerKm) return 'a comfortable pace';
  return formatPace(Math.trunc(secondsPerKm));
}

/** Build the pre-run brief. target pace is taken from the plan, else derived from zones. */
export function preRunBrief(planned: PlannedRun, zones: PaceZones, profile: RunnerProfile, persona: string): string {
  const targetPace = planned.target_pace_s_per_km ?? zonePaceForType(zones, planned.type);
  const targetKm = Math.round(((planned.target_distance_m ?? 0) / 1000.0) * 10) / 10;
  return preRunBriefText({
    type: planned.type,
    target_km: targetKm || 'your planned',
    target_pace: fmt(targetPace),
  }, persona);
}

/**
 * Feed a telemetry trace through the state model + cue planner and return the
 * list of {t_s, text} cues — i.e. the responses AND their timing. In production
 * the device streams snapshots live and the SAME CuePlanner is called per tick;
 * this replays a recorded/simulated trace.
 */
export function runCueStream(
  planned: PlannedRun, zones: PaceZones, profile: RunnerProfile, samples: RunSnapshot[], persona: string
): TimedCue[] {
  const p: PlannedRun = { ...planned };
  if (!p.target_pace_s_per_km) p.target_pace_s_per_km = zonePaceForType(zones, planned.type);

  const planner = new CuePlanner(p, zones, profile);
  const out: TimedCue[] = [];
  for (const snap of samples) {
    const state = inferState(snap, p, profile);
    const event = planner.evaluate(snap, state);
    if (event) out.push({ t_s: Math.round(event.t_s * 10) / 10, text: renderCue(event, persona) });
  }
  return out;
}

export function postRunReport(
  planned: PlannedRun, samples: RunSnapshot[], profile: RunnerProfile, history: RunHistoryItem[], persona: string
): string {
  const analysis = analyzeRun(planned, samples, history);
  return postRunText(analysis as unknown as Record<string, unknown>, persona);
}
