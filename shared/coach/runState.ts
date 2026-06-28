// Runner-state model for the one-way (Rs.9) during-run coach.
//
// The runner cannot talk to the coach during a run. Everything the coach knows is
// INFERRED from telemetry the device reports (elapsed time, distance, pace, heart
// rate, whether they are moving). This turns a raw telemetry snapshot into a
// structured read of the runner's physical and likely emotional state, plus the
// kind of support a great human coach would judge they need right now.
//
// Fully deterministic — no LLM, no I/O. Ported from the Python lab
// (engine/run_state.py); numbers come from the pace/zone engines, this only
// classifies them. Principle: engines do the math, the LLM only does words.

// Phases of a run (fraction of planned distance / duration completed)
export const Phase = {
  START: 'start',
  SETTLE: 'settle',
  STEADY: 'steady',
  LATE: 'late',
  FINAL_PUSH: 'final_push',
  DONE: 'done',
} as const;
export type Phase = (typeof Phase)[keyof typeof Phase];

export const PaceStatus = {
  ON_TARGET: 'on_target',
  TOO_FAST: 'too_fast',
  TOO_SLOW: 'too_slow',
  FADING: 'fading',
} as const;
export type PaceStatus = (typeof PaceStatus)[keyof typeof PaceStatus];

export const HrStatus = {
  UNKNOWN: 'unknown',
  OK: 'ok',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
} as const;
export type HrStatus = (typeof HrStatus)[keyof typeof HrStatus];

export const Mind = {
  EAGER: 'eager',
  SETTLING: 'settling',
  LOCKED_IN: 'locked_in',
  STRAINING: 'straining',
  DIGGING: 'digging_deep',
  SUMMONING: 'summoning',
  RECOVERING: 'recovering',
} as const;
export type Mind = (typeof Mind)[keyof typeof Mind];

export const Need = {
  NONE: 'none',
  SETTLE: 'settle',
  REASSURE: 'reassure',
  HOLD: 'hold',
  PUSH: 'push',
  SUPPORT: 'support',
  SAFETY: 'safety',
} as const;
export type Need = (typeof Need)[keyof typeof Need];

export interface PlannedRun {
  type: 'easy' | 'long' | 'tempo' | 'intervals' | 'race';
  target_distance_m?: number;
  target_duration_s?: number;
  target_pace_s_per_km?: number;
}

export interface RunnerProfile {
  age?: number;
  gender?: string;
  max_hr?: number;
  level?: string;
}

/** One sampled instant of live telemetry. Any field may be undefined. */
export interface RunSnapshot {
  t_s: number;                       // elapsed seconds since start
  dist_m: number;                    // meters covered so far
  cur_pace_s_per_km?: number;        // instantaneous pace (sec/km)
  avg_pace_s_per_km?: number;        // cumulative average pace (sec/km)
  hr?: number;                       // current heart rate (bpm)
  cadence?: number;                  // steps per minute
  moving?: boolean;                  // false => paused / walking / break (default true)
}

export interface RunnerState {
  phase: Phase;
  progress: number;                  // 0..1 fraction of the planned run complete
  pace_status: PaceStatus;
  pace_delta_s_per_km: number | null; // +ve = slower than target, -ve = faster
  hr_status: HrStatus;
  hr_pct_max: number | null;
  mind: Mind;
  need: Need;
  wall_risk: boolean;
  on_break: boolean;
  flags: string[];
}

function tanakaMaxHr(age: number): number {
  return Math.round(208 - 0.7 * age);
}

// Fraction of max HR each run type should generally stay under.
const HR_CAP_BY_TYPE: Record<string, number> = {
  easy: 0.78,
  long: 0.80,
  tempo: 0.90,
  race: 0.94,
  intervals: 0.96,
};
const HR_SAFETY_FRACTION = 0.97;

function progressOf(snap: RunSnapshot, planned: PlannedRun): number {
  const fracs: number[] = [];
  if (planned.target_distance_m) fracs.push(snap.dist_m / planned.target_distance_m);
  if (planned.target_duration_s) fracs.push(snap.t_s / planned.target_duration_s);
  if (fracs.length === 0) return 0;
  return Math.max(0, Math.min(1.05, Math.max(...fracs)));
}

function phaseOf(progress: number): Phase {
  if (progress >= 1.0) return Phase.DONE;
  if (progress >= 0.90) return Phase.FINAL_PUSH;
  if (progress >= 0.70) return Phase.LATE;
  if (progress >= 0.30) return Phase.STEADY;
  if (progress >= 0.12) return Phase.SETTLE;
  return Phase.START;
}

export function isFinalPush(snap: RunSnapshot, planned: PlannedRun): boolean {
  return phaseOf(progressOf(snap, planned)) === Phase.FINAL_PUSH;
}

