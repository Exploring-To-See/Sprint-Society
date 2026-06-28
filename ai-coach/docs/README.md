# Sprint Society AI Coach — Spec & Feature Extraction

This `docs/` tree brings the **authoritative Sprint Society AI Coach specification** into
this lab repo, plus a derived feature catalog mapped onto this repo's code, so further
work can continue here against a single source of truth.

## Why this branch exists

This repository (`Ishan-AI-Coach`) is the **lab** where the coach is prototyped — RAG,
the four personas, memory, web search, the agent loop. The Sprint Society app is the
**production home** the coach will plug into. The app team wrote a spec that fixes the
*target*: what the coach must be and do, which capabilities map to the ₹9 / ₹99 tiers,
and which lab experiments must change before they ship. This branch imports that spec
and translates it into an actionable backlog for this codebase.

## Layout

```
docs/
├── README.md            ← you are here (provenance, mapping, what to fix first)
├── FEATURES.md          ← the extraction: every feature, mapped to this repo's files,
│                          with tier / engine / model / status
└── source/              ← verbatim copies of the app-side authority (do not edit here)
    ├── AI-COACH-SPEC.md       (§0–§12, the single source of truth)
    ├── IMPROVEMENT-PLAN.md    (app production-readiness waves; coach = separate track)
    └── EXECUTION-RUNBOOK.md   (sequential build runbook for the app waves)
```

## Provenance

- **Source repo:** `Exploring-To-See/Sprint-Society`
- **Source branch:** `claude/app-improvement-ai-coach-2rtpst`
- **Source commit:** `62a992e` (`62a992eeea1bc151b04943fcf4a9bc916e0e493f`)
- **Files imported verbatim:** `docs/AI-COACH-SPEC.md`, `docs/IMPROVEMENT-PLAN.md`,
  `docs/EXECUTION-RUNBOOK.md`
- The `source/` copies are frozen reference. When the app-side spec changes, re-sync
  them and reconcile `FEATURES.md`.

## How the spec maps to this repo (one-glance)

| Spec area | This repo | Verdict |
|-----------|-----------|---------|
| 4 personas | `agent/personas.py` | ✅ Keep verbatim |
| Persona voices in prose | `agent/system_prompts.py` | ✅ Keep, extend to all surfaces |
| RAG (embeddings, hybrid retrieval, corpus) | `knowledge/` + `knowledge/corpus/*` | ✅ Keep; add 4 corpus files |
| Memory (never-forget + decay) | `personalization/`, `database/memory.py` | 🟡 Rework extraction to nightly batch |
| Agent loop + tools | `agent/agent_loop.py`, `agent/tools.py` | 🟡 Keep shape; quotas + history window |
| Guardrails | `engine/guardrails.py` | ✅ Keep; merge with app ACWR rails |
| Pace / VO2max | `engine/pace_calculator.py`, `engine/vo2max.py` | ✅ Keep (consume in app) |
| Voice (TTS presets) | `ui/voice.py` | ✅ Keep (browser-native) |
| **10-level coach cycles** | `coaching/cycles.py` | ⚠️ **Demote to flavor only** |
| **ML injury/fitness models** | `engine/ml_models.py` | ⚠️ **Never user-facing** |
| Model provider | `config.py` (Groq/Llama) | ℹ️ Lab-OK; app must use Anthropic |

## Deviations to fix first (spec §3 & §11)

These are the points where the lab build diverged from what the app needs. Fix order:

1. **Kill the second progression system.** `coaching/cycles.py` currently runs per-coach
   10-level ladders *with advancement logic*. The app has exactly one level system (the
   40-level `classification-engine.ts`). Keep only the themed **rank names** as a
   presentation skin; remove any logic that assigns, advances, or stores a "training
   level". No `set_training_level` tool, no `training_level` column. *(FEATURES → L2)*
2. **Quotas are per-month, not per-day.** Any 30-messages-**per-day** allowance must
   become 30-**per-month** with a 5/day cap, or it blows the ₹33 Pro budget in a day.
   *(FEATURES → C6, $4)*
3. **Memory extraction must be a nightly batch**, not per-message, to fit cost. Keep the
   regex extractor as the no-API fallback. *(FEATURES → M4)*
4. **ML models stay non-user-facing.** `engine/ml_models.py` (RandomForest/MLP on
   synthetic data) must not decide anything a user sees. Use VDOT + heuristics.
   *(FEATURES → X1)*
5. **Base tier is the full one-way generation pipeline**, never hardcoded "Coach:"
   template strings. *(FEATURES → T2)*
6. **At the integration boundary**: Anthropic models, the app's user DB, browser Web
   Speech + local MiniLM. Lab may use Groq/Llama, but the app may not. *(FEATURES → §11)*

## Working agreement (from the spec)

Two tests for any new work:
1. Does it map to a row in the responsibilities catalog (FEATURES §4) and a cell in the
   tier matrix (FEATURES §3)? If not, it's a new product feature — **ask the founder first.**
2. Does the app already have a system for this (levels, XP, plans, pace, load)? If yes,
   the coach **consumes** it — it never builds a parallel one.

## Next steps for this repo

- Action the six deviation fixes above (start with #1 and #2).
- Add the four new corpus files (`nutrition`, `race_day`, `injury_rehab`, `sleep`),
  Indianized, drafted for founder approval before going live.
- Rework the prompt assembly to the cache-friendly order in spec §6.3 and add the
  `cache_read_input_tokens > 0` test.
- Track each capability's status in `FEATURES.md` as it moves 🔴 → 🟡 → 🟢.
