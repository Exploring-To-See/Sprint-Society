"""Runner-state model for the one-way (Rs.9) during-run coach.

The runner CANNOT talk to the coach during a run. Everything the coach knows is
INFERRED from telemetry the device reports (elapsed time, distance, pace, heart
rate, cadence, whether they are moving). This module turns a raw telemetry
snapshot into a structured read of the runner's *physical* and likely *emotional*
state, plus the kind of support a great human coach would judge they need right now.

It is fully deterministic — no LLM, no network. Numbers come from the pace/zone
engines; this module only classifies them. The cue engine (`engine.run_cues`)
consumes the state; the cue library (`coaching.cue_library`) voices it per persona.

Design principle (matches the spec): engines do the math, the LLM only does words.
This file is all math/logic, so its output is safe to ground cues on.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


# --------------------------------------------------------------------------- #
# Phases of a run (fraction of planned distance / duration completed)
# --------------------------------------------------------------------------- #
PHASE_START = "start"          # first minutes — adrenaline, prone to going out too fast
PHASE_SETTLE = "settle"        # finding rhythm, locking onto target effort
PHASE_STEADY = "steady"        # the working middle — runner is "in flow", keep quiet
PHASE_LATE = "late"            # accumulating fatigue, RPE climbing
PHASE_FINAL_PUSH = "final_push"  # closing stretch — summon what's left
PHASE_DONE = "done"            # planned work complete

# Pace status vs the planned target pace
PACE_ON_TARGET = "on_target"
PACE_TOO_FAST = "too_fast"     # faster than target beyond tolerance (overpacing)
PACE_TOO_SLOW = "too_slow"     # slower than target beyond tolerance
PACE_FADING = "fading"         # slowing across the run (positive split) — a fatigue signal

# Heart-rate status vs the effort the planned run calls for
HR_UNKNOWN = "unknown"
HR_OK = "ok"
HR_HIGH = "high"               # above the band this run type should sit in
HR_VERY_HIGH = "very_high"     # safety territory — ease off regardless of plan

# Predicted mental state (one-way inference — a best-effort read, never asserted as fact)
MIND_EAGER = "eager"           # fresh, excited, likely to overcook the start
MIND_SETTLING = "settling"
MIND_LOCKED_IN = "locked_in"   # rhythm found, focused — leave them alone
MIND_STRAINING = "straining"   # effort high, form likely slipping
MIND_DIGGING = "digging_deep"  # deep fatigue / "the wall"
MIND_SUMMONING = "summoning"   # final push, reaching for the finish
MIND_RECOVERING = "recovering"  # on a walk/break

# What kind of support the coach should give (drives which cue is appropriate)
NEED_NONE = "none"             # stay silent — they're in flow
NEED_SETTLE = "settle"         # reel them back from an over-fast start
NEED_REASSURE = "reassure"
NEED_HOLD = "hold"             # hold this effort / form reminder
NEED_PUSH = "push"             # encourage the close
NEED_SUPPORT = "support"       # heavy fatigue — empathy + a small actionable
NEED_SAFETY = "safety"         # back off for health reasons — overrides everything


def _tanaka_max_hr(age: int) -> int:
    """Tanaka (2001) age-predicted max HR — more accurate than 220-age."""
    return round(208 - 0.7 * age)


# Fraction of max HR that each run type should generally stay under.
# (Conservative bands; intervals legitimately run hot, so its cap is highest.)
_HR_CAP_BY_TYPE = {
    "easy": 0.78,
    "long": 0.80,
    "tempo": 0.90,
    "race": 0.94,
    "intervals": 0.96,
}
# Above this fraction of max HR we treat it as a safety concern on any run type.
_HR_SAFETY_FRACTION = 0.97


@dataclass
class RunSnapshot:
    """One sampled instant of live telemetry. Any field may be None if the
    device/profile does not provide it; the model degrades gracefully."""
    t_s: float                                  # elapsed seconds since start
    dist_m: float                               # meters covered so far
    cur_pace_s_per_km: Optional[float] = None   # instantaneous pace (sec/km)
    avg_pace_s_per_km: Optional[float] = None   # cumulative average pace (sec/km)
    hr: Optional[int] = None                     # current heart rate (bpm)
    cadence: Optional[int] = None                # steps per minute
    moving: bool = True                          # False => paused / walking / break


@dataclass
class RunnerState:
    """Structured read of where the runner is, physically and mentally."""
    phase: str
    progress: float                  # 0..1 fraction of the planned run complete
    pace_status: str
    pace_delta_s_per_km: Optional[float]  # +ve = slower than target, -ve = faster
    hr_status: str
    hr_pct_max: Optional[float]
    mind: str
    need: str
    wall_risk: bool = False          # long-run glycogen-depletion zone
    on_break: bool = False
    flags: list = field(default_factory=list)


def _progress(snap: RunSnapshot, planned: dict) -> float:
    target_d = planned.get("target_distance_m")
    target_t = planned.get("target_duration_s")
    fracs = []
    if target_d:
        fracs.append(snap.dist_m / target_d)
    if target_t:
        fracs.append(snap.t_s / target_t)
    if not fracs:
        return 0.0
    return max(0.0, min(1.05, max(fracs)))


def _phase(progress: float) -> str:
    if progress >= 1.0:
        return PHASE_DONE
    if progress >= 0.90:
        return PHASE_FINAL_PUSH
    if progress >= 0.70:
        return PHASE_LATE
    if progress >= 0.30:
        return PHASE_STEADY
    if progress >= 0.12:
        return PHASE_SETTLE
    return PHASE_START


def _pace_status(snap: RunSnapshot, planned: dict, phase: str):
    """Compare effort to target. Returns (status, delta_s_per_km).

    Tolerance is asymmetric and phase-aware: going out too fast early is the
    classic adrenaline mistake and is flagged sooner; late-run slowing is
    expected and only flagged as 'fading' when it is pronounced.
    """
    target = planned.get("target_pace_s_per_km")
    pace = snap.avg_pace_s_per_km or snap.cur_pace_s_per_km
    if not target or not pace:
        return PACE_ON_TARGET, None
    delta = pace - target  # +ve => slower than target

    # tolerance in s/km, scaled a little by target pace
    tol = max(10.0, 0.05 * target)

    # Early over-pacing: tighter fast-tolerance during start/settle.
    if phase in (PHASE_START, PHASE_SETTLE):
        if delta < -tol:
            return PACE_TOO_FAST, delta

    if delta < -tol:
        return PACE_TOO_FAST, delta
    if delta > tol:
        # In late phases a slow-down reads as fatigue (fading) rather than a
        # discipline problem; the cue tone differs accordingly.
        if phase in (PHASE_LATE, PHASE_FINAL_PUSH):
            return PACE_FADING, delta
        return PACE_TOO_SLOW, delta
    return PACE_ON_TARGET, delta


def _hr_status(snap: RunSnapshot, planned: dict, profile: dict):
    """Returns (status, pct_of_max). Uses profile max_hr if given, else Tanaka."""
    if snap.hr is None:
        return HR_UNKNOWN, None
    max_hr = profile.get("max_hr") or _tanaka_max_hr(profile.get("age", 30))
    if max_hr <= 0:
        return HR_UNKNOWN, None
    pct = snap.hr / max_hr
    if pct >= _HR_SAFETY_FRACTION:
        return HR_VERY_HIGH, pct
    cap = _HR_CAP_BY_TYPE.get(planned.get("type", "easy"), 0.85)
    # Allow a small grace band, and a little extra room in the final push.
    grace = 0.05 if planned.get("type") in ("easy", "long") else 0.03
    if snap_is_final_push(snap, planned):
        grace += 0.03
    if pct >= cap + grace:
        return HR_HIGH, pct
    return HR_OK, pct


def snap_is_final_push(snap: RunSnapshot, planned: dict) -> bool:
    return _phase(_progress(snap, planned)) == PHASE_FINAL_PUSH


def _wall_risk(snap: RunSnapshot, planned: dict) -> bool:
    """Glycogen-depletion ('the wall') zone for long efforts: roughly beyond
    ~90 min or ~28 km of continuous running."""
    if planned.get("type") not in ("long", "race"):
        return False
    return snap.t_s >= 90 * 60 or snap.dist_m >= 28000


def _mind_and_need(phase, pace_status, hr_status, wall_risk, on_break):
    """Map physical signals to a predicted mental state and the support need.

    Safety always wins. Otherwise the rule of thumb a good coach follows:
    - fresh + too fast  -> they're buzzing, rein them in gently
    - steady + on target -> they're locked in, SAY NOTHING
    - late/fading        -> they're hurting, give form + empathy, not pressure
    - final push         -> lift them home
    """
    if hr_status == HR_VERY_HIGH:
        return MIND_STRAINING, NEED_SAFETY
    if on_break:
        return MIND_RECOVERING, NEED_REASSURE
    if wall_risk:
        return MIND_DIGGING, NEED_SUPPORT

    if phase == PHASE_START:
        if pace_status == PACE_TOO_FAST:
            return MIND_EAGER, NEED_SETTLE
        return MIND_EAGER, NEED_REASSURE
    if phase == PHASE_SETTLE:
        if pace_status == PACE_TOO_FAST:
            return MIND_EAGER, NEED_SETTLE
        return MIND_SETTLING, NEED_HOLD
    if phase == PHASE_STEADY:
        if pace_status == PACE_TOO_FAST or hr_status == HR_HIGH:
            return MIND_STRAINING, NEED_HOLD
        if pace_status in (PACE_TOO_SLOW, PACE_FADING):
            return MIND_STRAINING, NEED_SUPPORT
        return MIND_LOCKED_IN, NEED_NONE          # in flow — stay quiet
    if phase == PHASE_LATE:
        if pace_status == PACE_FADING or hr_status == HR_HIGH:
            return MIND_STRAINING, NEED_SUPPORT
        return MIND_LOCKED_IN, NEED_HOLD
    if phase == PHASE_FINAL_PUSH:
        return MIND_SUMMONING, NEED_PUSH
    return MIND_LOCKED_IN, NEED_NONE


def infer_state(snap: RunSnapshot, planned: dict, profile: dict) -> RunnerState:
    """Top-level: telemetry snapshot -> RunnerState. Pure function."""
    progress = _progress(snap, planned)
    phase = _phase(progress)
    on_break = not snap.moving

    pace_status, pace_delta = _pace_status(snap, planned, phase)
    hr_status, hr_pct = _hr_status(snap, planned, profile)
    wall_risk = _wall_risk(snap, planned)
    mind, need = _mind_and_need(phase, pace_status, hr_status, wall_risk, on_break)

    flags = []
    if pace_status == PACE_TOO_FAST and phase in (PHASE_START, PHASE_SETTLE):
        flags.append("hot_start")
    if pace_status == PACE_FADING:
        flags.append("positive_split")
    if hr_status == HR_HIGH:
        flags.append("hr_drift")
    if hr_status == HR_VERY_HIGH:
        flags.append("hr_redline")
    if wall_risk:
        flags.append("wall_zone")
    if on_break:
        flags.append("on_break")

    return RunnerState(
        phase=phase,
        progress=round(progress, 3),
        pace_status=pace_status,
        pace_delta_s_per_km=None if pace_delta is None else round(pace_delta, 1),
        hr_status=hr_status,
        hr_pct_max=None if hr_pct is None else round(hr_pct, 3),
        mind=mind,
        need=need,
        wall_risk=wall_risk,
        on_break=on_break,
        flags=flags,
    )
