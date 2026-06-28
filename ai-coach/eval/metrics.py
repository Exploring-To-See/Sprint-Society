"""Deterministic evaluation metrics for the one-way coach.

For a system whose real-time outputs are templated and filled only with engine
numbers, deterministic metrics are the *right* evaluation — they prove the
properties that matter (grounding, safety, timing, persona, non-irritation)
exactly and reproducibly, where an LLM-judge would only add noise and a key
dependency. (DeepEval/RAGAS LLM metrics are better suited to the future free-text
Pro chat; hooks for them are noted in run_eval.py.)

Each metric returns a score in [0,1] over the applicable results plus the list of
failing cases, and has a pass threshold.
"""

from __future__ import annotations

import re
from typing import List

from engine import run_cues as rc
from engine.run_cues import PRIORITY, MIN_GAP_S


# Persona signature lexicons (>=1 must appear in that persona's spoken output).
PERSONA_MARKERS = {
    "scientist": ["metric", "data", "efficien", "controlled", "calibrat", "even",
                  "physiolog", "drift", "maintain", "cadence", "turnover", "analysis"],
    "energizer": ["!", "let's", "love", "amazing", " go", "energy", "strong",
                  "champion", "boom", "great", "earned", "smile", "owning"],
    "warrior":   ["disciplin", "execute", "mission", "hold the line", "grind", "dig",
                  "standard", "drive", "refuse", "no hero", "control", "debrief", "banked"],
    "sage":      ["breath", "patient", "season", "gentl", "calm", "trust", "rhythm",
                  "present", "journey", "steady", "soften", "passing", "honour"],
}

# Words that would be UNSAFE to say to a redlining / struggling runner.
_PUSH_WORDS = ["lift effort", "increase turnover", "faster", "attack", "empty the tank",
               "everything you've got", "light it up", "push through", "victory lap"]

_THRESHOLDS = {
    "grounding": 1.0,
    "one_way": 1.0,
    "safety_recall": 1.0,
    "no_unsafe_advice": 1.0,
    "spacing": 1.0,
    "in_flow_silence": 1.0,
    "anti_repetition": 0.95,
    "persona_consistency": 0.90,
    "brevity": 0.95,
    "trigger_coverage": 0.90,
    "split_accuracy": 0.90,
    "pre_run_grounded": 1.0,
}


# --------------------------------------------------------------------------- #
# number grounding
# --------------------------------------------------------------------------- #
def _allowed_numbers(payload: dict):
    paces, nums = set(), set()
    for k in ("target_pace", "cur_pace", "avg_pace"):
        v = payload.get(k)
        if v:
            paces.add(v.replace("/km", ""))
    for k in ("km_done", "km_left", "km_target"):
        v = payload.get(k)
        if v is not None:
            nums.add(str(v))
            nums.add(str(int(v)))
    if payload.get("pace_delta_s") is not None:
        nums.add(str(abs(int(round(payload["pace_delta_s"])))))
    if payload.get("hr") is not None:
        nums.add(str(payload["hr"]))
    if payload.get("hr_pct") is not None:
        nums.add(str(int(round(payload["hr_pct"] * 100))))
    return paces, nums


def _ungrounded_numbers(text: str, payload: dict):
    paces, nums = _allowed_numbers(payload)
    bad = []
    work = text
    for m in re.findall(r"\d{1,2}:\d{2}", work):
        if m not in paces:
            bad.append(m)
    work = re.sub(r"\d{1,2}:\d{2}/?k?m?", " ", work)          # strip paces
    for m in re.findall(r"\d+(?:\.\d+)?", work):
        if m not in nums:
            bad.append(m)
    return bad


# --------------------------------------------------------------------------- #
# per-result checks (a result = one scenario rendered for one persona)
# --------------------------------------------------------------------------- #
def _during_cues(result):
    return result.get("cues", [])


def m_grounding(result):
    bad = []
    for c in _during_cues(result):
        u = _ungrounded_numbers(c["text"], c["payload"])
        if u:
            bad.append((c["text"], u))
    return (len(bad) == 0), bad


def m_one_way(result):
    bad = [c["text"] for c in _during_cues(result) if "?" in c["text"]]
    return (len(bad) == 0), bad


def m_spacing(result):
    last = None
    bad = []
    for c in _during_cues(result):
        if c["trigger"] == rc.CUE_HR_SAFETY:   # safety may bypass spacing
            last = c["t_s"]
            continue
        if last is not None and (c["t_s"] - last) < MIN_GAP_S - 0.5:
            bad.append((last, c["t_s"], c["text"]))
        last = c["t_s"]
    return (len(bad) == 0), bad


def m_brevity(result):
    bad = [(c["text"], len(c["text"].split())) for c in _during_cues(result)
           if len(c["text"].split()) > 16]
    return (len(bad) == 0), bad


def m_anti_repetition(result):
    """Irritation is LOCAL: hearing the same line again within a short window is
    annoying; reusing a phrasing 20 minutes later on a long run is natural and
    fine. So we forbid any verbatim repeat within a sliding window of cues, not
    across the whole run."""
    texts = [c["text"] for c in _during_cues(result)]
    window = 4
    bad = []
    for i in range(len(texts)):
        recent = texts[max(0, i - window + 1):i]
        if texts[i] in recent:
            bad.append(texts[i])
    return (len(bad) == 0), bad[:8]


