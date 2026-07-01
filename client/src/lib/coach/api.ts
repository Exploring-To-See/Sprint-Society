// Typed client for the one-way (Rs.9) AI coach backend (/api/coach/*).
//
// UI-agnostic: call these from any component once your designs are finalized.
// The during-run cue ENGINE runs on-device (see useRunCoach) for instant cues;
// these calls are for the brief (pre), the recap (post), and the persona list.

import api from '../api';
import type {
  PaceZones, RunSnapshot, RunnerProfile, TimedCue, RunAnalysis, RunHistoryItem,
} from '../../../../shared/coach';

export type Persona = 'scientist' | 'energizer' | 'warrior' | 'sage';

export interface PlannedRunInput {
  type: 'easy' | 'long' | 'tempo' | 'intervals' | 'race';
  target_distance_m?: number;
  target_duration_s?: number;
  target_pace_s_per_km?: number;
}

export interface PreRunResponse {
  persona: Persona;
  brief: string;
  zones: PaceZones;
  profile: RunnerProfile;
}

export interface PostRunResponse {
  persona: Persona;
  report: string;
  analysis: RunAnalysis;
}

/** The four selectable coach voices. */
export async function fetchPersonas(): Promise<Persona[]> {
  const { data } = await api.get('/coach/personas');
  return data.personas as Persona[];
}

/**
 * Pre-run brief PLUS the user's pace zones + profile, so the client can drive the
 * live cue engine on-device. Call once when a run starts.
 */
export async function fetchPreRun(planned: PlannedRunInput, persona?: Persona): Promise<PreRunResponse> {
  const { data } = await api.post('/coach/pre-run', { ...planned, persona });
  return data as PreRunResponse;
}

/** Score a full/partial telemetry trace server-side (alternative to the live engine). */
export async function fetchRunCues(
  planned: PlannedRunInput, samples: RunSnapshot[], persona?: Persona
): Promise<{ persona: Persona; cues: TimedCue[] }> {
  const { data } = await api.post('/coach/run-cues', { ...planned, persona, samples });
  return data as { persona: Persona; cues: TimedCue[] };
}

/** Grounded post-run recap + analysis. */
export async function fetchPostRun(
  planned: PlannedRunInput, samples: RunSnapshot[], history: RunHistoryItem[] = [], persona?: Persona
): Promise<PostRunResponse> {
  const { data } = await api.post('/coach/post-run', { ...planned, persona, samples, history });
  return data as PostRunResponse;
}
