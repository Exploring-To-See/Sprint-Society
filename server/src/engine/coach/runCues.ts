// Cue *timing* engine for the one-way during-run coach.
//
// Decides "when does the coach speak, and about what" — the running equivalent of
// Google Maps deciding *now* is the moment to say "in 200 metres, turn left". The
// runner can't talk back, so it must be judicious: the right thing at the right
// instant, and — just as important — SILENCE when the runner is in flow.
//
// Ported from the Python lab (engine/run_cues.py). Emits at most one CueEvent per
// telemetry tick; the persona wording is applied later by cueLibrary. No LLM.
//
// Anti-irritation design: (1) MIN_GAP_S spacing (safety bypasses it); (2) priority
// ladder SAFETY > PACE_CORRECTION > MILESTONE > MOTIVATION; (3) per-trigger
// back-off so the same nudge thins out; (4) flow-state gating (silent when locked
// in); (5) one-shot markers (start, halfway, each km, final push, finish).

import { formatPace } from '../paceCalculator';
import { RunSnapshot, RunnerState, PlannedRun, RunnerProfile, Phase, Need } from './runState';

export const Cue = {
  RUN_START: 'run_start',
  KM_MILESTONE: 'km_milestone',
  HALFWAY: 'halfway',
  SETTLE_PACE: 'settle_pace',
  HOLD_PACE: 'hold_pace',
  SUPPORT_FADE: 'support_fade',
  WALL_SUPPORT: 'wall_support',
  HR_SAFETY: 'hr_safety',
  FINAL_PUSH: 'final_push',
  FINISH: 'finish',
} as const;
export type Cue = (typeof Cue)[keyof typeof Cue];

export const PRIORITY: Record<string, number> = {
  [Cue.HR_SAFETY]: 100,
  [Cue.SETTLE_PACE]: 70,
  [Cue.SUPPORT_FADE]: 68,
  [Cue.HOLD_PACE]: 66,
  [Cue.WALL_SUPPORT]: 64,
  [Cue.FINISH]: 60,
  [Cue.FINAL_PUSH]: 55,
  [Cue.HALFWAY]: 50,
  [Cue.KM_MILESTONE]: 48,
  [Cue.RUN_START]: 90,
};

export const MIN_GAP_S = 60.0;
export const SAFETY_COOLDOWN_S = 45.0;
export const REACTIVE_COOLDOWN_S = 100.0;

export interface CuePayload {
  km_done: number;
  km_target: number;
  km_left: number;
  cur_pace: string | null;
  avg_pace: string | null;
  target_pace: string | null;
  pace_delta_s: number | null;
  hr: number | null;
  hr_pct: number | null;
  run_type: string;
  phase: Phase;
  variant?: number;
}

export interface CueEvent {
  trigger: Cue;
  priority: number;
  t_s: number;
  phase: Phase;
  need: Need;
  payload: CuePayload;
  reason: string;
}

/** Stateful per-run planner. Create one per run; feed it telemetry ticks. */
export class CuePlanner {
  private lastCueT: number | null = null;
  private firedOnce = new Set<string>();
  private firedKm = new Set<number>();
  private lastByTrigger = new Map<string, number>();
  private countByTrigger = new Map<string, number>();
  private safetySeen = false;

  constructor(
    private planned: PlannedRun,
    private zones: unknown,
    private profile: RunnerProfile
  ) {}

  private gapOk(tS: number): boolean {
    return this.lastCueT === null || tS - this.lastCueT >= MIN_GAP_S;
  }

  private cooldownOk(trigger: string, tS: number, cooldown: number): boolean {
    const last = this.lastByTrigger.get(trigger);
    return last === undefined || tS - last >= cooldown;
  }

  // A reactive nudge backs off the more it has already been said.
  private reactiveReady(trigger: string, tS: number, base: number): boolean {
    const count = this.countByTrigger.get(trigger) ?? 0;
    return this.cooldownOk(trigger, tS, base + 70.0 * count);
  }

  private commit(ev: CueEvent): CueEvent {
    ev.payload.variant = this.countByTrigger.get(ev.trigger) ?? 0;
    this.lastCueT = ev.t_s;
    this.lastByTrigger.set(ev.trigger, ev.t_s);
    this.countByTrigger.set(ev.trigger, (this.countByTrigger.get(ev.trigger) ?? 0) + 1);
    return ev;
  }

