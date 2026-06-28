# AI Coach — Feature Catalog (extracted from the Sprint Society spec)

> **Source of truth:** `docs/source/AI-COACH-SPEC.md` (verbatim copy). This file is a
> derived, actionable extraction of every feature in that spec, mapped onto **this
> repository's** existing modules so work can continue here.
>
> **Provenance:** extracted from `Exploring-To-See/Sprint-Society`, branch
> `claude/app-improvement-ai-coach-2rtpst` @ `62a992e`
> (docs `AI-COACH-SPEC.md`, `IMPROVEMENT-PLAN.md`, `EXECUTION-RUNBOOK.md`).
>
> **Golden rule (spec §1):** *Engines do the math, the LLM does the words.* The model
> never invents a pace, distance, or level. Every feature below either consumes a
> deterministic engine for its numbers, or is pure prose generation grounded in one.

---

## How to read this

**Status** — where the capability stands *in this lab repo*:

| | Meaning |
|---|---|
| 🟢 | Built in the lab (Python prototype exists here) |
| 🟡 | Partial — exists but needs rework to match the spec |
| 🔴 | Not started |
| 🔵 | Integration-only — app-side work done when wiring into Sprint Society, not a lab task |

**Spec directive** — what the spec says to do with the lab's version when it ships:
**Keep** (port verbatim) · **Rework** · **Demote** (keep as flavor, strip the logic) ·
**Port-to-TS** (reimplement in the app's engines) · **Add** (new, not in lab yet).

**Tier** — `base` = ₹9/mo (one-way), `pro` = ₹99/mo (two-way). There is **no free tier**;
`free` = no active subscription = locked previews only.

---

## 0. The two-line product

- **₹9 Base** — the coach *talks to you*: every run gets analyzed, briefs/summaries/nudges
  arrive automatically, all in your chosen persona's voice. The user never has to ask.
- **₹99 Pro** — *you talk back*: text + voice chat, the coach reads your real plan,
  proposes changes you approve with a tap, and remembers your injuries.

Hard cost ceiling: AI spend ≤ ⅓ of price → **Base ≤ ₹3/user/mo, Pro ≤ ₹33/user/mo.**

---

## 1. Personas — "one brain, four voices"

| ID | Feature | Tier | This-repo mapping | Spec directive | Status |
|----|---------|------|-------------------|----------------|--------|
| P1 | Four personas: `scientist`, `energizer`, `warrior`, `sage` | both | `agent/personas.py` (keys + voices confirmed) | **Keep — verbatim.** Do not rename/merge/"improve". Founder-authored, final. | 🟢 |
| P2 | Persona drives **everything** the coach writes (plans, summaries, briefs, nudges, chat, TTS) | both | `agent/system_prompts.py`, `agent/personas.py` | Keep | 🟡 |
| P3 | Persona stored on profile (`runner_profiles.coach_style`) | both | `database/models.py` | Port-to-TS (app DB column) | 🔵 |
| P4 | Chosen at onboarding via 4 coach cards + "Recommended for you" badge from profiling | both | `ui/profiling_page.py` | Rework (badge logic: data→Scientist, fun→Energizer, discipline→Warrior, calm→Sage) | 🟡 |
| P5 | Switchable anytime; affects **future content only**; never regenerate past texts | both | `ui/sidebar.py` | Keep behavior | 🟡 |
| P6 | **Memory shared across personas** — switching never loses what the coach knows | both | `personalization/store.py` | Keep (critical invariant) | 🟡 |
| P7 | RAG boosts the active persona's corpus file 1.3× | both | `knowledge/retriever.py`, `knowledge/corpus/coach_*.md` | Keep | 🟢 |
| P8 | Per-persona browser-TTS voice preset (rate/pitch + ranked voices) | pro | `ui/voice.py` | Keep | 🟢 |

---

## 2. Progression — the one rule that must not be broken (spec §3, §11)

> **There is exactly ONE progression system: the app's existing 40-level classification
> engine (B1–B10, I1–I10, A1–A10, P1–P10).** The lab's per-coach 10-level cycles are
> **NOT** a progression system and must not be ported as one. No second ladder, no
> `set_training_level` tool, no `training_level` column.

| ID | Feature | Tier | This-repo mapping | Spec directive | Status |
|----|---------|------|-------------------|----------------|--------|
| L1 | 40-level classification is the only judge of level | both | (app) `server/src/engine/classification-engine.ts` | Port-to-TS / consume only | 🔵 |
| L2 | The 10-level coach cycles | — | `coaching/cycles.py` (Lab Protocol / Adventure Ladder / The Forge / The Path) | **DEMOTE.** Keep the themed names as a **presentation skin** only; delete all progression/advancement logic. | 🟡 ⚠️ |
| L3 | Config mapping each of the 40 levels → a themed rank name per persona | both | new config (seed from `coaching/cycles.py` names) | Add | 🔴 |
| L4 | Persona-voiced promotion/demotion message templates (fire when the engine changes level) | both | `agent/personas.py` templates | Add | 🔴 |
| L5 | Surface rank name on dashboard AthleteCard + classification API | both | (app) UI | 🔵 | 🔴 |

⚠️ **L2 is the live deviation the founder flagged.** See `docs/README.md` → "Deviations to fix".

---

## 3. Tiers & gating (spec §4)

| ID | Feature | Tier | This-repo mapping | Spec directive | Status |
|----|---------|------|-------------------|----------------|--------|
| T1 | Plan keys `base`/`pro`; hierarchy `{free:0, base:1, pro:2}` | — | (app) `subscription_plans`, `middleware/subscription.ts` | Port-to-TS | 🔵 |
| T2 | Base = full one-way generation pipeline (NOT "no AI", NOT template strings) | base | R3–R10 below | Keep as core product | 🟡 |
| T3 | Pro = two-way chat + voice + plan-change-by-conversation | pro | R11–R13 below | Keep | 🟡 |
| T4 | Lapsed subscription → plan view-only, tracking continues, no new generation | — | (app) subscription lifecycle | 🔵 | 🔴 |
| T5 | Base chat = 3 Haiku trial msgs/mo + locked tab + upgrade CTA | base | `ui/chat_page.py` quota gate | Rework | 🟡 |

---

## 4. Coaching responsibilities R1–R14 (spec §5 — the heart of the product)

Each row: **engine computes the truth, the model writes the words.** "Batch" = Anthropic
Message Batches API (50% off), nightly per user timezone. Every text is generated **once
and stored**, never regenerated on page view, and falls back to a deterministic template
when the API key is missing or the `ai_generation` flag is off.

| ID | Responsibility | Trigger | Truth source (engine) | Words (model) | Tier | This-repo mapping | Status |
|----|----------------|---------|----------------------|---------------|------|-------------------|--------|
| R1 | Tier & level classification | run cascade / weekly | `classification-engine.ts`, `tierClassifier.ts` | persona promotion template | both | `engine/classifier.py`, `engine/ml_models.py` | 🟡 |
| R2 | Pace & HR zones | profile/runs change | `paceCalculator.ts`, `heartRateZones.ts` | none (numbers only) | both | `engine/pace_calculator.py`, `engine/vo2max.py` | 🟢 |
| R3 | Training-plan generation | goal set | `trainingPlanGenerator.ts` (VDOT) | Haiku: persona intro + per-week framing | both | `coaching/plans.py` | 🟡 |
| R4 | Adaptive plan adjustment | weekly / signals | `adaptiveEngine.ts` (ACWR/TSB) + guardrails | Haiku: persona explanation | both | (app) `feature/adaptive-engine` branch | 🔵 |
| R5 | Post-run analysis | every logged run (batch) | `coachingOutputs.ts` scoring | Haiku: persona paragraph, stored once | both | `coaching/plans.py`, `agent/system_prompts.py` | 🔴 |
| R6 | Pre-run brief | day of planned session | `coachingOutputs.ts` brief | Haiku: one persona paragraph (prior night's batch) | both | 🔴 | 🔴 |
| R7 | Weekly summary | Sunday eve, user TZ (batch) | weekly stats queries | Haiku: persona summary → notification | both | 🔴 | 🔴 |
| R8 | Weekly challenges | weekly | `challengeGenerator.ts` | Haiku: one-line persona explanation | per plan | 🔴 | 🔴 |
| R9 | Proactive nudges | nightly batch | `proactiveCoach.ts` signals (missed sessions, load spike, PR streak, race-in-7) | Haiku nudge, ≤3/user/week | both | 🔴 | 🔴 |
| R10 | Transformation journey | onboarding/goal | `transformationPlan.ts` | Haiku framing prose | per plan | 🔴 | 🔴 |
| R11 | **Chat** | user message | tool calls into all engines | **Sonnet**, streaming, agent loop | pro (+3 trial base) | `agent/agent_loop.py`, `agent/tools.py` | 🟢 |
| R12 | Pre/post-run check-ins | run logged / session day | run data + plan | Haiku seed, 2/day, separate pool | pro | 🔴 | 🔴 |
| R13 | Plan change via chat | conversation | `propose_plan_change` → user approves → guardrails apply | Sonnet proposes, engine applies | pro | `agent/tools.py` (propose-only) | 🟡 |
| R14 | Event/community awareness | brief/chat context | events queries | woven into R6/R11 | both | `agent/tools.py` (`get_upcoming_events`) | 🔵 |

---

## 5. The brain — RAG, memory, prompt assembly (spec §6)

### 5.1 RAG / knowledge

| ID | Feature | This-repo mapping | Spec directive | Status |
|----|---------|-------------------|----------------|--------|
| K1 | Corpus: 13 files (9 general + 4 `coach_*`) | `knowledge/corpus/*.md` (all 13 present) | Keep | 🟢 |
| K2 | **+4 new files**: `nutrition.md`, `race_day.md`, `injury_rehab.md`, `sleep.md` | `knowledge/corpus/` | Add (founder-approved, Indianized) | 🔴 |
| K3 | Corpus lives in a DB table, editable in admin, "Rebuild index" action | `knowledge/embeddings.py`, `scripts/build_index.py` | Port-to-TS (`knowledge_documents`) | 🟡 |
| K4 | Local embeddings `all-MiniLM-L6-v2` (384-dim, no API key, ₹0) | `knowledge/embeddings.py` | Keep (prod: `@xenova/transformers`) | 🟢 |
| K5 | Hybrid retrieval: dense cosine + BM25, RRF `1/(60+rank)`, top-k 3; 1.3× tier + persona boosts | `knowledge/retriever.py` | Keep | 🟢 |
| K6 | Retrieval queries always English (chat model translates Hindi/Hinglish first) | `agent/tools.py` (`retrieve_knowledge`) | Keep | 🟡 |
| K7 | Graceful no-RAG fallback (`RAG_ENABLED`) | `knowledge/retriever.py` | Keep | 🟢 |
| K8 | Web scraping/search — lab capability; before shipping: cost-capped, allowlisted, latency-bounded, never overrides engine numbers | `knowledge/web_scraper.py` (DDG/Wikipedia) | Rework before integration | 🟡 |

### 5.2 Memory

| ID | Feature | This-repo mapping | Spec directive | Status |
|----|---------|-------------------|----------------|--------|
| M1 | One `memories` table keyed to `users.id` | `database/memory.py`, `personalization/store.py` | Port-to-TS | 🟡 |
| M2 | **Never-forget set** (always in prompt, no decay): injuries, conditions, race goal+date, hard constraints, persona | `personalization/store.py` | Keep | 🟡 |
| M3 | **Decay set** (`confidence × exp(-0.03 × days)`, ~23-day half-life, top-8 injected) | `personalization/store.py` | Keep formula | 🟡 |
| M4 | Extraction = **nightly Haiku batch** over the day's chats + runs (NOT per-message); regex fallback | `personalization/extractor.py` | Rework (batch, not per-message) | 🟡 |
| M5 | Injury status lifecycle active→recovering→resolved | `personalization/store.py` | Keep | 🟡 |
| M6 | Chat history capped 90 days (cron purge); memory keeps the essence | `database/memory.py` | Add purge | 🔴 |

### 5.3 Prompt assembly (cache-friendly — a cost requirement)

| ID | Feature | This-repo mapping | Spec directive | Status |
|----|---------|-------------------|----------------|--------|
| A1 | Frozen prefix (identity, persona voice, safety, language rule) → `cache_control` breakpoint → volatile (profile, memory, RAG, plan) | `agent/system_prompts.py`, `agent/agent_loop.py` | Rework to the §6.3 order | 🟡 |
| A2 | Integration test asserts `cache_read_input_tokens > 0` on message 2 | (app) tests | Add | 🔴 |

---

## 6. Chat mechanics (Pro) (spec §7)

| ID | Feature | This-repo mapping | Spec directive | Status |
|----|---------|-------------------|----------------|--------|
| C1 | SSE streaming endpoint, `claude-sonnet-4-6`, `max_tokens` 600 | `agent/agent_loop.py` | Port-to-TS (`GET /api/ai/chat/stream`) | 🟡 |
| C2 | Agent loop, max 4 iterations; malformed tool call → retry once without tools | `agent/agent_loop.py` | Keep | 🟢 |
| C3 | Tools wrap existing engines — no new logic: `retrieve_knowledge`, `get_runner_profile`, `get_recent_runs`, `calculate_pace_zones`, `get_current_plan`, `get_training_load`, `predict_race_time` (VDOT, not ML), `get_upcoming_events`, `log_memory`, `propose_plan_change` | `agent/tools.py` | Keep / Port-to-TS | 🟡 |
| C4 | `propose_plan_change` is **propose-only** → Approve/Decline card → `POST /plan-proposals/:id/approve` applies via guardrails + adaptiveEngine | `agent/tools.py` | Keep invariant | 🟡 |
| C5 | History = last 8 messages + rolling summary (never full log) | `agent/agent_loop.py` | Rework | 🟡 |
| C6 | Quotas: Pro 30 Sonnet/mo, 5/day, ledgered; Base 3 Haiku trial/mo; check-ins 2/day on Haiku, separate pool | `database/`, `ui/chat_page.py` | Rework (see §9 — current code is per-**day**, wrong) | 🟡 |
| C7 | Languages: mirror user (English/Hindi/Hinglish) | `agent/system_prompts.py` | Keep | 🟢 |
| C8 | Voice: browser-native only (Web Speech API STT + `speechSynthesis`), persona presets, en-IN/hi-IN, "≤80 words" in voice mode. No server voice, no keys. | `ui/voice.py` | Keep | 🟢 |
| C9 | One continuous conversation per user (no threads); quick-reply chips | `ui/chat_page.py` | Keep | 🟡 |

---

## 7. Guardrails / safety (spec §8)

| ID | Feature | This-repo mapping | Spec directive | Status |
|----|---------|-------------------|----------------|--------|
| G1 | Input screening: red-flag keywords (chest pain, dizziness, fainting, sharp pain) → hard-block advice, return medical disclaimer, session stays cautious | `engine/guardrails.py` | Keep | 🟡 |
| G2 | Plan validation: beginner ≤15 km/wk (no intervals/tempo, ≥3 rest), intermediate ≤40, advanced ≤80; everyone ≤10% weekly increase + mandatory rest day | `engine/guardrails.py` | Keep, merge with app's ACWR rails | 🟡 |
| G3 | Every generated plan-change and text passes validation before save/show; fail → deterministic fallback | `engine/guardrails.py` | Keep | 🟡 |

---

## 8. ML models — explicit non-goal (spec §11)

| ID | Feature | This-repo mapping | Spec directive | Status |
|----|---------|-------------------|----------------|--------|
| X1 | Synthetic-data RandomForest injury/readiness + MLP fitness forecaster | `engine/ml_models.py` | **Do NOT let ML decide anything user-facing.** Use VDOT formulas + `adaptiveEngine.ts` heuristics instead. Lab experiments fine; production must not surface ML decisions. | 🟡 ⚠️ |

---

## 9. Cost controls (spec §9 — non-negotiable)

| ID | Rule | This-repo mapping | Status |
|----|------|-------------------|--------|
| $1 | Haiku for all one-way; Sonnet only for live Pro chat | `agent/agent_loop.py`, `config.py` | 🟡 |
| $2 | Message Batches API (50% off) for all background gen + nightly memory extraction | (app) batch jobs | 🔴 |
| $3 | Prompt caching per §6.3 | `agent/system_prompts.py` | 🟡 |
| $4 | Quotas: **30/month**, 5/day — *current code's 30/**day** is wrong (burns a month's budget in a day)* | `ui/chat_page.py`, quota store | 🟡 ⚠️ |
| $5 | Generate-once-store-forever | R3–R10 storage | 🔴 |
| $6 | Per-user monthly cost ledger (`ai_usage`); warn at 80%; `ai_chat`/`ai_generation` flags = instant kill switch → deterministic templates | (app) `ai_usage`, feature flags | 🔵 |

> **Production model IDs** (integration boundary): chat `claude-sonnet-4-6`, background
> `claude-haiku-4-5`. The lab currently runs Groq/Llama (`config.py`) — allowed in the
> lab, but the app must use Anthropic models.

---

## 10. Data & privacy (spec §10)

| ID | Rule | Status |
|----|------|--------|
| D1 | **Admin can never read user chats** — no conversation content in any admin view/log/export; admin sees aggregates only (cost/user, msg counts, anonymized topics) | 🔵 |
| D2 | Users can view & delete what the coach remembers (AI Profile page) | 🟡 |
| D3 | Corpus-enhancement pipeline sees anonymized topics only, never chat content | 🔵 |
| D4 | All AI tables key to the app's existing `users.id` | 🔵 |

---

## 11. Integration boundary requirements (spec §0, §11)

When any capability ships into the production app it **must**: key to the app's existing
users/data (no separate user store in prod), treat `server/src/engine/*` as the only
source of truth for numbers, run on Anthropic models (`claude-sonnet-4-6` chat,
`claude-haiku-4-5` background), fit the cost budgets (§9), respect privacy (§10). In the
lab, any stack is fine — these apply at the boundary.

---

## 12. Definition of done (spec §12)

- [ ] A ₹9 user who logs a run gets a persona analysis by next morning, a brief on session days, a Sunday-evening summary (their TZ), and nudges when they slack — without typing anything.
- [ ] A ₹99 user chats (text/voice, EN/HI/Hinglish) with a coach that reads their real plan, proposes tap-to-approve changes, and remembers injuries — in their persona's voice.
- [ ] Switching persona changes the voice of all future content and nothing else; memory survives.
- [ ] Exactly one level system; dashboard shows persona-themed rank names mapped from `classification-engine.ts`.
- [ ] `ai_usage` proves ≤₹3 (Base) / ≤₹33 (Pro) per active user/mo at ~12 runs + full quota; cache reads non-zero in chat.
- [ ] Toggling `ai_chat`/`ai_generation` off instantly returns deterministic templates, no errors.
- [ ] No admin surface exposes conversation content.
- [ ] Guardrails: "chest pain" → disclaimer only; a 30% volume jump is rejected.
- [ ] Typecheck + tests green; `docs/USER-GUIDE.md` + `docs/PM-GUIDE.md` updated.

---

*See `docs/README.md` for provenance, the spec↔repo mapping summary, and the prioritized
"deviations to fix" list. Full authoritative text in `docs/source/`.*
