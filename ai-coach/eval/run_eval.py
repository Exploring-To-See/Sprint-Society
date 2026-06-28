"""Run the one-way-coach evaluation loop and print a metrics report.

Usage:   python eval/run_eval.py            # run once, append to history
         python eval/run_eval.py --show     # also print sample transcripts

Each invocation is one loop ITERATION: it scores the current code against the
full scenario matrix and appends the result to eval/eval_history.jsonl, so the
optimization loop's progress (and the final best run) is visible over time.

The harness is framework-agnostic and runs with NO API key. DeepEval/RAGAS hook:
the per-(scenario,persona) records produced here map 1:1 to DeepEval LLMTestCases
(input=scenario, actual_output=joined cues, retrieval_context=engine payload);
the deterministic metrics below are equivalent to DeepEval custom BaseMetrics.
Wire them in `aggregate()` when an LLM judge is available for the future Pro chat.
"""

import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.run_state import infer_state  # noqa: E402
from engine.run_cues import CuePlanner  # noqa: E402
from engine.run_analysis import analyze_run  # noqa: E402
from engine.pace_calculator import calculate_pace_zones  # noqa: E402
from coaching import cue_library as lib  # noqa: E402
from coaching.one_way_coach import pre_run_brief, post_run_report  # noqa: E402
from eval.scenarios import build_scenarios, PERSONAS  # noqa: E402
from eval import metrics as M  # noqa: E402
from eval.knowledge_eval import evaluate_knowledge  # noqa: E402

HISTORY = os.path.join(os.path.dirname(__file__), "eval_history.jsonl")


def run_scenario(scenario, persona):
    surface = scenario["surface"]
    profile, planned = scenario["profile"], scenario["planned"]
    zones = calculate_pace_zones(profile)
    result = {"scenario_id": scenario["id"], "persona": persona, "surface": surface}

    if surface == "during":
        planner = CuePlanner(planned, zones, profile)
        cues = []
        for snap in scenario["samples"]:
            state = infer_state(snap, planned, profile)
            ev = planner.evaluate(snap, state)
            if ev is not None:
                cues.append({
                    "t_s": ev.t_s, "trigger": ev.trigger, "phase": ev.phase,
                    "need": ev.need, "payload": ev.payload,
                    "text": lib.render_cue(ev, persona),
                })
        result["cues"] = cues
    elif surface == "post":
        result["analysis"] = analyze_run(planned, scenario["samples"], zones, profile, history=[])
        result["post_text"] = post_run_report(planned, scenario["samples"], zones, profile, [], persona)
    elif surface == "pre":
        result["pre_text"] = pre_run_brief(planned, zones, profile, persona)
    return result


def run_once():
    scenarios = build_scenarios()
    by_id = {s["id"]: s for s in scenarios}
    results = [run_scenario(s, p) for s in scenarios for p in PERSONAS]
    report = M.aggregate(results, by_id)
    # Merge in the knowledge-retrieval + guardrails-scope metrics (the new additions).
    kmetrics, kpass = evaluate_knowledge()
    report["metrics"].update(kmetrics)
    report["overall_pass"] = report["overall_pass"] and kpass
    return scenarios, results, report


def print_report(report, n_scenarios, n_results):
    print("=" * 76)
    print(f"  ONE-WAY COACH — EVALUATION REPORT")
    print(f"  scenarios: {n_scenarios}   evaluations (scenario x persona): {n_results}")
    print("=" * 76)
    print(f"  {'metric':<22}{'score':>8}{'thresh':>8}{'n':>5}   status")
    print("  " + "-" * 60)
    for name, m in report["metrics"].items():
        status = "PASS" if m["passed"] else "**FAIL**"
        print(f"  {name:<22}{m['score']:>8.3f}{m['threshold']:>8.2f}{m['n']:>5}   {status}")
    print("  " + "-" * 60)
    print(f"  OVERALL: {'PASS — coach responses meet every bar' if report['overall_pass'] else '**FAIL — see failures below**'}")
    if not report["overall_pass"]:
        print("\n  FAILURES:")
        for name, m in report["metrics"].items():
            if not m["passed"]:
                print(f"   [{name}]")
                for f in m["failures"]:
                    print(f"     - {f['case']}: {f['detail']}")
    print("=" * 76)


def append_history(report):
    iters = 0
    if os.path.exists(HISTORY):
        with open(HISTORY) as f:
            iters = sum(1 for _ in f)
    row = {
        "iter": iters + 1, "ts": int(time.time()),
        "overall_pass": report["overall_pass"],
        "scores": {k: v["score"] for k, v in report["metrics"].items()},
    }
    with open(HISTORY, "a") as f:
        f.write(json.dumps(row) + "\n")
    return row


def print_history():
    if not os.path.exists(HISTORY):
        return
    rows = [json.loads(l) for l in open(HISTORY)]
    print("\n  LOOP HISTORY (each run = one optimization iteration):")
    print(f"   {'iter':>4}  {'overall':>8}  metrics-passing")
    metric_names = list(rows[-1]["scores"].keys())
    for r in rows:
        passing = sum(1 for v in r["scores"].values() if v >= 0.90)
        flag = "PASS" if r["overall_pass"] else "fail"
        print(f"   {r['iter']:>4}  {flag:>8}  {passing}/{len(r['scores'])} metrics >= 0.90")


def show_transcripts(scenarios, results):
    """Print a few representative transcripts so a human can read the responses."""
    print("\n" + "#" * 76)
    print("  SAMPLE RESPONSES (final run) — read these to confirm quality")
    print("#" * 76)
    picks = ["hot_easy_beg", "redline_beg", "fade_long_int", "post_fade_beg", "pre_easy_beg"]
    by_key = {(r["scenario_id"], r["persona"]): r for r in results}
    sc_by_id = {s["id"]: s for s in scenarios}
    for sid in picks:
        sc = sc_by_id[sid]
        print(f"\n=== {sid}: {sc['title']}  [{sc['surface']}] ===")
        for persona in PERSONAS:
            r = by_key[(sid, persona)]
            print(f"  -- {persona} --")
            if sc["surface"] == "during":
                for c in r["cues"]:
                    mm = f"{int(c['t_s'])//60:02d}:{int(c['t_s'])%60:02d}"
                    print(f"     [{mm}] {c['text']}")
            elif sc["surface"] == "post":
                print(f"     {r['post_text']}")
            elif sc["surface"] == "pre":
                print(f"     {r['pre_text']}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--show", action="store_true", help="print sample transcripts")
    args = ap.parse_args()

    scenarios, results, report = run_once()
    print_report(report, len(scenarios), len(results))
    append_history(report)
    print_history()
    if args.show:
        show_transcripts(scenarios, results)
    sys.exit(0 if report["overall_pass"] else 1)


if __name__ == "__main__":
    main()