  /** Return the single best cue to speak now, or null for silence. */
  evaluate(snap: RunSnapshot, state: RunnerState): CueEvent | null {
    const t = snap.t_s;
    const targetPace = this.planned.target_pace_s_per_km;

    const payload = (): CuePayload => ({
      km_done: Math.round((snap.dist_m / 1000.0) * 100) / 100,
      km_target: Math.round(((this.planned.target_distance_m ?? 0) / 1000.0) * 100) / 100,
      km_left: Math.round((Math.max(0, (this.planned.target_distance_m ?? 0) - snap.dist_m) / 1000.0) * 100) / 100,
      cur_pace: snap.cur_pace_s_per_km ? formatPace(Math.trunc(snap.cur_pace_s_per_km)) : null,
      avg_pace: snap.avg_pace_s_per_km ? formatPace(Math.trunc(snap.avg_pace_s_per_km)) : null,
      target_pace: targetPace ? formatPace(Math.trunc(targetPace)) : null,
      pace_delta_s: state.pace_delta_s_per_km,
      hr: snap.hr ?? null,
      hr_pct: state.hr_pct_max,
      run_type: this.planned.type,
      phase: state.phase,
    });

    const mk = (trigger: Cue, reason: string): CueEvent => ({
      trigger, priority: PRIORITY[trigger] ?? 0, t_s: t, phase: state.phase, need: state.need,
      payload: payload(), reason,
    });

    // 1) SAFETY — bypasses the spacing gate; escalates + rotates wording.
    if (state.need === Need.SAFETY) {
      this.safetySeen = true;
      if (this.reactiveReady(Cue.HR_SAFETY, t, SAFETY_COOLDOWN_S)) {
        return this.commit(mk(Cue.HR_SAFETY, 'heart rate in safety zone'));
      }
      return null;
    }

    const candidates: Cue[] = [];

    // 2) One-shot opening cue (always lands; not gated by MIN_GAP).
    if (!this.firedOnce.has(Cue.RUN_START) && t <= 20 && snap.dist_m < 150) {
      this.firedOnce.add(Cue.RUN_START);
      return this.commit(mk(Cue.RUN_START, 'run started'));
    }

    // 3) Finish marker (one-shot).
    if (state.phase === Phase.DONE && !this.firedOnce.has(Cue.FINISH)) {
      this.firedOnce.add(Cue.FINISH);
      return this.commit(mk(Cue.FINISH, 'planned work complete'));
    }

    // 4) Distance & structural milestones (one-shot).
    const kmComplete = Math.trunc(snap.dist_m / 1000);
    if (kmComplete >= 1 && !this.firedKm.has(kmComplete)) candidates.push(Cue.KM_MILESTONE);
    if (!this.firedOnce.has(Cue.HALFWAY) && state.progress >= 0.5) candidates.push(Cue.HALFWAY);
    // Final push is an effort-UP cue — never give it after a redline this run.
    if (!this.firedOnce.has(Cue.FINAL_PUSH) && state.phase === Phase.FINAL_PUSH && !this.safetySeen) {
      candidates.push(Cue.FINAL_PUSH);
    }

    // 5) Reactive coaching cues — suppressed when in flow (need NONE); each backs off.
    if (state.need !== Need.NONE) {
      if (state.need === Need.SETTLE && this.reactiveReady(Cue.SETTLE_PACE, t, REACTIVE_COOLDOWN_S)) {
        candidates.push(Cue.SETTLE_PACE);
      } else if (state.need === Need.SUPPORT) {
        if (state.wall_risk && this.reactiveReady(Cue.WALL_SUPPORT, t, REACTIVE_COOLDOWN_S + 40)) {
          candidates.push(Cue.WALL_SUPPORT);
        } else if (this.reactiveReady(Cue.SUPPORT_FADE, t, REACTIVE_COOLDOWN_S)) {
          candidates.push(Cue.SUPPORT_FADE);
        }
      } else if (state.need === Need.HOLD && state.hr_status === 'high'
                 && this.reactiveReady(Cue.HOLD_PACE, t, REACTIVE_COOLDOWN_S)) {
        candidates.push(Cue.HOLD_PACE);
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (PRIORITY[b] ?? 0) - (PRIORITY[a] ?? 0));

    for (const trigger of candidates) {
      if (!this.gapOk(t)) return null;
      if (trigger === Cue.KM_MILESTONE) this.firedKm.add(kmComplete);
      else this.firedOnce.add(trigger);
      return this.commit(mk(trigger, `${trigger} due`));
    }
    return null;
  }
}
