// useRunCoach — a UI-agnostic React hook that runs the one-way coach for a run.
//
// It is deliberately headless (no JSX, no styling) so it slots into whatever UI
// you finalize. The during-run cue engine runs ON-DEVICE (shared/coach) so cues
// are instant and work offline; the pre-run brief and post-run recap use the API.
//
// Typical wiring inside your run-tracker once designs are ready:
//
//   const coach = useRunCoach('scientist');
//   // when the run starts:
//   await coach.start({ type: 'easy', target_distance_m: 5000 });
//   speak(coach.brief);
//   // on every GPS tick (you already compute these):
//   const cue = coach.feed({ t_s, dist_m, cur_pace_s_per_km, avg_pace_s_per_km, hr });
//   if (cue) speak(cue);            // play TTS / show a toast — your call
//   // when the run ends:
//   const recap = await coach.finish(allSnapshots);
//   speak(recap);

import { useCallback, useRef, useState } from 'react';
import {
  CuePlanner, inferState, renderCue,
  type RunSnapshot, type PlannedRun, type PaceZones, type RunnerProfile, type TimedCue,
} from '../../../../shared/coach';
import {
  fetchPreRun, fetchPostRun, type PlannedRunInput, type Persona, type PreRunResponse,
} from './api';
import type { RunHistoryItem } from '../../../../shared/coach';

function zonePaceForType(zones: PaceZones, type: PlannedRun['type']): number {
  switch (type) {
    case 'tempo': return zones.tempo_pace_per_km;
    case 'intervals': return zones.interval_pace_per_km;
    case 'race': return zones.race_pace_per_km;
    default: return zones.easy_pace_per_km; // easy / long
  }
}

export interface UseRunCoach {
  persona: Persona;
  setPersona: (p: Persona) => void;
  brief: string | null;
  latestCue: TimedCue | null;
  cues: TimedCue[];
  /** Fetch the brief + zones and arm the live engine for a new run. */
  start: (planned: PlannedRunInput) => Promise<PreRunResponse>;
  /** Feed one telemetry tick; returns a cue line to deliver now, or null (silence). */
  feed: (snap: RunSnapshot) => string | null;
  /** Get the grounded post-run recap. */
  finish: (samples: RunSnapshot[], history?: RunHistoryItem[]) => Promise<string>;
  /** Clear state for another run. */
  reset: () => void;
}

export function useRunCoach(initialPersona: Persona = 'energizer'): UseRunCoach {
  const [persona, setPersona] = useState<Persona>(initialPersona);
  const [brief, setBrief] = useState<string | null>(null);
  const [latestCue, setLatestCue] = useState<TimedCue | null>(null);
  const [cues, setCues] = useState<TimedCue[]>([]);

  const plannerRef = useRef<CuePlanner | null>(null);
  const plannedRef = useRef<PlannedRun | null>(null);
  const profileRef = useRef<RunnerProfile>({});
  const personaRef = useRef<Persona>(initialPersona);
  personaRef.current = persona;

  const start = useCallback(async (planned: PlannedRunInput): Promise<PreRunResponse> => {
    const res = await fetchPreRun(planned, personaRef.current);
    const resolved: PlannedRun = {
      ...planned,
      target_pace_s_per_km: planned.target_pace_s_per_km ?? zonePaceForType(res.zones, planned.type),
    };
    plannedRef.current = resolved;
    profileRef.current = res.profile;
    plannerRef.current = new CuePlanner(resolved, res.zones, res.profile);
    if (res.persona) setPersona(res.persona);
    setBrief(res.brief);
    setLatestCue(null);
    setCues([]);
    return res;
  }, []);

  const feed = useCallback((snap: RunSnapshot): string | null => {
    const planner = plannerRef.current;
    const planned = plannedRef.current;
    if (!planner || !planned) return null;
    const state = inferState(snap, planned, profileRef.current);
    const ev = planner.evaluate(snap, state);
    if (!ev) return null;
    const text = renderCue(ev, personaRef.current);
    const cue: TimedCue = { t_s: Math.round(ev.t_s * 10) / 10, text };
    setLatestCue(cue);
    setCues(prev => [...prev, cue]);
    return text;
  }, []);

  const finish = useCallback(async (samples: RunSnapshot[], history: RunHistoryItem[] = []): Promise<string> => {
    const planned = plannedRef.current;
    if (!planned) return '';
    const res = await fetchPostRun(planned, samples, history, personaRef.current);
    return res.report;
  }, []);

  const reset = useCallback(() => {
    plannerRef.current = null;
    plannedRef.current = null;
    setBrief(null);
    setLatestCue(null);
    setCues([]);
  }, []);

  return { persona, setPersona, brief, latestCue, cues, start, feed, finish, reset };
}
