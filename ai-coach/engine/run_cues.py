"""Cue *timing* engine for the one-way during-run coach.

This is the "when does the coach speak, and about what" brain — the running
equivalent of Google Maps deciding *now* is the moment to say "in 200 metres,
turn left". The runner can't talk back, so the engine has to be judicious:
say the right thing at the right instant, and — just as importantly — STAY
SILENT when the runner is in flow, because a coach that talks constantly is a
coach the runner mutes.

It consumes `engine.run_state.RunnerState` and emits at most one `CueEvent` per
telemetry tick. The event carries only a deterministic numeric payload; the
persona wording is applied later by `coaching.cue_library`. No LLM here.

Anti-irritation design (the core of the spec's "user must not get irritated"):
  1. MIN_GAP_S minimum spacing between any two spoken cues (safety bypasses it).
  2. A priority ladder: SAFETY > PACE_CORRECTION > MILESTONE > MOTIVATION.
  3. Per-trigger cooldowns so the same nudge never repeats in a tight window.
  4. Flow-state gating: when the runner is locked in (need == NONE), only
     milestones and safety may speak; coaching chatter is suppressed.
  5. One-shot markers (start, halfway, each km, final push, finish) fire once.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from engine.pace_calculator import format_pace
from engine import run_state as rs


# --------------------------------------------------------------------------- #
# Triggers + priorities
# --------------------------------------------------------------------------- #
CUE_RUN_START = "run_start"
CUE_KM_MILESTONE = "km_milestone"
CUE_HALFWAY = "halfway"
CUE_SETTLE_PACE = "settle_pace"        # reel back an over-fast start
CUE_HOLD_PACE = "hold_pace"            # you're drifting up in effort, hold form
CUE_SUPPORT_FADE = "support_fade"      # fatigue/positive-split — empathy + actionable
CUE_WALL_SUPPORT = "wall_support"      # glycogen-depletion zone on long runs
CUE_HR_SAFETY = "hr_safety"            # heart rate in safety territory — ease off
CUE_FINAL_PUSH = "final_push"
CUE_FINISH = "finish"

PRIORITY = {
    CUE_HR_SAFETY: 100,     # safety always wins
    CUE_SETTLE_PACE: 70,
    CUE_SUPPORT_FADE: 68,
    CUE_HOLD_PACE: 66,
    CUE_WALL_SUPPORT: 64,
    CUE_FINISH: 60,
    CUE_FINAL_PUSH: 55,
    CUE_HALFWAY: 50,
    CUE_KM_MILESTONE: 48,
    CUE_RUN_START: 90,      # the opening cue should always land
}

# Timing constants (seconds)
MIN_GAP_S = 60.0            # default minimum gap between spoken cues
SAFETY_COOLDOWN_S = 45.0    # safety re-fires (still escalating) — urgent but not spam
REACTIVE_COOLDOWN_S = 100.0  # same coaching nudge won't repeat inside this window


@dataclass
class CueEvent:
    trigger: str
    priority: int
    t_s: float
    phase: str
    need: str
    payload: dict = field(default_factory=dict)
    reason: str = ""


class CuePlanner:
    """Stateful per-run planner. Create one per run; feed it telemetry ticks.

    Keeping state here (last spoken time, which one-shots/kms have fired, per-
    trigger cooldowns) is what lets the engine enforce spacing and never repeat
    a marker — the device just calls `evaluate()` on every sample.
    """

    def __init__(self, planned: dict, zones: dict, profile: dict):
        self.planned = planned
        self.zones = zones
        self.profile = profile
        self.last_cue_t: Optional[float] = None
        self.fired_once: set = set()          # one-shot triggers already spoken
        self.fired_km: set = set()            # km markers already spoken
        self.last_by_trigger: dict = {}       # trigger -> last t_s it fired
        self.count_by_trigger: dict = {}      # trigger -> times spoken (rotation + back-off)
        self.safety_seen = False              # a redline happened -> no aggressive push later

    # -- timing helpers ----------------------------------------------------- #
    def _gap_ok(self, t_s: float) -> bool:
        return self.last_cue_t is None or (t_s - self.last_cue_t) >= MIN_GAP_S

    def _cooldown_ok(self, trigger: str, t_s: float, cooldown: float) -> bool:
        last = self.last_by_trigger.get(trigger)
        return last is None or (t_s - last) >= cooldown

    def _reactive_ready(self, trigger: str, t_s: float, base: float) -> bool:
        """A reactive nudge backs off the more it has already been said: a coach
        mentions a fading pace once, maybe twice — they don't repeat it every
        90 seconds. Effective cooldown grows with each repeat so the same advice
        thins out instead of nagging."""
        count = self.count_by_trigger.get(trigger, 0)
        return self._cooldown_ok(trigger, t_s, base + 70.0 * count)

    def _commit(self, ev: CueEvent) -> CueEvent:
        # Rotate phrasing by how many times THIS trigger has fired, so repeats
        # never use the same sentence twice in a row.
        ev.payload["variant"] = self.count_by_trigger.get(ev.trigger, 0)
        self.last_cue_t = ev.t_s
        self.last_by_trigger[ev.trigger] = ev.t_s
        self.count_by_trigger[ev.trigger] = self.count_by_trigger.get(ev.trigger, 0) + 1
        return ev

    # -- main entry --------------------------------------------------------- #
    def evaluate(self, snap: "rs.RunSnapshot", state: "rs.RunnerState") -> Optional[CueEvent]:
        """Return the single best cue to speak now, or None for silence."""
        t = snap.t_s
        target_pace = self.planned.get("target_pace_s_per_km")

        def payload() -> dict:
            return {
                "km_done": round(snap.dist_m / 1000.0, 2),
                "km_target": round((self.planned.get("target_distance_m") or 0) / 1000.0, 2),
                "km_left": round(max(0.0, (self.planned.get("target_distance_m") or 0) - snap.dist_m) / 1000.0, 2),
                "cur_pace": format_pace(int(snap.cur_pace_s_per_km)) if snap.cur_pace_s_per_km else None,
                "avg_pace": format_pace(int(snap.avg_pace_s_per_km)) if snap.avg_pace_s_per_km else None,
                "target_pace": format_pace(int(target_pace)) if target_pace else None,
                "pace_delta_s": state.pace_delta_s_per_km,
                "hr": snap.hr,
                "hr_pct": state.hr_pct_max,
                "run_type": self.planned.get("type"),
                "phase": state.phase,
            }

        # 1) SAFETY — bypasses the spacing gate; re-fires on a sustained redline
        #    but escalates + rotates wording so it urges caution without spamming.
        if state.need == rs.NEED_SAFETY:
            self.safety_seen = True  # a redline occurred -> suppress aggressive push later
            if self._reactive_ready(CUE_HR_SAFETY, t, SAFETY_COOLDOWN_S):
                return self._commit(CueEvent(
                    CUE_HR_SAFETY, PRIORITY[CUE_HR_SAFETY], t, state.phase, state.need,
                    payload(), reason="heart rate in safety zone"))
            return None  # already warned very recently

        # Build the candidate set; each candidate is (trigger, eligible_bool).
        candidates = []

        # 2) One-shot opening cue (always lands; not gated by MIN_GAP).
        if CUE_RUN_START not in self.fired_once and t <= 20 and snap.dist_m < 150:
            self.fired_once.add(CUE_RUN_START)
            return self._commit(CueEvent(
                CUE_RUN_START, PRIORITY[CUE_RUN_START], t, state.phase, state.need,
                payload(), reason="run started"))

        # 3) Finish marker (one-shot).
        if state.phase == rs.PHASE_DONE and CUE_FINISH not in self.fired_once:
            self.fired_once.add(CUE_FINISH)
            return self._commit(CueEvent(
                CUE_FINISH, PRIORITY[CUE_FINISH], t, state.phase, state.need,
                payload(), reason="planned work complete"))

        # 4) Distance & structural milestones (one-shot, welcome progress markers).
        km_complete = int(snap.dist_m // 1000)
        if km_complete >= 1 and km_complete not in self.fired_km:
            candidates.append((CUE_KM_MILESTONE, True))
        if CUE_HALFWAY not in self.fired_once and state.progress >= 0.5:
            candidates.append((CUE_HALFWAY, True))
        # Final push is an effort-UP cue — never give it after a redline this run.
        if CUE_FINAL_PUSH not in self.fired_once and state.phase == rs.PHASE_FINAL_PUSH \
                and not self.safety_seen:
            candidates.append((CUE_FINAL_PUSH, True))

        # 5) Reactive coaching cues — suppressed entirely when in flow (need NONE),
        #    and each backs off the more it has already been said (anti-nag).
        if state.need != rs.NEED_NONE:
            if state.need == rs.NEED_SETTLE and self._reactive_ready(CUE_SETTLE_PACE, t, REACTIVE_COOLDOWN_S):
                candidates.append((CUE_SETTLE_PACE, True))
            elif state.need == rs.NEED_SUPPORT:
                if state.wall_risk and self._reactive_ready(CUE_WALL_SUPPORT, t, REACTIVE_COOLDOWN_S + 40):
                    candidates.append((CUE_WALL_SUPPORT, True))
                elif self._reactive_ready(CUE_SUPPORT_FADE, t, REACTIVE_COOLDOWN_S):
                    candidates.append((CUE_SUPPORT_FADE, True))
            elif state.need == rs.NEED_HOLD and state.hr_status == rs.HR_HIGH \
                    and self._reactive_ready(CUE_HOLD_PACE, t, REACTIVE_COOLDOWN_S):
                candidates.append((CUE_HOLD_PACE, True))

        # Choose the highest-priority eligible candidate that passes the gap gate.
        eligible = [c for c, ok in candidates if ok]
        if not eligible:
            return None
        eligible.sort(key=lambda c: PRIORITY.get(c, 0), reverse=True)

        for trigger in eligible:
            # Milestones and reactive cues both respect the spacing gate so the
            # coach never machine-guns two cues back to back.
            if not self._gap_ok(t):
                return None
            if trigger == CUE_KM_MILESTONE:
                self.fired_km.add(km_complete)
            else:
                self.fired_once.add(trigger)
            return self._commit(CueEvent(
                trigger, PRIORITY.get(trigger, 0), t, state.phase, state.need,
                payload(), reason=f"{trigger} due"))
        return None
