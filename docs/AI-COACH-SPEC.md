# Sprint Society — AI Coach Specification (Authoritative)

> **Audience:** the engineer building the AI coach.
> **Status:** This document is the single source of truth for what the AI coach does
> in Sprint Society — its role, responsibilities, and mechanics for the ₹9 and ₹99
> tiers. Build capabilities freely; but what the coach *is* and *does* comes from
> this document. If anything here is ambiguous, ask the founder; do not improvise.

---

## 0. Read this first — purpose of this document

The AI coach is being developed and enhanced in the **Ishan-AI-Coach repo** — that
continues. The RAG system, the personas, web scraping, memory, and the other
capabilities being built there are good work and the right direction. **Keep going.**

What this document fixes is the *target*: every capability must serve **Sprint
Society's in-app AI coach features** — the responsibilities, tiers, and mechanics
defined below. The deviation to avoid is building features the app doesn't have or
systems that conflict with ones the app already has (the second progression ladder
is the live example — see §3).

Two simple tests for any piece of work:

1. **Does it map to a row in the responsibilities catalog (§5) and a cell in the
   tier matrix (§4)?** If not, it's a new product feature — ask the founder first.
2. **Does the app already have a system for this?** (levels, XP, plans, pace math,
   pace zones, training load…) If yes, the coach *consumes* that system — it never
   builds a parallel one.

**Integration requirements** — when a capability ships into the production app, it
must: key to the app's existing users/data (no separate user store in production),
treat the app's engines (`server/src/engine/*`) as the only source of truth for
numbers, run on Anthropic models in production (`claude-sonnet-4-6` chat,
`claude-haiku-4-5` background), fit the cost budgets (§9), and respect the privacy
rules (§10). In the lab, experiment with whatever stack is fastest — these
requirements apply at the integration boundary.

---

## 1. What the AI Coach is

The **AI Coach** is Sprint Society's coaching brain with **four selectable
personalities**. Its job is to take the numbers the app's engines already compute
(plans, zones, loads, levels) and turn them into **personal, persona-voiced
coaching** — and, for paying Pro users, to hold an actual two-way conversation
about their training.

Product principles (these drive every design decision):

1. **Smart app, not dumb app.** The user never has to ask for value. Runs are logged
   → analysis appears. Sunday evening → summary arrives. Sessions missed → coach
   nudges. Everything auto-feeds.
2. **Engines do math, the LLM does words.** All numbers, paces, schedules, loads,
   and level decisions come from the deterministic engines. The LLM only writes
   prose grounded in those outputs. The LLM is never allowed to invent a pace,
   a distance, or a level.
3. **One coach, four voices.** The persona changes *how* the coach speaks,
   never *what is true*.
4. **₹9 = the coach talks to you. ₹99 = you talk back.**
5. **Hard cost ceiling:** AI spend ≤ ⅓ of subscription price. Base ≤ ₹3/user/month,
   Pro ≤ ₹33/user/month. A feature that can't fit the budget doesn't ship.

---

## 2. The four personas

Port **verbatim** from Ishan-AI-Coach `agent/personas.py` — do not rewrite, rename,
merge, or "improve" their voices. The founder authored these and they are final:

| Key | Name | Voice |
|---|---|---|
| `scientist` | The Scientist | Data-driven, precise, evidence-first. "The research shows…", leads with numbers, explains why. |
| `energizer` | The Energizer | High-energy, celebratory, fun. Short punchy sentences, hypes every win. |
| `warrior` | The Warrior | Tough-love, disciplined, no excuses. Direct, military metaphors, never demeaning. |
| `sage` | The Sage | Calm, patient, philosophical. Long-term view, nature metaphors, "trust the process". |

**Scope of persona influence — EVERYTHING the coach writes, on BOTH tiers:**
training-plan prose, weekly summaries, pre/post-run briefs and analyses, challenge
explanations, proactive nudges, promotion messages, chat replies, and the TTS voice
preset. There is no surface where the coach speaks in a generic voice.

Mechanics:

- Stored on `runner_profiles.coach_style` (`scientist|energizer|warrior|sage`).
- Chosen at **onboarding** via 4 coach cards, with a "Recommended for you" badge
  computed from profiling answers (data/metrics-oriented → Scientist; needs
  motivation/fun → Energizer; discipline-seeking → Warrior; calm/long-term/
  injury-wary → Sage).
- Switchable anytime in settings. A switch affects **future content only** — never
  regenerate past texts.
