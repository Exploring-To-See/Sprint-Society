# Reference material (from the `ai-coach-update` branch)

These files are **reference, not wired into the shipped one-way coach**. They were
cherry-picked from the larger `ai-coach-update` / `feature/adaptive-engine` branch
because they're useful for the eventual Sprint Society integration and the future
two-way (Pro) chat engine — but they target that branch's chat engine
(`coaching.engine_v2.coach`), which is intentionally NOT part of this headless
one-way build.

- `INTEGRATION_CONTRACT.md` — the request/response contract that branch designed for
  the host app (`coach.handle(feature, context)`). A solid template for how Sprint
  Society should call a coach engine.
- `sprint_society_adapter.py` — maps Sprint Society's production tables into a context
  dict. Reference for the real data wiring (stdlib-only; not imported by anything here).

What WAS merged into the live tree from those branches:
- `knowledge/corpus/**` — the expanded RAG knowledge corpus (topic files, per-persona
  athlete/coach knowledge profiles, research-sourced files, Indian running). Used by
  `knowledge/retriever.py` for grounding.
- `knowledge/BUILD_REFERENCES.md` — corpus provenance.
- `engine/guardrails_full.py` — the richer 8-category guardrail set (medical-scope
  blocks, invented-pace detection, EN/HI disclaimers) for the safety layer.

Deliberately NOT merged: the chat router/tools/providers (`agent/router.py`,
`agent/tools_full.py`, `agent/providers.py`), the parallel coaching engines
(`coaching/engine*.py`, `coaching/proactive.py`), Streamlit `ui/`, and their tests —
out of scope for the verified, headless one-way coach.
