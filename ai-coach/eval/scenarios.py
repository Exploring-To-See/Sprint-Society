"""Runner-scenario matrix for evaluating the one-way coach.

Each scenario is a deterministic telemetry trace representing a real situation a
runner gets into mid-run (hot start, fade, heart-rate redline, the wall, a clean
even run, ...), across runner levels and run types. The eval harness replays each
scenario through the coach for all four personas and scores the responses.

`expect_triggers` / `forbid_triggers` encode what a good coach MUST and MUST NOT
say in that situation; `in_flow` marks scenarios where the coach should mostly
stay quiet; `expect_split` is the post-run pacing shape we should detect.
"""

from __future__ import annotations

from engine.run_state import RunSnapshot
from engine.pace_calculator import calculate_pace_zones
from engine import run_cues as rc


def _zone_pace(profile: dict, run_type: str) -> int:
    z = calculate_pace_zones(profile)
    return {
        "easy": z["easy_pace_per_km"], "long": z["easy_pace_per_km"],
        "tempo": z["tempo_pace_per_km"], "intervals": z["interval_pace_per_km"],
        "race": z["race_pace_per_km"],
    }.get(run_type, z["easy_pace_per_km"])


def _trace(target, total_m, pace_fn, hr_fn, dt=10.0):
    t, d, out = 0.0, 0.0, []
    while d < total_m and t < 4 * 3600:
        frac = d / total_m
        pace = pace_fn(frac, target)
        d += (1000.0 / pace) * dt
        t += dt
        avg = t / (d / 1000.0) if d > 0 else None
        out.append(RunSnapshot(
            t_s=t, dist_m=min(d, total_m), cur_pace_s_per_km=pace,
            avg_pace_s_per_km=avg, hr=hr_fn(t, frac), cadence=174, moving=True))
    return out


# pace shapes ---------------------------------------------------------------- #
def _even(frac, tgt):       return tgt + 2
def _hot(frac, tgt):        return (tgt - 28) if frac < 0.18 else tgt + 2
def _fade(frac, tgt):       return tgt + 2 if frac < 0.5 else tgt + 2 + (frac - 0.5) / 0.5 * 60
def _neg(frac, tgt):        return tgt + 16 if frac < 0.5 else tgt - 12

# hr shapes (relative to the runner's max HR so they sit in the right zone) --- #
def _hr_calm(maxhr):  return lambda t, f: int(maxhr * (0.62 + 0.11 * min(1.0, f / 0.5)))  # easy zone, in-flow
def _hr_drift(maxhr): return lambda t, f: int(maxhr * (0.70 + f * 0.20))                  # climbs over the cap
def _hr_red(maxhr):   return lambda t, f: int(maxhr * (0.99 if 0.45 < f < 0.55 else 0.74))  # spike mid-run


def build_scenarios():
    beginner = {"age": 34, "gender": "female", "weight_kg": 68, "height_cm": 165,
                "fitness_level": "lightly_active", "level": "beginner", "max_hr": 186}
    inter = {"age": 29, "gender": "male", "weight_kg": 72, "height_cm": 176,
             "fitness_level": "active", "level": "intermediate", "max_hr": 191, "recent_5k_time": 24.0}
    adv = {"age": 27, "gender": "male", "weight_kg": 66, "height_cm": 178,
           "fitness_level": "very_active", "level": "advanced", "max_hr": 193, "recent_5k_time": 19.0}

    S = []

    def add(sid, title, profile, run_type, total_m, pace_fn, hr_fn,
            surface, expect=(), forbid=(), in_flow=False, expect_split=None):
        target = _zone_pace(profile, run_type)
        planned = {"type": run_type, "target_distance_m": total_m, "target_pace_s_per_km": target}
        samples = _trace(target, total_m, pace_fn, hr_fn)
        S.append({"id": sid, "title": title, "profile": profile, "planned": planned,
                  "samples": samples, "surface": surface, "expect_triggers": set(expect),
                  "forbid_triggers": set(forbid), "in_flow": in_flow, "expect_split": expect_split})

    mh = lambda p: p.get("max_hr", 190)

    # --- in-flow / clean runs: coach should be sparse, no corrections --------
    add("even_easy_beg", "Beginner clean even 5k easy", beginner, "easy", 5000,
        _even, _hr_calm(mh(beginner)), "during",
        expect=[rc.CUE_RUN_START, rc.CUE_FINISH], forbid=[rc.CUE_SETTLE_PACE, rc.CUE_HR_SAFETY], in_flow=True)
    add("even_easy_int", "Intermediate clean even 8k easy", inter, "easy", 8000,
        _even, _hr_calm(mh(inter)), "during",
        expect=[rc.CUE_RUN_START, rc.CUE_FINISH], forbid=[rc.CUE_HR_SAFETY], in_flow=True)

    # --- hot start: must reel them in --------------------------------------
    add("hot_easy_beg", "Beginner goes out too fast", beginner, "easy", 5000,
        _hot, _hr_calm(mh(beginner)), "during", expect=[rc.CUE_SETTLE_PACE])
    add("hot_tempo_int", "Intermediate over-cooks tempo start", inter, "tempo", 6000,
        _hot, _hr_drift(mh(inter)), "during", expect=[rc.CUE_SETTLE_PACE])

    # --- late fade: support, never "speed up" -------------------------------
    add("fade_easy_beg", "Beginner fades late", beginner, "easy", 5000,
        _fade, _hr_drift(mh(beginner)), "during", expect=[rc.CUE_SUPPORT_FADE])
    add("fade_long_int", "Intermediate fades on a long run", inter, "long", 12000,
        _fade, _hr_drift(mh(inter)), "during", expect=[rc.CUE_SUPPORT_FADE])

    # --- heart-rate safety: must fire safety, must NOT push -----------------
    add("redline_beg", "Beginner heart rate redlines mid-run", beginner, "easy", 5000,
        _even, _hr_red(mh(beginner)), "during",
        expect=[rc.CUE_HR_SAFETY], forbid=[rc.CUE_FINAL_PUSH])
    add("redline_int", "Intermediate redlines on tempo", inter, "tempo", 6000,
        _even, _hr_red(mh(inter)), "during", expect=[rc.CUE_HR_SAFETY])

    # --- hr drift (not redline): hold/relax cue -----------------------------
    add("drift_int", "Intermediate effort drifts up", inter, "easy", 8000,
        _even, _hr_drift(mh(inter)), "during", expect=[rc.CUE_HOLD_PACE], forbid=[rc.CUE_HR_SAFETY])

    # --- long-run wall ------------------------------------------------------
    add("wall_adv", "Advanced hits the wall on a long run", adv, "long", 32000,
        _fade, _hr_drift(mh(adv)), "during", expect=[rc.CUE_WALL_SUPPORT])

    # --- post-run split detection ------------------------------------------
    add("post_fade_beg", "Post-run: positive split", beginner, "easy", 5000,
        _fade, _hr_drift(mh(beginner)), "post", expect_split="positive")
    add("post_neg_int", "Post-run: negative split", inter, "easy", 8000,
        _neg, _hr_calm(mh(inter)), "post", expect_split="negative")
    add("post_even_adv", "Post-run: even split", adv, "easy", 10000,
        _even, _hr_calm(mh(adv)), "post", expect_split="even")

    # --- pre-run brief ------------------------------------------------------
    add("pre_easy_beg", "Pre-run brief, beginner easy", beginner, "easy", 5000,
        _even, _hr_calm(mh(beginner)), "pre")

    return S


PERSONAS = ("scientist", "energizer", "warrior", "sage")
