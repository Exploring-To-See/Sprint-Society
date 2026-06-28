"""Behavior tests for the Rs.9 one-way coach engine.

Runs with pytest, or standalone:  python tests/test_one_way_coach.py

Locks the properties that matter for a one-way, non-irritating, grounded coach:
  * safety cues fire and bypass the spacing gate;
  * the coach stays SILENT when the runner is in flow;
  * cues are spaced (anti-nag) and repeated nudges back off + change wording;
  * no cue is a two-way question;
  * post-run split detection is correct;
  * spoken numbers are the engine's numbers (grounding).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine import run_state as rs  # noqa: E402
from engine.run_state import RunSnapshot, infer_state  # noqa: E402
from engine.run_cues import CuePlanner, CUE_HR_SAFETY, CUE_RUN_START, MIN_GAP_S  # noqa: E402
from engine.run_analysis import analyze_run  # noqa: E402
from coaching import cue_library as lib  # noqa: E402
from coaching.one_way_coach import run_cue_stream  # noqa: E402


PLANNED = {"type": "easy", "target_distance_m": 5000, "target_pace_s_per_km": 360}
ZONES = {"easy_pace_per_km": 360, "tempo_pace_per_km": 300,
         "interval_pace_per_km": 270, "race_pace_per_km": 312}
PROFILE = {"age": 30, "gender": "male", "max_hr": 190, "level": "beginner"}


def test_safety_overrides_and_bypasses_gap():
    planner = CuePlanner(PLANNED, ZONES, PROFILE)
    # prime a recent cue so the spacing gate would normally block
    planner.last_cue_t = 300.0
    # HR ~98% of max -> very high -> safety
    snap = RunSnapshot(t_s=305, dist_m=2500, cur_pace_s_per_km=360,
                       avg_pace_s_per_km=360, hr=187, moving=True)
    state = infer_state(snap, PLANNED, PROFILE)
    assert state.need == rs.NEED_SAFETY
    ev = planner.evaluate(snap, state)
    assert ev is not None and ev.trigger == CUE_HR_SAFETY  # fired despite 5s gap


def test_in_flow_silence():
    # Steady phase, on target, HR fine -> locked in -> coach says nothing.
    snap = RunSnapshot(t_s=1000, dist_m=2300, cur_pace_s_per_km=360,
                       avg_pace_s_per_km=360, hr=150, moving=True)
    state = infer_state(snap, PLANNED, PROFILE)
    assert state.phase == rs.PHASE_STEADY
    assert state.need == rs.NEED_NONE

    planner = CuePlanner(PLANNED, ZONES, PROFILE)
    planner.last_cue_t = 990.0          # a cue 10s ago
    planner.fired_km.add(2)             # km-2 marker already spoken
    assert planner.evaluate(snap, state) is None


def test_cues_are_spaced():
    planner = CuePlanner(PLANNED, ZONES, PROFILE)
    # opening cue
    s0 = RunSnapshot(t_s=5, dist_m=10, cur_pace_s_per_km=360, avg_pace_s_per_km=360, hr=130)
    assert planner.evaluate(s0, infer_state(s0, PLANNED, PROFILE)).trigger == CUE_RUN_START
    # a km marker becomes due only 30s later -> must be suppressed by the gap
    s1 = RunSnapshot(t_s=35, dist_m=1000, cur_pace_s_per_km=360, avg_pace_s_per_km=360, hr=140)
    assert planner.evaluate(s1, infer_state(s1, PLANNED, PROFILE)) is None


def test_no_two_way_questions_in_cues():
    for trig, by_persona in lib.CUE_TEMPLATES.items():
        for persona, variants in by_persona.items():
            for line in variants:
                assert "?" not in line, f"two-way question in {trig}/{persona}: {line}"
                assert "yes or no" not in line.lower()


def test_post_run_detects_positive_split():
    # Build a fading trace: even early, slow late -> positive split.
    samples, t, d = [], 0.0, 0.0
    while d < 5000:
        frac = d / 5000.0
        pace = 360 if frac < 0.5 else 410        # clear late slowdown
        d += (1000.0 / pace) * 5.0
        t += 5.0
        samples.append(RunSnapshot(t_s=t, dist_m=min(d, 5000),
                                   cur_pace_s_per_km=pace,
                                   avg_pace_s_per_km=t / (d / 1000.0), hr=150))
    a = analyze_run(PLANNED, samples, ZONES, PROFILE, history=[])
    assert a["split_shape"] == "positive"
    assert a["cold_start"] is True       # no history supplied


def test_spoken_numbers_are_grounded():
    # The pre-run/cue pace must be the engine's target pace, never invented.
    samples = [RunSnapshot(t_s=5, dist_m=10, cur_pace_s_per_km=360, avg_pace_s_per_km=360, hr=130)]
    stream = run_cue_stream(PLANNED, ZONES, PROFILE, samples, "scientist")
    assert stream, "expected an opening cue"
    # 360 s/km -> 6:00/km; that exact string should appear, nothing else invented
    assert "6:00/km" in stream[0][1]


def test_variant_rotation_changes_wording():
    # Two consecutive same-trigger fires should not be identical text.
    from engine.run_cues import CueEvent, CUE_SUPPORT_FADE
    e0 = CueEvent(CUE_SUPPORT_FADE, 1, 100, rs.PHASE_LATE, rs.NEED_SUPPORT,
                  {"variant": 0, "pace_delta_s": 20})
    e1 = CueEvent(CUE_SUPPORT_FADE, 1, 260, rs.PHASE_LATE, rs.NEED_SUPPORT,
                  {"variant": 1, "pace_delta_s": 20})
    assert lib.render_cue(e0, "warrior") != lib.render_cue(e1, "warrior")


def _run_all():
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"  PASS  {fn.__name__}")
    print(f"\n{len(fns)} tests passed.")


if __name__ == "__main__":
    _run_all()
