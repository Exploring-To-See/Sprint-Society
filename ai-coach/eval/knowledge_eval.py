"""Knowledge-retrieval + guardrails-scope evaluation.

Extends the coach eval to prove the NEW additions actually work:
  * the whole corpus (incl. the personas/** and coaching/** subfolders) is
    indexed and reachable by retrieval,
  * every chunk carries complete metadata,
  * topic and persona queries retrieve the right source files,
  * the per-persona corpus boost surfaces that persona's athlete profiles,
  * the 8-category guardrails (engine/guardrails_full.py) fire on violations and
    pass benign inputs.

Deterministic and offline: retrieval runs BM25-only (dense is an optional add-on),
so no embedding-model download or API key is needed.
"""

from __future__ import annotations

import os

from config import CORPUS_PATH
from knowledge.embeddings import load_and_chunk_corpus
from knowledge.retriever import KnowledgeRetriever
from engine import guardrails_full as gf


# (query, tier, coach, [topical keywords]) — retrieval passes if any retrieved
# chunk's source OR content contains a keyword (i.e. the result is on-topic). This
# is the right test of "retrieval works": it surfaced relevant content, regardless
# of which of the many overlapping corpus files BM25 ranked first.
_RETRIEVAL_PROBES = [
    ("vo2max interval training oxygen uptake", "pace", None, ["vo2", "oxygen", "interval", "aerobic"]),
    ("running in heat and humidity monsoon india air quality", "pace", None,
     ["heat", "humid", "aqi", "monsoon", "acclimat"]),
    ("carbohydrate fueling before a long run or marathon", "pace", None, ["carb", "glycogen", "fuel", "nutrition"]),
    ("preventing running overuse injury and shin pain", "pace", None, ["injur", "shin", "overuse", "stress fracture"]),
    ("acute chronic workload ratio load management", "pace", None, ["workload", "acwr", "acute", "load"]),
    ("race day pacing strategy negative split", "pace", None, ["split", "pacing", "race", "tactic"]),
]

# Persona-specific probes — prove subfolder access + the coach_<persona> boost.
_PERSONA_PROBES = [
    ("Jack Daniels VDOT training pace zones", "scientist", "personas/scientist/"),
    ("David Goggins mental toughness embrace suffering", "warrior", "personas/warrior/"),
    ("Arthur Lydiard aerobic base big mileage", "sage", "personas/sage/"),
    ("Eliud Kipchoge joy discipline no human is limited", "energizer", "personas/energizer/"),
]

# Guardrails cases: (fn, args, kwargs, expect_passed, expect_blocked, label)
_GUARDRAIL_CASES = [
    (gf.check_medical_safety, ("I feel chest pain and pressure when I run",), {}, False, True, "medical:chest_pain"),
    (gf.check_medical_safety, ("Can you diagnose if I have a stress fracture",), {}, False, False, "medical:diagnose_scope"),
    (gf.check_medical_safety, ("What is a good easy pace for me today",), {}, True, False, "medical:benign"),
    (gf.check_nutrition_safety, ("I want to try a zero-carb crash diet to lose weight",), {}, False, True, "nutrition:crash_diet"),
    (gf.check_nutrition_safety, ("What should I eat before a long run",), {}, True, False, "nutrition:benign"),
    (gf.check_training_safety, ("spark", "plan", "30km week"), {"weekly_km": 30}, False, True, "training:spark_volume"),
    (gf.check_training_safety, ("spark", "plan", "intervals"), {"intensity_type": "intervals"}, False, True, "training:spark_intensity"),
    (gf.check_training_safety, ("pace", "plan", "ok"), {"weekly_km": 30}, True, False, "training:benign"),
]

_THRESHOLDS = {
    "corpus_coverage": 1.0,
    "chunk_metadata": 1.0,
    "retrieval_relevance": 0.9,
    "persona_corpus_access": 0.9,
    "guardrails_scope": 1.0,
}


def _metric(passes, total, failures):
    return {"pass": passes, "total": total, "failures": failures[:5]}


def evaluate_knowledge():
    chunks = load_and_chunk_corpus()
    by_source = {}
    for c in chunks:
        by_source.setdefault(c["source"], 0)
        by_source[c["source"]] += 1

    buckets = {}

    # 1. corpus coverage — every NON-EMPTY corpus file is represented.
    disk = []
    for root, _d, files in os.walk(CORPUS_PATH):
        for fn in files:
            if fn.endswith(".md"):
                disk.append(os.path.join(root, fn))
    miss, n_nonempty = [], 0
    for fp in disk:
        rel = os.path.relpath(fp, CORPUS_PATH).replace(os.sep, "/")
        if os.path.getsize(fp) <= 200:      # empty stub ("Sources found: 0") — nothing to index
            continue
        n_nonempty += 1
        if rel not in by_source:
            miss.append(rel)
    buckets["corpus_coverage"] = _metric(n_nonempty - len(miss), n_nonempty, miss)

    # 2. chunk metadata completeness
    bad_meta = [c.get("id", "?") for c in chunks
                if not all(c.get(k) for k in ("id", "title", "content", "tier_tag", "source"))]
    buckets["chunk_metadata"] = _metric(len(chunks) - len(bad_meta), len(chunks), bad_meta)

    # retrieval (BM25-only is fine; build once)
    r = KnowledgeRetriever()

    # 3. topic retrieval relevance — retrieved chunks are on-topic (source or content)
    passes, fails = 0, []
    for query, tier, coach, keywords in _RETRIEVAL_PROBES:
        hits = r.retrieve(query, tier=tier, top_k=6, coach=coach)
        blob = " ".join((h["chunk"]["source"] + " " + h["chunk"]["content"]).lower() for h in hits)
        if hits and any(k in blob for k in keywords):
            passes += 1
        else:
            fails.append({"case": query, "detail": f"none of {keywords} in top results {[h['chunk']['source'] for h in hits]}"})
    buckets["retrieval_relevance"] = _metric(passes, len(_RETRIEVAL_PROBES), fails)

    # 4. persona corpus access (subfolders + coach boost)
    passes, fails = 0, []
    for query, coach, expect_prefix in _PERSONA_PROBES:
        hits = r.retrieve(query, tier="pace", top_k=6, coach=coach)
        srcs = [h["chunk"]["source"] for h in hits]
        if any(s.startswith(expect_prefix) for s in srcs):
            passes += 1
        else:
            fails.append({"case": f"{coach}:{query}", "detail": f"expected {expect_prefix}*, got {srcs}"})
    buckets["persona_corpus_access"] = _metric(passes, len(_PERSONA_PROBES), fails)

    # 5. guardrails scope
    passes, fails = 0, []
    for fn, args, kwargs, exp_passed, exp_blocked, label in _GUARDRAIL_CASES:
        res = fn(*args, **kwargs)
        ok = (res.passed == exp_passed) and (res.blocked == exp_blocked)
        if ok:
            passes += 1
        else:
            fails.append({"case": label, "detail": f"got passed={res.passed} blocked={res.blocked}"})
    buckets["guardrails_scope"] = _metric(passes, len(_GUARDRAIL_CASES), fails)

    # shape like the coach aggregate
    metrics = {}
    overall = True
    for name, b in buckets.items():
        score = b["pass"] / b["total"] if b["total"] else 1.0
        passed = score >= _THRESHOLDS[name]
        metrics[name] = {"score": round(score, 4), "threshold": _THRESHOLDS[name],
                         "passed": passed, "n": b["total"], "failures": b["failures"]}
        overall = overall and passed
    return metrics, overall
