"""Deterministic post-run analysis for the one-way coach.

Produces the *numbers* the post-run inference is built from: how the run was
paced (even / negative / positive split), how closely it tracked the plan, and
whether the runner is improving versus their own history. No LLM — these are the
grounded facts the persona narrates in `coaching.cue_library.post_run_text`.

If there isn't enough history to judge a trend, we say so (cold_start) rather
than inventing one — the anti-hallucination rule applied to progress claims.
"""

from __future__ import annotations

from typing import List, Optional

from engine.pace_calculator import format_pace
from engine.run_state import RunSnapshot


def _total_distance(samples: List[RunSnapshot]) -> float:
    return max((s.dist_m for s in samples), default=0.0)


def _total_time(samples: List[RunSnapshot]) -> float:
    return max((s.t_s for s in samples), default=0.0)


def _avg_pace_s_per_km(dist_m: float, time_s: float) -> Optional[float]:
    if dist_m <= 0:
        return None
    return time_s / (dist_m / 1000.0)


def _split_shape(samples: List[RunSnapshot], total_d: float):
    """Compare first-half vs second-half average pace by distance.

    Returns (shape, first_pace, second_pace). shape in negative|even|positive.
    'negative' = second half FASTER (good); 'positive' = second half slower (fade).
    """
    if total_d <= 0 or len(samples) < 4:
        return None, None, None
    mid = total_d / 2.0
    first = [s for s in samples if s.dist_m <= mid]
    second = [s for s in samples if s.dist_m > mid]
    if not first or not second:
        return None, None, None

    def half_pace(seg, d_lo, d_hi):
        d = d_hi - d_lo
        t = seg[-1].t_s - seg[0].t_s
        if d <= 0:
            return None
        return t / (d / 1000.0)

    first_pace = half_pace(first, first[0].dist_m, first[-1].dist_m)
    second_pace = half_pace(second, second[0].dist_m, second[-1].dist_m)
    if not first_pace or not second_pace:
        return None, first_pace, second_pace

    diff = second_pace - first_pace  # +ve => second half slower
    tol = max(8.0, 0.03 * first_pace)
    if diff < -tol:
        return "negative", first_pace, second_pace
    if diff > tol:
        return "positive", first_pace, second_pace
    return "even", first_pace, second_pace


def _adherence_pct(samples: List[RunSnapshot], target_pace: Optional[float]) -> Optional[float]:
    if not target_pace:
        return None
    paced = [s for s in samples if (s.cur_pace_s_per_km or s.avg_pace_s_per_km)]
    if not paced:
        return None
    tol = max(12.0, 0.06 * target_pace)
    on = 0
    for s in paced:
        p = s.cur_pace_s_per_km or s.avg_pace_s_per_km
        if abs(p - target_pace) <= tol:
            on += 1
    return 100.0 * on / len(paced)


def analyze_improvement(avg_pace: Optional[float], run_type: str, history: List[dict]):
    """Compare this run's average pace to the runner's recent same-type runs.

    `history` items: {"type": str, "avg_pace_s_per_km": float}. Needs at least
    3 comparable runs to claim a trend; otherwise returns (None, cold_start=True).
    Returns (improvement_text_or_None, cold_start_bool).
    """
    if avg_pace is None:
        return None, True
    comparable = [h["avg_pace_s_per_km"] for h in history
                  if h.get("type") == run_type and h.get("avg_pace_s_per_km")]
    if len(comparable) < 3:
        return None, True
    baseline = sorted(comparable)[len(comparable) // 2]  # median
    delta = baseline - avg_pace  # +ve => faster than baseline (improvement)
    if abs(delta) < max(5.0, 0.02 * baseline):
        return f"This is right in line with your recent {run_type} runs - consistency is building.", False
    if delta > 0:
        return (f"That's about {int(round(delta))}s/km faster than your recent {run_type} average — "
                f"clear improvement."), False
    return (f"A touch slower than your recent {run_type} average (~{int(round(abs(delta)))}s/km) — "
            f"could be fatigue, heat, or terrain; one run doesn't define a trend."), False


def analyze_run(planned: dict, samples: List[RunSnapshot], zones: dict,
                profile: dict, history: Optional[List[dict]] = None) -> dict:
    """Full deterministic post-run summary used to build the spoken inference."""
    history = history or []
    total_d = _total_distance(samples)
    total_t = _total_time(samples)
    avg_pace = _avg_pace_s_per_km(total_d, total_t)
    target_pace = planned.get("target_pace_s_per_km")

    shape, first_pace, second_pace = _split_shape(samples, total_d)
    adherence = _adherence_pct(samples, target_pace)
    improvement, cold_start = analyze_improvement(avg_pace, planned.get("type", "easy"), history)

    return {
        "km": round(total_d / 1000.0, 2),
        "duration_s": round(total_t),
        "avg_pace": format_pace(int(avg_pace)) if avg_pace else None,
        "avg_pace_s_per_km": round(avg_pace, 1) if avg_pace else None,
        "type": planned.get("type", "easy"),
        "split_shape": shape,
        "first_half_pace": format_pace(int(first_pace)) if first_pace else None,
        "second_half_pace": format_pace(int(second_pace)) if second_pace else None,
        "adherence_pct": round(adherence, 1) if adherence is not None else None,
        "improvement": improvement,
        "cold_start": cold_start,
    }
