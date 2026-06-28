import { describe, it, expect } from 'vitest';
import { RunSnapshot, PlannedRun, RunnerProfile, inferState, Need, Phase } from './runState';
import { CuePlanner, Cue, CueEvent } from './runCues';
import { analyzeRun } from './runAnalysis';
import { renderCue } from './cueLibrary';
import { preRunBrief, runCueStream } from './oneWayCoach';
import { PaceZones } from '../paceCalculator';

const PLANNED: PlannedRun = { type: 'easy', target_distance_m: 5000, target_pace_s_per_km: 360 };
const ZONES: PaceZones = { easy_pace_per_km: 360, tempo_pace_per_km: 300, interval_pace_per_km: 270, race_pace_per_km: 312 };
const PROFILE: RunnerProfile = { age: 30, gender: 'male', max_hr: 190, level: 'beginner' };

// Build a deterministic telemetry trace (sampled every 5s).
function trace(paceAt: (frac: number) => number, hrAt: (t: number, frac: number) => number, totalM = 5000): RunSnapshot[] {
  let t = 0, d = 0;
  const out: RunSnapshot[] = [];
  while (d < totalM && t < 4000) {
    const frac = d / totalM;
    const pace = paceAt(frac);
    d += (1000.0 / pace) * 5.0;
    t += 5.0;
    out.push({ t_s: t, dist_m: Math.min(d, totalM), cur_pace_s_per_km: pace, avg_pace_s_per_km: t / (d / 1000.0), hr: hrAt(t, frac), moving: true });
  }
  return out;
}

describe('one-way coach', () => {
  it('safety cue fires and bypasses the spacing gate', () => {
    const planner = new CuePlanner(PLANNED, ZONES, PROFILE);
    // opening cue at t=5
    const s0: RunSnapshot = { t_s: 5, dist_m: 12, cur_pace_s_per_km: 360, avg_pace_s_per_km: 360, hr: 130 };
    expect(planner.evaluate(s0, inferState(s0, PLANNED, PROFILE))?.trigger).toBe(Cue.RUN_START);
    // 10s later (< 60s gap) a redline -> safety must still fire
    const s1: RunSnapshot = { t_s: 15, dist_m: 40, cur_pace_s_per_km: 360, avg_pace_s_per_km: 360, hr: 188 };
    const state = inferState(s1, PLANNED, PROFILE);
    expect(state.need).toBe(Need.SAFETY);
    expect(planner.evaluate(s1, state)?.trigger).toBe(Cue.HR_SAFETY);
  });

  it('stays silent when the runner is in flow', () => {
    const snap: RunSnapshot = { t_s: 1000, dist_m: 2300, cur_pace_s_per_km: 360, avg_pace_s_per_km: 360, hr: 150 };
    const state = inferState(snap, PLANNED, PROFILE);
    expect(state.phase).toBe(Phase.STEADY);
    expect(state.need).toBe(Need.NONE);
  });

  it('spaces non-safety cues by at least MIN_GAP', () => {
    const samples = trace(f => (f < 0.2 ? 332 : 362), t => Math.trunc(125 + Math.min(40, (t / 60) * 1.6)));
    const stream = runCueStream(PLANNED, ZONES, PROFILE, samples, 'scientist');
    // collect timestamps of non-safety cues — they must be >= 59.5s apart
    let last: number | null = null;
    for (const c of stream) {
      if (last !== null) expect(c.t_s - last).toBeGreaterThanOrEqual(59.5);
      last = c.t_s;
    }
    expect(stream.length).toBeGreaterThan(2);
  });

  it('never asks a two-way question across a full run, any persona', () => {
    const samples = trace(f => (f < 0.5 ? 362 : 362 + (f - 0.5) / 0.5 * 60), t => Math.trunc(0.70 * 190 + 0.18 * 190 * (t / 2400)));
    for (const persona of ['scientist', 'energizer', 'warrior', 'sage']) {
      for (const c of runCueStream(PLANNED, ZONES, PROFILE, samples, persona)) {
        expect(c.text.includes('?')).toBe(false);
      }
    }
  });

  it('detects a positive split and hedges with no history', () => {
    const samples = trace(f => (f < 0.5 ? 360 : 410), () => 150);
    const a = analyzeRun(PLANNED, samples, []);
    expect(a.split_shape).toBe('positive');
    expect(a.cold_start).toBe(true);
  });

  it('grounds spoken numbers in the engine (target pace appears verbatim)', () => {
    // 360 s/km -> 6:00/km
    expect(preRunBrief(PLANNED, ZONES, PROFILE, 'scientist')).toContain('6:00/km');
    const samples: RunSnapshot[] = [{ t_s: 5, dist_m: 12, cur_pace_s_per_km: 360, avg_pace_s_per_km: 360, hr: 130 }];
    const stream = runCueStream(PLANNED, ZONES, PROFILE, samples, 'scientist');
    expect(stream[0].text).toContain('6:00/km');
  });

  it('rotates wording so repeated nudges are not identical', () => {
    const mk = (variant: number): CueEvent => ({
      trigger: Cue.SUPPORT_FADE, priority: 68, t_s: 100 + variant, phase: Phase.LATE, need: Need.SUPPORT,
      payload: { km_done: 3, km_target: 5, km_left: 2, cur_pace: null, avg_pace: null, target_pace: null, pace_delta_s: 20, hr: null, hr_pct: null, run_type: 'easy', phase: Phase.LATE, variant },
      reason: 'test',
    });
    expect(renderCue(mk(0), 'warrior')).not.toBe(renderCue(mk(1), 'warrior'));
  });
});
