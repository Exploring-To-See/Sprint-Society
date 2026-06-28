# AI Coach — integration into Sprint Society

This `ai-coach/` directory is a snapshot of the **headless ₹9 one-way AI running
coach** from `rg6830303/Ishan-AI-Coach` `main` (commit `c99a09b`), dropped into this
repo on the `feature/ai-coach` branch so it can be wired into the backend.

It is **not yet connected to any route or service** — this branch is the staging
point for that integration.

## What it is

- **One-way** coach (the runner never chats): it analyses the runner's data and
  speaks before / during / after a run.
- **Deterministic core, zero-hallucination**: the cue engine + responses are pure
  Python with no third-party deps; during-run cues are templated and filled only
  with engine numbers, so no pace/distance/HR can be invented.
- **Verified**: `python ai-coach/eval/run_eval.py` → 17/17 metrics PASS (coach +
  retrieval + guardrails); `python ai-coach/tests/test_one_way_coach.py` → 7/7.

## Entry points (see `ai-coach/README.md` for full quickstart)

| Surface | Call |
|---|---|
| Pre-run brief | `coaching.one_way_coach.pre_run_brief(planned, zones, profile, persona)` |
| During-run (per telemetry tick) | `engine.run_cues.CuePlanner(...).evaluate(snap, state)` → `cue_library.render_cue(ev, persona)` or `None` |
| Post-run | `coaching.one_way_coach.post_run_report(planned, samples, zones, profile, history, persona)` |
| Audio (optional) | `voice.tts.synthesize(text, persona)` → WAV bytes |

## Wiring notes for this backend

- This backend is Node/Express + Postgres; the coach is Python. Two clean options:
  1. **Sidecar service** — run the coach as a small Python (FastAPI) service the
     Express API calls; or
  2. **Port the deterministic modules** (`engine/run_*.py`, `coaching/cue_library.py`,
     `coaching/one_way_coach.py`) to TypeScript under `server/src/engine/`. They are
     dependency-free and small, so a port is straightforward.
- Per this repo's `CLAUDE.md`, the production AI provider is **Anthropic Claude**;
  the lab default is Groq/Llama. The one-way cue path uses **no LLM at all** (templated),
  so it works offline; only the future pre/post-run prose re-toning needs a provider.
- Numbers must come from the server's own engines (pace/zones/load) — the coach only
  turns those numbers into persona-voiced words.
- The RAG corpus lives in `ai-coach/knowledge/corpus/` (retrieval verified across all
  ~100 files incl. persona profiles); the 8-category guardrails are in
  `ai-coach/engine/guardrails_full.py`.

## What was intentionally NOT included

The two-way (Pro) chat engine, router/tools/providers, and Streamlit UI from the lab's
other branches are out of scope for this one-way ship. See
`ai-coach/docs/reference/` for the chat-engine integration contract if/when you build
the Pro tier.