- **Memory is shared across personas.** One brain, four voices. Switching coach must
  never lose what the coach knows.
- RAG retrieval boosts the active persona's corpus file (`coach_<persona>.md`) 1.3×.
- Each persona has a browser-TTS voice preset (rate/pitch + ranked voice names, from
  prototype `ui/voice.py`).

Naming: the feature is simply the **AI Coach** — no separate brand name. The
personas keep their archetype names exactly as listed above.

---

## 3. Progression — read carefully, this is where the build deviated

**There is exactly ONE progression system in this app: the existing 40-level
classification engine** at `server/src/engine/classification-engine.ts`
(levels B1–B10, I1–I10, A1–A10, P1–P10, with its own advancement/regression rules,
safety rails, and calibrating/provisional/validated states).

The prototype's per-coach 10-level cycles (`coaching/cycles.py` — Lab Protocol,
Adventure Ladder, The Forge, The Path) are **NOT to be ported as a progression
system.** Do not create a second (or third) ladder. Do not store a separate
"training level" per user. Do not add a `set_training_level` tool. The app already
has XP levels (gamification) and classification levels (training maturity); a third
system is the conflict the founder flagged.

What we take from the cycles instead is **flavor only** — a static **presentation
layer**:

- A config file maps each of the 40 classification levels to a themed rank name per
  persona. Example: classification level `I3` displays as a "Lab Protocol" phase for
  a Scientist user, a "Forge" rank for a Warrior user, an "Adventure Ladder" rung
  for an Energizer user, a "Path" stage for a Sage user.
- Persona-voiced promotion/demotion message templates fire when
  `classification-engine.ts` changes a user's level — the engine decides, the
  persona narrates.
- Surfaced on the dashboard AthleteCard and in classification API responses.

**No new progression logic. Zero. The classification engine is the only judge of
level.** The coach may *reference* the user's level and what graduating requires
(read from the engine), but can never set it.

---

## 4. Tier matrix — ₹9 vs ₹99 (exact behavior)

There is **no free tier**. Plan keys are `base` and `pro`
(`subscription_plans` table; middleware hierarchy `{free:0, base:1, pro:2}` where
`free` = no active subscription = locked previews only).

