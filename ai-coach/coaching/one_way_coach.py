"""Orchestrator for the Rs.9 one-way coach.

Public surface (everything the app/UI needs for the one-way plan):
  * pre_run_brief(...)   -> str          : what the coach says before the run
  * run_cue_stream(...)  -> [(t_s, str)] : the timed during-run cues (the core)
  * post_run_report(...) -> str          : grounded inference after the run

One-way by construction: the runner never sends input; every output is derived
from telemetry + plan + profile + history. Numbers come from the engines; words
come from the persona cue library. No network, no LLM required for it to run.
"""

from __future__ import annotations

from typing import List, Tuple

from engine.run_state import RunSnapshot, infer_state
from engine.run_cues import CuePlanner
from engine.run_analysis import analyze_run
from coaching import cue_library as lib


def pre_run_brief(planned: dict, zones: dict, profile: dict, persona: str) -> str:
    """Build the pre-run brief. target_pace is taken from the plan, or derived
    from the runner's zones for the run type so the number is always engine-grounded."""
    target_pace = planned.get("target_pace_s_per_km") or _zone_pace_for_type(zones, planned.get("type"))
    data = {
        "type": planned.get("type", "easy"),
        "target_km": round((planned.get("target_distance_m") or 0) / 1000.0, 1) or "your planned",
        "target_pace": _fmt(target_pace),
    }
    return lib.pre_run_brief_text(data, persona)


def run_cue_stream(planned: dict, zones: dict, profile: dict,
                   samples: List[RunSnapshot], persona: str) -> List[Tuple[float, str]]:
    """Feed the telemetry trace through the state model + cue planner and return
    the list of (elapsed_seconds, spoken_text) cues — i.e. the responses AND
    their timing. In production the device streams snapshots live and the same
    planner is called per tick; here we replay a recorded/simulated trace."""
    # Ensure the planner has a target pace to judge against.
    planned = dict(planned)
    if not planned.get("target_pace_s_per_km"):
        planned["target_pace_s_per_km"] = _zone_pace_for_type(zones, planned.get("type"))

    planner = CuePlanner(planned, zones, profile)
    out: List[Tuple[float, str]] = []
    for snap in samples:
        state = infer_state(snap, planned, profile)
        event = planner.evaluate(snap, state)
        if event is not None:
            out.append((round(event.t_s, 1), lib.render_cue(event, persona)))
    return out


def post_run_report(planned: dict, samples: List[RunSnapshot], zones: dict,
                    profile: dict, history: List[dict], persona: str) -> str:
    analysis = analyze_run(planned, samples, zones, profile, history)
    return lib.post_run_text(analysis, persona)


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def _zone_pace_for_type(zones: dict, run_type: str):
    if not zones:
        return None
    return {
        "easy": zones.get("easy_pace_per_km"),
        "long": zones.get("easy_pace_per_km"),
        "tempo": zones.get("tempo_pace_per_km"),
        "intervals": zones.get("interval_pace_per_km"),
        "race": zones.get("race_pace_per_km"),
    }.get(run_type, zones.get("easy_pace_per_km"))


def _fmt(seconds_per_km):
    if not seconds_per_km:
        return "a comfortable pace"
    from engine.pace_calculator import format_pace
    return format_pace(int(seconds_per_km))