function paceStatusOf(snap: RunSnapshot, planned: PlannedRun, phase: Phase): [PaceStatus, number | null] {
  const target = planned.target_pace_s_per_km;
  const pace = snap.avg_pace_s_per_km ?? snap.cur_pace_s_per_km;
  if (!target || !pace) return [PaceStatus.ON_TARGET, null];
  const delta = pace - target; // +ve => slower than target
  const tol = Math.max(10.0, 0.05 * target);

  if (phase === Phase.START || phase === Phase.SETTLE) {
    if (delta < -tol) return [PaceStatus.TOO_FAST, delta];
  }
  if (delta < -tol) return [PaceStatus.TOO_FAST, delta];
  if (delta > tol) {
    if (phase === Phase.LATE || phase === Phase.FINAL_PUSH) return [PaceStatus.FADING, delta];
    return [PaceStatus.TOO_SLOW, delta];
  }
  return [PaceStatus.ON_TARGET, delta];
}

function hrStatusOf(snap: RunSnapshot, planned: PlannedRun, profile: RunnerProfile): [HrStatus, number | null] {
  if (snap.hr == null) return [HrStatus.UNKNOWN, null];
  const maxHr = profile.max_hr || tanakaMaxHr(profile.age ?? 30);
  if (maxHr <= 0) return [HrStatus.UNKNOWN, null];
  const pct = snap.hr / maxHr;
  if (pct >= HR_SAFETY_FRACTION) return [HrStatus.VERY_HIGH, pct];
  const cap = HR_CAP_BY_TYPE[planned.type] ?? 0.85;
  let grace = planned.type === 'easy' || planned.type === 'long' ? 0.05 : 0.03;
  if (isFinalPush(snap, planned)) grace += 0.03;
  if (pct >= cap + grace) return [HrStatus.HIGH, pct];
  return [HrStatus.OK, pct];
}

function wallRiskOf(snap: RunSnapshot, planned: PlannedRun): boolean {
  if (planned.type !== 'long' && planned.type !== 'race') return false;
  return snap.t_s >= 90 * 60 || snap.dist_m >= 28000;
}

function mindAndNeed(
  phase: Phase, paceStatus: PaceStatus, hrStatus: HrStatus, wallRisk: boolean, onBreak: boolean
): [Mind, Need] {
  if (hrStatus === HrStatus.VERY_HIGH) return [Mind.STRAINING, Need.SAFETY];
  if (onBreak) return [Mind.RECOVERING, Need.REASSURE];
  if (wallRisk) return [Mind.DIGGING, Need.SUPPORT];

  if (phase === Phase.START) {
    if (paceStatus === PaceStatus.TOO_FAST) return [Mind.EAGER, Need.SETTLE];
    return [Mind.EAGER, Need.REASSURE];
  }
  if (phase === Phase.SETTLE) {
    if (paceStatus === PaceStatus.TOO_FAST) return [Mind.EAGER, Need.SETTLE];
    return [Mind.SETTLING, Need.HOLD];
  }
  if (phase === Phase.STEADY) {
    if (paceStatus === PaceStatus.TOO_FAST || hrStatus === HrStatus.HIGH) return [Mind.STRAINING, Need.HOLD];
    if (paceStatus === PaceStatus.TOO_SLOW || paceStatus === PaceStatus.FADING) return [Mind.STRAINING, Need.SUPPORT];
    return [Mind.LOCKED_IN, Need.NONE];
  }
  if (phase === Phase.LATE) {
    if (paceStatus === PaceStatus.FADING || hrStatus === HrStatus.HIGH) return [Mind.STRAINING, Need.SUPPORT];
    return [Mind.LOCKED_IN, Need.HOLD];
  }
  if (phase === Phase.FINAL_PUSH) return [Mind.SUMMONING, Need.PUSH];
  return [Mind.LOCKED_IN, Need.NONE];
}

/** Top-level: telemetry snapshot -> RunnerState. Pure function. */
export function inferState(snap: RunSnapshot, planned: PlannedRun, profile: RunnerProfile): RunnerState {
  const progress = progressOf(snap, planned);
  const phase = phaseOf(progress);
  const onBreak = snap.moving === false;

  const [paceStatus, paceDelta] = paceStatusOf(snap, planned, phase);
  const [hrStatus, hrPct] = hrStatusOf(snap, planned, profile);
  const wallRisk = wallRiskOf(snap, planned);
  const [mind, need] = mindAndNeed(phase, paceStatus, hrStatus, wallRisk, onBreak);

  const flags: string[] = [];
  if (paceStatus === PaceStatus.TOO_FAST && (phase === Phase.START || phase === Phase.SETTLE)) flags.push('hot_start');
  if (paceStatus === PaceStatus.FADING) flags.push('positive_split');
  if (hrStatus === HrStatus.HIGH) flags.push('hr_drift');
  if (hrStatus === HrStatus.VERY_HIGH) flags.push('hr_redline');
  if (wallRisk) flags.push('wall_zone');
  if (onBreak) flags.push('on_break');

  return {
    phase,
    progress: Math.round(progress * 1000) / 1000,
    pace_status: paceStatus,
    pace_delta_s_per_km: paceDelta == null ? null : Math.round(paceDelta * 10) / 10,
    hr_status: hrStatus,
    hr_pct_max: hrPct == null ? null : Math.round(hrPct * 1000) / 1000,
    mind,
    need,
    wall_risk: wallRisk,
    on_break: onBreak,
    flags,
  };
}