| Capability | **Base ₹9/mo** | **Pro ₹99/mo** |
|---|---|---|
| Direction of communication | **One-way.** Coach writes to the user; user cannot reply. | **Two-way.** Chat + voice. |
| Persona selection | ✅ | ✅ |
| Persona-voiced training plan prose, pace/HR zones | ✅ | ✅ |
| Persona-voiced weekly summary (Sunday evening, user's timezone) | ✅ | ✅ |
| Persona-voiced post-run analysis (auto, after every run) | ✅ | ✅ |
| Persona-voiced pre-run brief | ✅ | ✅ |
| Proactive nudges (in-app notifications, ≤3/week) | ✅ | ✅ |
| Persona level names + promotion messages | ✅ | ✅ |
| Chat | **3 trial messages/month** (Haiku) + locked chat tab with persona preview + upgrade CTA | **30 Sonnet messages/month, max 5/day**, visible remaining counter |
| Voice (mic in, spoken reply) | ❌ | ✅ browser-native, unlimited, en-IN/hi-IN |
| Pre/post-run check-ins (coach opens a conversation about the run) | ❌ | ✅ Haiku, 2/day, does NOT consume the 30-message pool |
| Plan changes via conversation (propose → user approves) | ❌ | ✅ |
| Injury-rehab dialogue, nutrition Q&A, race-day strategy chat | ❌ | ✅ |
| Adaptive engine, transformation plans, weekly challenges, PRs, create communities | per existing plan seeding | ✅ |
| AI memory (coach remembers you) | learns silently from runs/profile | ✅ + learns from conversations |

**Lapsed subscription:** the plan that was already generated stays **view-only**;
auto-tracking of runs continues; no new generation, adaptation, chat, or nudges.

**Why this split matters for your build:** the ₹9 tier is *not* "no AI". It is the
full one-way generation pipeline. If the Base experience is hardcoded template
strings, the build is wrong.

---

## 5. Coach responsibilities catalog

Every row says who computes the truth (engine) and who writes the words (model).
"Batch" = Anthropic Message Batches API (50% discount), nightly per user timezone.

| # | Responsibility | Trigger | Truth source (engine) | Words (model) | Tier |
|---|---|---|---|---|---|
| R1 | Tier & level classification | run cascade / weekly | `classification-engine.ts`, `tierClassifier.ts` | none (numbers) + persona promotion template | both |
| R2 | Pace & HR zones | profile/runs change | `paceCalculator.ts`, `heartRateZones.ts` | none | both |
| R3 | Training plan generation | goal set | `trainingPlanGenerator.ts` (VDOT) | Haiku: persona intro + per-week framing prose | both |
| R4 | Adaptive plan adjustment | weekly / signals | `adaptiveEngine.ts` (ACWR/TSB) + guardrails | Haiku: persona explanation of the change | both |
| R5 | Post-run analysis | every logged run (nightly batch) | `coachingOutputs.ts` post-run scoring | Haiku: persona paragraph, stored once | both |
| R6 | Pre-run brief | day of planned session | `coachingOutputs.ts` brief | Haiku: one persona paragraph (generated in prior night's batch) | both |
| R7 | Weekly summary | Sunday evening, user TZ (batch) | weekly stats queries | Haiku: persona summary → `coach_notes` + notification | both |
| R8 | Weekly challenges | weekly | `challengeGenerator.ts` | Haiku: one-line persona explanation per challenge | per plan |
| R9 | Proactive nudges | nightly batch evaluation | `proactiveCoach.ts` signals (missed sessions, load spike, PR streak, race-in-7-days) | Haiku: persona nudge text, ≤3/user/week | both |
| R10 | Transformation journey | onboarding/goal | `transformationPlan.ts` | Haiku framing prose | per plan |
| R11 | **Chat** | user message | tool calls into all engines above | **Sonnet**, streaming, agent loop (§7) | Pro (+3 trial Base) |
| R12 | Pre/post-run check-ins | run logged / session day | run data + plan | Haiku conversation seed, 2/day | Pro |
| R13 | Plan change via chat | conversation | `propose_plan_change` → user approves → guardrails + `adaptiveEngine` apply | Sonnet proposes, engine applies | Pro |
| R14 | Event/community awareness | brief/chat context | events queries (`get_upcoming_events`) | woven into R6/R11 | both |

Every generated text: validated by guardrails (§8), persona-voiced, grounded ONLY in
engine outputs + RAG + memory, **generated once and stored** (never regenerated on
page view), falls back to the current deterministic template when
`ANTHROPIC_API_KEY` is missing or the `ai_generation` feature flag is off.

---

## 6. The brain — RAG, memory, prompt assembly

### 6.1 RAG (port the prototype's design, in TypeScript)

- Corpus lives in a **DB table** (`knowledge_documents`), editable in the admin
  panel, with a "Rebuild index" action. Seed from the prototype's 13 files
  (9 general + 4 `coach_*.md`), tier-mapped spark→beginner, pace→intermediate,
  tempo+apex→advanced, **plus 4 new files**: `nutrition.md`, `race_day.md`,
  `injury_rehab.md`, `sleep.md`. All content **Indianized** (heat/AQI/monsoon
  training, TMM/ADHM, vegetarian fueling). New/changed content is drafted for
  founder approval — nothing reaches the live corpus without it.
- Chunking: by `##`/`###` headers + 800-char sliding window / 150 overlap.
- Embeddings: `@xenova/transformers` running `all-MiniLM-L6-v2` **locally** (384-dim,
  no API key, ₹0). Stored as BLOBs in `knowledge_chunks`.
- Retrieval: hybrid **dense cosine + BM25**, fused with Reciprocal Rank Fusion
  `1/(60+rank)`; boosts: 1.3× user's tier file, 1.3× active persona file; **top-k 3**.
- Injection: a `## RELEVANT KNOWLEDGE` section in the prompt. RAG feeds **both** Pro
  chat and all Base-tier generation (R3–R10).
- Retrieval queries are always **English** (the chat model translates the user's
  Hindi/Hinglish question when calling the `retrieve_knowledge` tool — MiniLM is
  English-centric).
- Graceful: if the index is missing, the coach works without RAG (`RAG_ENABLED`).
- **Web scraping/search:** a welcome capability to keep developing in the lab
  (useful for race calendars, weather/AQI, current running knowledge). Before it
  ships in-app it must be: cost-capped, restricted to an allowlist of sources,
  latency-bounded in chat, and it can never override engine numbers or guardrails.
  It feeds the coach context — it does not become a user-facing browsing feature.

### 6.2 Memory (port the prototype's model, replace the app's keyword matching)

- One `memories` table keyed to the app's existing `users.id`:
  `{user_id, category, content, confidence, status, created_at, last_accessed}`.
- **Never-forget set** (always in prompt, no decay): active injuries (status
  lifecycle active→recovering→resolved), health conditions, race goal + date, hard
  constraints (schedule, diet/vegetarian, age), persona choice.
- **Decay set** (prototype formula `confidence × exp(-0.03 × days)`, ~23-day
  half-life, top-8 injected): preferences, topics, sentiment trend, casual mentions.
- Extraction runs as a **nightly Haiku batch** over the day's chat messages and
  logged runs — NOT per-message. Regex patterns from the prototype's extractor are
  the no-API fallback.
- Migrate the existing `ai_profiles` JSON arrays into the new table.
- Chat history is capped at **90 days** (cron purge); memory retains the essence.

### 6.3 Prompt assembly (cache-friendly — this is a cost requirement, not a style)

Order matters. Frozen prefix first, `cache_control` breakpoint, volatile after:

```
[CACHED PREFIX — byte-stable, no timestamps/IDs]
1. Base identity: "You are <persona name>, an AI running coach for Sprint Society…"
2. Persona voice block + few-shot lines (from coach_<persona>.md)
3. Safety rules (§8)
4. Language rule: "Mirror the user's language and script — English, Hindi, or
   Hinglish. Keep technical terms simple."
--- cache_control breakpoint ---
[VOLATILE]
5. Runner profile block (from runner_profiles + classification level + persona rank name)
6. Never-forget memories
7. Decayed memories (top-8)
8. ## RELEVANT KNOWLEDGE (RAG top-3)
9. Current plan week summary
```

Verify caching works: an integration test must assert
`usage.cache_read_input_tokens > 0` on the second message of a conversation.

---

## 7. Chat mechanics (Pro)

- **Endpoint:** SSE streaming (`GET /api/ai/chat/stream`), model `claude-sonnet-4-6`,
  `max_tokens` 600.
- **Agent loop:** standard Anthropic tool-use loop, max 4 iterations; on a malformed
  tool call, retry the turn once without tools.
- **Tools** (wrap existing engines — no new logic):
  `retrieve_knowledge`, `get_runner_profile`, `get_recent_runs`,
  `calculate_pace_zones`, `get_current_plan`, `get_training_load`,
  `predict_race_time` (VDOT formulas, NOT ML), `get_upcoming_events`, `log_memory`,
  and `propose_plan_change`.
- **`propose_plan_change` is propose-only.** It returns a structured proposal; the
  client renders an Approve/Decline card; approval hits
  `POST /api/ai/plan-proposals/:id/approve`, which applies the change **through
  guardrails + adaptiveEngine**. The model can never mutate a plan directly.
- **History:** last 8 messages + a rolling conversation summary. Never the full log.
- **Quotas:** Pro = 30 Sonnet messages/month, max 5/day, tracked in `ai_usage` with
  token + cost columns; UI shows "N left this month"; friendly persona-voiced
  limit message at 0. Base = 3 Haiku trial messages/month. Check-ins (R12) run on
  Haiku with a separate 2/day cap and do not consume the Sonnet pool.
- **Languages:** mirror the user (English/Hindi/Hinglish).
- **Voice:** browser-native only (Web Speech API STT + `speechSynthesis` TTS),
  persona voice presets, en-IN/hi-IN toggle, voice mode appends "keep responses
  under 80 words, conversational". No server voice endpoints, no cloud TTS, no keys.
- **One continuous conversation** per user. No threads.
- Chat lives in the existing Coach tab; quick-reply chips ("Analyze my last run",
  "I'm feeling sore", "Adjust this week") steer users to short, cheap exchanges.

---

## 8. Guardrails (safety layer — wraps every output)

- **Input screening:** red-flag keywords (chest pain, dizziness, fainting, sharp
  pain) → **hard-block coaching advice**; respond only with a persona-appropriate
  medical disclaimer + see-a-professional message; session stays in cautious mode.
- **Plan validation** (adapted from prototype `engine/guardrails.py`, merged with
  the existing ACWR rails in `adaptiveEngine.ts`):
  - beginner: ≤15 km/week, no intervals/tempo, ≥3 rest days
  - intermediate: ≤40 km/week
  - advanced: ≤80 km/week
  - everyone: ≤10% weekly volume increase, mandatory rest day
- Every generated plan change and every generated text passes validation before it
  is saved or shown. A failed validation falls back to the deterministic output.

---

## 9. Cost rules (non-negotiable)

Budget: **Base ≤ ₹3/user/month, Pro ≤ ₹33/user/month.** The design hits this via:

1. **Haiku for everything one-way**, Sonnet only for live Pro chat.
2. **Message Batches API** (50% off) for ALL background generation + nightly memory
   extraction.
3. **Prompt caching** per §6.3.
4. Quotas per §7 (the current code's 30 messages/**day** is wrong — it burns a month's
   budget in a day; it becomes 30/**month**).
5. Generate-once-store-forever.
6. Per-user monthly cost ledger in `ai_usage`; warning at 80% of budget; the
   `ai_chat`/`ai_generation` feature flags are the kill switch that degrades to
   deterministic templates instantly.

---

## 10. Data & privacy rules

- **Admin can never read user chats.** No conversation content in any admin view,
  log, or export. Admin sees aggregates only: cost/user, messages/user, anonymized
  topic counts. Safety is automated guardrails, not human review.
- Users can view and delete what the coach remembers (AI Profile page).
- The corpus-enhancement pipeline may see anonymized **topics**, never chat content.
- All AI tables key to the app's existing `users.id`.

---

## 11. Product rules that must not be violated (the deviation list)

Capabilities are open for enhancement; these product rules are not. Wherever the
coach is built, it must respect:

| ❌ Deviation | ✅ Instead |
|---|---|
| A second progression/level system (10-level cycles, `set_training_level` tool, a `training_level` column) | Persona **rank-name config** over the existing 40-level `classification-engine.ts` (§3) — this is the deviation already observed; undo it |
| Inventing product features not in §4/§5 (new screens, new mechanics, new user-facing systems) | Ask the founder first; the catalog is the scope |
| New/rewritten/renamed personas, or persona-specific memory | The 4 personas verbatim; shared memory |
| Re-implementing pace/VO2max/plan/load math in the coach | Consume the app's `server/src/engine/*` outputs (tool calls in production) |
| The coach directly editing training plans | `propose_plan_change` → user approves → guardrails apply |
| Synthetic-data ML models (RandomForest/MLP) deciding anything user-facing | VDOT formulas + `adaptiveEngine.ts` heuristics already in the app |
| Daily chat allowance of 30 | **30/month**, 5/day cap (₹33 budget) |
| Hardcoded "Coach:" template strings as the Base experience | The full Haiku batch generation pipeline (R3–R10) IS the ₹9 product |
| Per-message memory extraction, full chat history in prompts (in production) | Nightly batch extraction; 8-message window + rolling summary |
| Admin-readable conversations | Aggregates only (§10) |
| **At the production integration boundary:** non-Anthropic models, a separate user database, cloud STT/TTS or API embeddings | `claude-sonnet-4-6` + `claude-haiku-4-5`; app DB keyed to `users.id`; browser Web Speech API + local MiniLM (₹0) — lab experiments with other stacks are fine, production isn't |

---

## 12. Definition of done (acceptance checklist)

- [ ] A ₹9 user who logs a run gets a persona-voiced analysis by next morning,
      a brief on session days, a summary Sunday evening (their timezone), and nudges
      when they slack — without ever typing a message.
- [ ] A ₹99 user chats (text or voice, English/Hindi/Hinglish) with a coach that
      reads their actual plan, proposes changes they approve with a tap, and
      remembers their injuries — in their chosen persona's voice.
- [ ] Switching persona changes the voice of all future content and nothing else;
      memory survives the switch.
- [ ] Exactly one level system exists; the dashboard shows persona-themed rank names
      mapped from `classification-engine.ts` levels.
- [ ] `ai_usage` ledger proves ≤₹3 (Base) and ≤₹33 (Pro) per active user/month at
      ~12 runs and full quota usage; cache reads are non-zero in chat.
- [ ] Turning off the `ai_chat`/`ai_generation` flags instantly returns the app to
      deterministic templates with no errors.
- [ ] No admin surface exposes conversation content.
- [ ] Guardrails: a "chest pain" message gets only a medical disclaimer; a proposed
      30% volume jump is rejected.
- [ ] Typecheck + tests green; `docs/USER-GUIDE.md` and `docs/PM-GUIDE.md` updated.

---

*Companion docs: `docs/IMPROVEMENT-PLAN.md` (wave-by-wave execution plan with Opus
prompts), `CLAUDE.md` (repo conventions). Questions → the founder, before building.*
