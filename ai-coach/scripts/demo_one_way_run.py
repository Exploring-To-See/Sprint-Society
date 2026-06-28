"""Demo / smoke test for the Rs.9 one-way coach.

Simulates a 5 km easy run with a realistic shape — an over-eager fast start, a
settle, a steady middle, a late fade, and a finish, with heart rate drifting up —
then prints, for each of the four personas:
    * the PRE-RUN brief,
    * the timed DURING-RUN cue stream (mm:ss -> spoken line),
    * the POST-RUN inference.

Run from the repo root:   python scripts/demo_one_way_run.py

No API key, no network, no TTS needed — this exercises the responses + timing
logic deterministically.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.pace_calculator import calculate_pace_zones, format_pace  # noqa: E402
from engine.run_state import RunSnapshot  # noqa: E402
from coaching.one_way_coach import pre_run_brief, run_cue_stream, post_run_report  # noqa: E402


def simulate_5k_easy(target_pace_s_per_km: int):
    """Build a deterministic telemetry trace (sampled every 5s) for a 5 km run.

    Pace shape (sec/km), by fraction of distance:
      0.00-0.12  fast start  : target - 22  (adrenaline overpace)
      0.12-0.30  settling    : eases toward target
      0.30-0.70  steady      : ~target (in flow)
      0.70-1.00  fade        : target + up to 35 (fatigue / positive split)
    HR drifts 128 -> ~172 across the run.
    """
    target = target_pace_s_per_km
    total_d = 5000.0
    dt = 5.0
    t = 0.0
    dist = 0.0
    samples = []

    def pace_at(frac):
        if frac < 0.12:
            return target - 22
        if frac < 0.30:
            # linear ease from (target-22) back to target
            k = (frac - 0.12) / 0.18
            return (target - 22) + k * 22
        if frac < 0.70:
            return target + 3
        k = (frac - 0.70) / 0.30
        return target + 3 + k * 32

    while dist < total_d and t < 3600:
        frac = dist / total_d
        cur_pace = pace_at(frac)
        speed = 1000.0 / cur_pace  # m/s
        dist += speed * dt
        t += dt
        avg_pace = t / (dist / 1000.0) if dist > 0 else None
        # HR drifts up with time and effort
        hr = int(128 + min(44, (t / 60.0) * 1.9 + max(0, (cur_pace - target)) * 0.2))
        samples.append(RunSnapshot(
            t_s=t, dist_m=min(dist, total_d),
            cur_pace_s_per_km=cur_pace, avg_pace_s_per_km=avg_pace,
            hr=hr, cadence=174, moving=True,
        ))
    return samples


def mmss(seconds: float) -> str:
    seconds = int(seconds)
    return f"{seconds // 60:02d}:{seconds % 60:02d}"


def main():
    profile = {
        "age": 30, "gender": "male", "weight_kg": 72, "height_cm": 175,
        "fitness_level": "active", "recent_5k_time": 28.0,  # minutes
        "level": "beginner",
    }
    zones = calculate_pace_zones(profile)
    target_pace = zones["easy_pace_per_km"]

    planned = {
        "type": "easy",
        "target_distance_m": 5000,
        "target_pace_s_per_km": target_pace,
    }

    # A little synthetic history so improvement analysis has something to compare.
    history = [
        {"type": "easy", "avg_pace_s_per_km": target_pace + 8},
        {"type": "easy", "avg_pace_s_per_km": target_pace + 12},
        {"type": "easy", "avg_pace_s_per_km": target_pace + 6},
    ]

    samples = simulate_5k_easy(target_pace)

    print("=" * 74)
    print(f"  ONE-WAY COACH DEMO — 5 km easy run")
    print(f"  Easy target pace: {format_pace(target_pace)}  |  VDOT {zones['vdot']}  |  "
          f"samples: {len(samples)} (every 5s)")
    print("=" * 74)

    for persona in ("scientist", "energizer", "warrior", "sage"):
        print(f"\n\n########################  {persona.upper()}  ########################")
        print("\n-- PRE-RUN BRIEF --")
        print("  " + pre_run_brief(planned, zones, profile, persona))

        print("\n-- DURING-RUN CUES (time -> spoken line) --")
        stream = run_cue_stream(planned, zones, profile, samples, persona)
        for t_s, text in stream:
            print(f"  [{mmss(t_s)}]  {text}")
        print(f"  ({len(stream)} cues over the run)")

        print("\n-- POST-RUN INFERENCE --")
        print("  " + post_run_report(planned, samples, zones, profile, history, persona))

    print("\n" + "=" * 74)
    print("  Demo complete. Cues are timed, spaced, persona-voiced, and grounded")
    print("  only in engine numbers (no invented figures, no live web, no chat).")
    print("=" * 74)


if __name__ == "__main__":
    main()