def m_persona_consistency(result):
    persona = result["persona"]
    blob = " ".join(c["text"] for c in _during_cues(result)).lower()
    if not blob:
        return True, []
    markers = PERSONA_MARKERS[persona]
    hit = any(mk in blob for mk in markers)
    return hit, ([] if hit else [persona + ": no signature markers in " + blob[:80]])


def m_trigger_coverage(result, scenario):
    fired = {c["trigger"] for c in _during_cues(result)}
    missing = scenario["expect_triggers"] - fired
    forbidden = scenario["forbid_triggers"] & fired
    ok = not missing and not forbidden
    return ok, {"missing": list(missing), "forbidden": list(forbidden)}


def m_in_flow_silence(result, scenario):
    if not scenario.get("in_flow"):
        return None, []
    reactive = {rc.CUE_SETTLE_PACE, rc.CUE_HOLD_PACE, rc.CUE_SUPPORT_FADE, rc.CUE_WALL_SUPPORT}
    bad = [c["text"] for c in _during_cues(result)
           if c["trigger"] in reactive and c["phase"] == "steady"]
    return (len(bad) == 0), bad


def m_safety_recall(result, scenario):
    if rc.CUE_HR_SAFETY not in scenario["expect_triggers"]:
        return None, []
    fired = {c["trigger"] for c in _during_cues(result)}
    ok = rc.CUE_HR_SAFETY in fired
    return ok, ([] if ok else ["safety cue missing on a redline scenario"])


def m_no_unsafe_advice(result, scenario):
    """On a redline scenario, no cue after the redline should urge MORE effort."""
    if rc.CUE_HR_SAFETY not in scenario["expect_triggers"]:
        return None, []
    cues = _during_cues(result)
    safety_t = next((c["t_s"] for c in cues if c["trigger"] == rc.CUE_HR_SAFETY), None)
    if safety_t is None:
        return False, ["no safety cue to anchor"]
    bad = []
    for c in cues:
        if c["t_s"] >= safety_t and c["trigger"] != rc.CUE_HR_SAFETY:
            low = c["text"].lower()
            if any(w in low for w in _PUSH_WORDS):
                bad.append(c["text"])
    return (len(bad) == 0), bad


def m_split_accuracy(result, scenario):
    if scenario["surface"] != "post":
        return None, []
    got = result["analysis"]["split_shape"]
    ok = got == scenario["expect_split"]
    return ok, ([] if ok else [f"expected {scenario['expect_split']} got {got}"])


def m_pre_run_grounded(result, scenario):
    if scenario["surface"] != "pre":
        return None, []
    text = result["pre_text"]
    from engine.pace_calculator import format_pace
    tgt = format_pace(scenario["planned"]["target_pace_s_per_km"])
    ok = (tgt in text) and ("?" not in text) and len(text) > 20
    return ok, ([] if ok else [f"brief missing target {tgt} or malformed"])


# --------------------------------------------------------------------------- #
# aggregation
# --------------------------------------------------------------------------- #
def aggregate(results, scenarios_by_id):
    """results: list of per-(scenario,persona) result dicts. Returns a report."""
    buckets = {k: {"pass": 0, "total": 0, "failures": []} for k in _THRESHOLDS}

    def record(name, res_id, outcome, detail):
        if outcome is None:
            return
        buckets[name]["total"] += 1
        if outcome:
            buckets[name]["pass"] += 1
        else:
            buckets[name]["failures"].append({"case": res_id, "detail": detail})

    for r in results:
        sid = f"{r['scenario_id']}/{r['persona']}"
        scenario = scenarios_by_id[r["scenario_id"]]
        if r["surface"] == "during":
            for name, fn in (("grounding", m_grounding), ("one_way", m_one_way),
                             ("spacing", m_spacing), ("brevity", m_brevity),
                             ("anti_repetition", m_anti_repetition),
                             ("persona_consistency", m_persona_consistency)):
                ok, det = fn(r)
                record(name, sid, ok, det)
            for name, fn in (("trigger_coverage", m_trigger_coverage),
                             ("in_flow_silence", m_in_flow_silence),
                             ("safety_recall", m_safety_recall),
                             ("no_unsafe_advice", m_no_unsafe_advice)):
                ok, det = fn(r, scenario)
                record(name, sid, ok, det)
        elif r["surface"] == "post":
            ok, det = m_split_accuracy(r, scenario)
            record("split_accuracy", sid, ok, det)
        elif r["surface"] == "pre":
            ok, det = m_pre_run_grounded(r, scenario)
            record("pre_run_grounded", sid, ok, det)

    report = {"metrics": {}, "overall_pass": True}
    for name, b in buckets.items():
        if b["total"] == 0:
            continue
        score = b["pass"] / b["total"]
        passed = score >= _THRESHOLDS[name]
        report["metrics"][name] = {
            "score": round(score, 4), "threshold": _THRESHOLDS[name],
            "passed": passed, "n": b["total"], "failures": b["failures"][:5],
        }
        if not passed:
            report["overall_pass"] = False
    return report
