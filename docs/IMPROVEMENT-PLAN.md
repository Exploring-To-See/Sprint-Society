# Sprint Society — Production Plan v2 (AI Coach)

> Decisions locked 2026-06-12 after founder Q&A. Supersedes v1 sections where they
> conflict. Execute as Opus 4.6 waves — ready-to-run prompts in §8.

---

## 0. Diagnosis (unchanged from v1, two bugs added)

Foundation is good: 13 deterministic engines, React Query + code-split client, real
token system. Problems are execution-level:

- **Lag**: 4–8 queries per page (AIAnalyticsTab fires 7), 30s polling, heavy Framer
  Motion stagger, leaflet/html-to-image in main bundle, N+1 queries on feed/events/admin.
- **Disconnected**: silent `.catch(() => {})` everywhere, inconsistent API shapes,
  dead duplicate pages, half-built features (push, email reset, Razorpay, flags).
- **Confirmed bugs**:
  1. `middleware/subscription.ts` hierarchy is `{free, pro, premium}` but DB seeds
     `base`/`pro` → **paying ₹9 users resolve to `undefined` and fail every gate**.
  2. `ai.service.ts:235` calls model `claude-sonnet-4-6-20250514` — **invalid model
     ID** (correct: `claude-sonnet-4-6`). Every chat call 404s once the key is set.
     Haiku ID `claude-haiku-4-5-20251001` is valid.
- **AI feels average**: one Sonnet call + context dump + keyword memory. No RAG, no
  tools, no personas, no voice. Chat tab is a "Coming Soon" stub.

---

## 1. Locked product decisions

### Brand & personas
- Naming: the feature stays the **AI Coach** — no separate brand name. (Kendu remains the in-app currency only.)
- **4 personas ship verbatim from Ishan-AI-Coach** (`agent/personas.py`) — The
  Scientist, The Energizer, The Warrior, The Sage. Do NOT rewrite their voices.
- Persona colors **everything**: training plan prose, weekly summaries, pre/post-run
  briefs, post-run analyses, challenges copy, proactive nudges, chat, TTS voice preset.
- Picked at onboarding with a **suggested match** derived from profiling data
  (`coach_style`, `why_run`, `bad_run_response`, fitness goals). Switchable anytime
  in settings; switch affects future content only.
- Persona-boosted RAG retrieval (1.3× own coach corpus file, like the prototype).
- Memory is **shared** across personas (one brain, four voices).

### Progression ("cycles" decision)
- Do NOT port the prototype's separate 10-level cycles. Instead: a **persona
  presentation layer over the existing 40-level classification engine**
  (`classification-engine.ts`, B1–P10). Static config maps each of the 40 levels to
  a persona-themed rank name per coach (Scientist "Lab Protocol", Energizer
  "Adventure Ladder", Warrior "The Forge", Sage "The Path") + persona-voiced
  promotion/demotion messages. One source of truth for progression. Launch scope.

### Tiers (no free tier)
| | **Base ₹9/mo** | **Pro ₹99/mo** |
|---|---|---|
| Coach communicates | One-way: plans, summaries, briefs, analyses, nudges — all persona-voiced | Everything in Base + **two-way chat + voice** |
| Chat | 3 trial messages/month (Haiku) + locked chat tab with upsell | **30 Sonnet messages/month, max 5/day** (UI shows remaining) |
| Check-ins | — | Pre/post-run check-ins (Haiku, 2/day, don't consume the Sonnet pool) |
| Voice | — | Browser-native STT+TTS, unlimited, ₹0 |
| Extra Pro roles | — | Injury rehab dialogue, nutrition Q&A, race-day strategy chat |
| Lapsed sub | Plan stays **view-only**, auto-tracking continues, no adaptation/generation | same |
- Persona selection available on both tiers.
- Razorpay: wire + test fully end-to-end pre-launch; founder flips live keys (SS-031).

### AI budget (hard constraint: API cost ≤ ⅓ of fee)
- **Base: ₹3/user/mo. Pro: ₹33/user/mo.** (≈ $0.035 / $0.39 at ₹85/$.)
- Verified pricing (2026-06): Sonnet 4.6 $3/$15 per MTok; Haiku 4.5 $1/$5; prompt
  cache reads ≈0.1× input price; **Message Batches API = 50% off everything batchable**.
- Cost model:
  - Base ≈ ₹2.8/mo: 4 weekly summaries + ~12 post-run analyses + brief enrichment +
    memory updates, ALL on Haiku via nightly/Sunday **batch jobs** (50% off).
  - Pro ≈ ₹31/mo: Base ₹3 + 30 Sonnet chat msgs ≈ ₹22 (cached system prompt,
    max_tokens 600) + check-ins ≈ ₹6 + voice ₹0.
- **Token-burn rules (apply everywhere):**
  1. Prompt caching: frozen prefix order = persona block → safety rules → corpus
     boilerplate, `cache_control` breakpoint there; volatile user context AFTER it.
     No timestamps/IDs in the cached prefix.
  2. Batch API for all background generation + nightly memory extraction.
  3. Haiku for every one-way text; Sonnet only for live Pro chat.
  4. Chat history window 8 messages + rolling conversation summary (no full history).
  5. RAG top-k 3, chunks small.
  6. Quick-reply chips steer to short exchanges; voice mode appends "under 80 words".
  7. **Generate once, store forever**: analyses/summaries written to DB, never
     regenerated on page view.
  8. Per-user monthly token ledger in `ai_usage`; alert at 80% of budget;
     kill-switch flag degrades to deterministic templates.
- Models: Anthropic only. `claude-sonnet-4-6` (chat), `claude-haiku-4-5` (everything
  else). Embeddings local (@xenova/transformers MiniLM) = ₹0. Voice browser-native = ₹0.

### Coach roles (complete list)
Tier classification, pace zones, plan generation + adaptive adjustment
(**confirm-then-change**: coach proposes, user taps approve, guardrails validate),
weekly challenges (persona-explained), transformation journey, weekly summary,
pre/post-run briefs + analyses, proactive nudges (in-app notifications, max ~3/week,
persona-voiced, generated in nightly batch), pre/post-run check-ins (Pro, launch
scope), event/community awareness ("Sunday club run fits your long-run slot"),
nutrition guidance, race-day strategy, injury rehab (Pro), sleep guidance.

**LLM vs deterministic split:** all numbers, schedules, zones, loads, classifications
stay deterministic engines (they're already good). All **prose** becomes
persona-voiced LLM text grounded in those engine outputs + RAG + memory. Engines
never hallucinate; the LLM never does math.

### Chat & voice UX
- Streaming responses (SSE) with typing indicator fallback.
- One continuous conversation; history capped at 90 days (memory retains essence).
- Lives in the existing Coach tab (ChatTab). ChatFAB deep-links there.
- Quick-reply chips: "Analyze my last run", "I'm feeling sore", "Adjust this week".
- Languages: **English / Hindi / Hinglish** — system prompt says "mirror the user's
  language and script". Corpus stays English; the `retrieve_knowledge` tool is always
  queried in English (model translates the query when calling the tool — MiniLM is
  English-centric). Voice: en-IN / hi-IN language toggle.
- Voice both ways (mic in, spoken reply), browser Web Speech API, persona voice
  presets (rate/pitch + ranked voice names, from prototype `ui/voice.py`). Feature-
  detect; iOS Safari needs a user gesture before TTS. Free now; cloud TTS later.

### Memory & personalization
- Never forget (no decay, always in prompt): active injuries + health conditions,
  race goal + date, hard constraints (schedule, diet/vegetarian, age), persona choice.
- Decay (λ=0.03, ~23-day half-life, prototype formula): preferences, topics,
  sentiment trend, casual mentions. Top-8 injected.
- Extraction: **nightly Haiku batch** over the day's messages + logged runs (not
  per-message). Regex fallback when API unavailable.
- Runs auto-feed everything (smart app): run logged → cascade queues analysis,
  memory update, load recalc, nudge evaluation. User never asks for value.
- AI Profile page: user can view + delete what the coach remembers. Launch scope.
- **Privacy: admin can never read chats.** Admin sees aggregates only (cost/user,
  msgs/user, anonymized topic counts). Safety = automated guardrails, no human review.

### Safety
- Red-flag keywords (chest pain, dizziness, fainting, sharp pain) → hard-block
  coaching advice, medical-disclaimer response only, cautious mode for the session.
- Per-tier guardrail caps adapted from prototype `engine/guardrails.py`
  (beginner: ≤15km/wk, no intervals/tempo, ≥3 rest days; intermediate ≤40; advanced
  ≤80; 10% weekly increase cap; merged with existing ACWR rails). Plan changes and
  generated prose are validated before save/send. No age gate (founder decision).

### Knowledge corpus
- Stored in DB (content blocks), **edited in admin panel**, with "Rebuild index"
  action (re-chunk + re-embed, ~seconds at this scale).
- Import 9 non-persona + 4 persona files from Ishan-AI-Coach; tier-map
  spark→beginner, pace→intermediate, tempo+apex→advanced.
- **Content pass: Indianize + extend** — heat/humidity/AQI/monsoon training, Indian
  races (TMM, ADHM, Vedanta etc.), vegetarian/Indian fueling; NEW files: nutrition.md,
  race_day.md, injury_rehab.md, sleep.md (the new coach roles need corpus to stand on).
- **AI enhancement pipeline**: scheduled job drafts corpus additions/improvements
  into a review queue in admin; founder one-tap approves → live + re-index. The AI
  never silently edits live coaching knowledge.
- RAG feeds both Pro chat AND all Base-tier generation. Skip web search.

### Ops & launch
- Timezone column on users (default Asia/Kolkata); weekly summary batch runs Sunday
  evening per user's timezone.
- Kill switch: wire the existing feature-flags table; flags `ai_chat`, `ai_voice`,
  `ai_generation` degrade to deterministic templates instantly.
- Metrics dashboard (admin): WAU, runs/user/week, chat msgs/user/week, AI cost/user,
  plan adherence %, Base→Pro conversion, D7/D30 retention, persona distribution.
- SQLite OK to ~500 users; nightly `sqlite3 .backup` to object storage + restore doc.
- Launch ASAP: 50 beta testers, open signup, then widen. **Nothing is cut** — every
  feature is finished in waves; anything unverified by beta day is hidden behind a
  flag, not deleted, and re-enabled when verified.
- Quality gate on every wave: typecheck + tests green before merge (founder approved).

---

## 2. Wave plan

| Wave | Parallel Opus sessions | Outcome |
|---|---|---|
| 1 | (a) tier fix + model-ID fix + gating audit, (b) silent failures + API envelope, (c) N+1 + indexes + timezone column, (d) env validation + feature-flag wiring (kill switch) | Nothing broken for a paying user |
| 2 | (a) batch endpoints + client adoption, (b) animation/bundle/image budget, (c) WebSocket notifications | Strava feel |
| 3 | (a) RAG pipeline + corpus import + DB corpus store, (b) memory v2 + guardrails, (c) personas + prompt assembly + persona suggestion + level-name layer | AI Coach brain |
| 4 | (a) agent tool loop + streaming chat endpoint + budget caps, (b) Base generation pipeline (batch jobs), (c) chat UI + voice + chips + languages | AI Coach live |
| 5 | (a) proactive nudges + check-ins + event awareness, (b) corpus admin editor + AI enhancement queue, (c) AI Profile page + metrics dashboard | Smart app |
| 6 | (a) tests + CI, (b) logging + Sentry + backups, (c) Razorpay end-to-end + subscription lifecycle, (d) design polish pass (type scale, icons, skeletons, persona picker) | Production ready |
| 7 | `/audit` + `/sprint-team` review, fix wave, beta-day flag review | Launch |

---

## 3. Ready-to-run Opus 4.6 prompts

Every prompt ends with: *"Quality gate: npm run build passes, typecheck clean, new
code has vitest coverage, docs/USER-GUIDE.md and docs/PM-GUIDE.md updated."*

**Wave 1a — tier + model ID**
```
Two production-blocking bugs. (1) server/src/middleware/subscription.ts uses
PLAN_HIERARCHY {free, pro, premium} but server/src/database/db.ts:186-208 seeds plan
keys 'base'(₹9)/'pro'(₹99) — paying Base users resolve to undefined and fail every
requirePlan check. Change hierarchy to {free:0, base:1, pro:2}, remove 'premium',
audit EVERY requirePlan/getUserPlan call site against this matrix: Base = plans,
summaries, briefs, analyses, pace/HR zones, events, communities, social, leaderboard,
persona selection. Pro = + AI chat/voice/check-ins, adaptive engine, transformation
plans, weekly challenges, create communities, PRs, injury-rehab/nutrition/race chat.
Free (no sub) = registration + locked previews only; there is NO free tier of features.
Lapsed subscription: plan becomes view-only, auto-tracking continues, no adaptation.
(2) server/src/services/ai.service.ts:235 uses invalid model 'claude-sonnet-4-6-20250514'
— replace with 'claude-sonnet-4-6'. Centralize model IDs in config (CHAT_MODEL,
BACKGROUND_MODEL='claude-haiku-4-5'). Also fix chatWithSonnet hardcoding
checkUsageLimit(userId,'pro'). Vitest tests for getUserPlan/requirePlan across
free/base/pro/expired.
```

**Wave 1b — silent failures + envelope** (unchanged from v1 §7)

**Wave 1c — N+1 + indexes + timezone**
```
Fix N+1 queries: rewrite social.routes.ts:23-34 (4 correlated subqueries per feed
activity), events.routes.ts:66-67 (friendsGoing per event in a loop),
admin.routes.ts:33-42 (3 subqueries per runner) as JOIN+GROUP BY. Add indexes:
ai_usage(user_id, created_at), community_chat_messages(community_id, created_at),
kendu_transactions(user_id, created_at). Add users.timezone TEXT DEFAULT
'Asia/Kolkata' migration + expose in profile edit. Benchmark feed endpoint before/after.
```

**Wave 1d — env validation + kill switch**
```
(1) Startup env validation: fail fast in production when JWT_SECRET missing/short;
remove hardcoded fallback in websocket.ts:28; loud warnings for ANTHROPIC_API_KEY,
RAZORPAY_*, GOOGLE_CLIENT_ID. (2) Wire the existing feature_flags table (currently
dead): server-side isFlagEnabled() helper + GET /api/flags for the client; create
flags ai_chat, ai_voice, ai_generation, plus one flag per launch-risky feature.
When ai_* flags are off, AI surfaces degrade to the deterministic template text
(current behavior) — this is the AI kill switch for API outages or cost spikes.
Admin panel toggle UI exists (admin-flags.routes.ts) — verify it works end to end.
```

**Wave 3a — RAG + corpus store** (v1 §7 wave 3a, plus)
```
...additionally: store corpus in a 'knowledge_documents' DB table (source of truth)
instead of repo files; import the 13 prototype files (9 general + 4 coach_*.md
persona-voice files); seed migration. Indianization content pass and the 4 new files
(nutrition.md, race_day.md, injury_rehab.md, sleep.md) are a SEPARATE content task —
create them as well-structured drafts covering: heat/humidity/AQI/monsoon training,
Indian race calendar (TMM, ADHM), vegetarian/Indian-diet fueling, race-day execution,
return-from-injury protocols, sleep & recovery. Mark drafts clearly for founder review.
Retrieval: hybrid dense cosine + BM25, RRF fusion 1/(60+rank), tier boost 1.3x own
tier, persona boost 1.3x active coach_*.md file, top-k 3.
```

**Wave 3b — memory v2 + guardrails** (v1 §7 wave 3b, with changes)
```
...changes from v1: extraction runs as a NIGHTLY Haiku job via the Anthropic Message
Batches API (50% discount) over each user's day of chat messages and logged runs —
not per-message. Never-forget set (always in prompt, no decay): active injuries,
health conditions, race goal+date, hard constraints (schedule/diet/age), persona.
Decay set (confidence * exp(-0.03*days)): preferences, topics, sentiment, casual
mentions, top-8. Memory is shared across personas. Red-flag input screening (chest
pain, dizziness, fainting, sharp pain) hard-blocks coaching advice with a medical
disclaimer. Chat history hard-capped at 90 days (cron purge).
```

**Wave 3c — personas + prompt assembly**
```
Port the 4 personas VERBATIM from Ishan-AI-Coach agent/personas.py (The Scientist,
The Energizer, The Warrior, The Sage — do not rewrite their voice definitions) into
server/src/ai/personas.ts. Build promptAssembly.ts producing the layered system
prompt in CACHE-FRIENDLY order: [cached prefix: base identity ("You are <persona>,
an AI running coach for Sprint Society"), persona voice block + few-shot lines from
coach_*.md, safety rules, language rule ("mirror the user's language — English,
Hindi, or Hinglish — and keep technical terms simple")] + cache_control breakpoint +
[volatile: runner profile, never-forget memories, decayed memories, RAG chunks,
current plan week]. Persona selection: store on runner_profiles.coach_style
(scientist|energizer|warrior|sage); onboarding step with 4 coach cards + a
"recommended for you" badge computed from profiling answers (mapping: data/metrics
oriented→Scientist, needs motivation/fun→Energizer, discipline/no-excuses→Warrior,
calm/longterm/injury-wary→Sage); switchable in settings (future content only).
Level-name layer: static config mapping all 40 classification-engine levels
(B1..P10) to themed rank names per persona (Scientist 'Lab Protocol', Energizer
'Adventure Ladder', Warrior 'The Forge', Sage 'The Path') + persona-voiced
promotion message templates; surface in dashboard AthleteCard and classification
responses. NO new progression logic — presentation over classification-engine.ts only.
```

**Wave 4a — agent loop + streaming + budgets**
```
Convert chat to an Anthropic tool-use agent loop with SSE streaming. Loop: while
stop_reason==='tool_use' (max 4 iters), execute, append tool_result; on malformed
tool call retry once without tools. Tools wrap EXISTING engines: retrieve_knowledge
(English queries), get_runner_profile, get_recent_runs, calculate_pace_zones,
get_current_plan, propose_plan_change (returns a structured proposal — does NOT
apply; client renders Approve/Decline; POST /api/ai/plan-proposals/:id/approve
applies it through guardrails + adaptiveEngine), get_training_load,
predict_race_time (VDOT), log_memory. Model claude-sonnet-4-6, max_tokens 600,
prompt caching per promptAssembly contract (verify usage.cache_read_input_tokens>0
in an integration test). Budget enforcement: monthly pool 30 Sonnet msgs (Pro),
daily cap 5, Base trial 3 Haiku msgs/month; ai_usage tracks tokens+cost per user;
80%-of-budget warning surfaced in chat; limit-reached returns the friendly persona
message. History: last 8 messages + rolling summary. Streaming endpoint
GET /api/ai/chat/stream (SSE).
```

**Wave 4b — Base generation pipeline**
```
Replace all hardcoded coaching prose with persona-voiced Haiku text via the Message
Batches API. Nightly batch (per user timezone-aware): post-run analysis for each
new run (replaces template in RunTrackerPage post-run screen + run detail),
memory extraction, nudge evaluation, next-day pre-run brief enrichment of
coachingOutputs.ts. Sunday-evening batch (user timezone): weekly summary to a
coach_notes table + in-app notification. All grounded in engine outputs + RAG +
memory, validated by guardrails, persona-voiced, generated ONCE and stored.
Fallback to current deterministic templates when ANTHROPIC_API_KEY missing or
ai_generation flag off. Weekly challenge cards get a one-line persona explanation
(generated in the same batch). Cost ledger must show ≤₹3/user/month at 12 runs.
```

**Wave 4c — chat UI + voice + languages** (v1 §7 wave 4a, plus)
```
...additionally: SSE streaming bubbles; quick-reply chips ('Analyze my last run',
'I'm feeling sore', 'Adjust this week'); remaining-quota indicator ('23/30 left this
month'); plan-change proposal cards with Approve/Decline buttons; persona avatar +
name in header with settings link to switch coach; Base users see the tab locked
with persona preview + 3 trial messages + upgrade CTA. Voice: persona voice presets
(VOICE_STYLES from prototype ui/voice.py — Scientist strong/even, Energizer
fast/bright pitch 1.15, Warrior deep/commanding pitch 0.8, Sage calm/warm rate 0.9),
en-IN/hi-IN STT language toggle, TTS picks a hi-IN voice when the reply is Hindi.
```

**Wave 5a — proactive coach + check-ins**
```
Proactive nudge engine: evaluate per user in the nightly batch using
proactiveCoach.ts signals (missed 2 sessions, load spike, PR streak, race in 7
days, weather/AQI for their city if available) → at most 3 in-app notifications
per user per week, persona-voiced, deep-linking to the relevant screen. Pre/post-run
check-ins (Pro): post-run, chat opens seeded with the run + a persona opening
question (Haiku, 2/day cap, doesn't consume Sonnet pool); pre-run brief gets a
one-tap 'Ready / Tired / Sore' response that feeds adaptiveEngine readiness.
Event awareness: coach references upcoming joined/nearby events in briefs and chat
via a get_upcoming_events tool.
```

**Wave 5b — corpus admin + AI enhancement queue**
```
Admin panel 'Knowledge' section: list/edit/create corpus documents (markdown editor,
tier + persona tags), 'Rebuild index' button (re-chunk/re-embed, shows chunk count),
version history. AI enhancement pipeline: weekly scheduled job sends corpus + recent
anonymized chat TOPICS (never chat content) to Haiku asking for gap analysis +
drafted additions → rows in a corpus_drafts review queue → admin approves/edits/
rejects → approved drafts merge + auto re-index. Nothing reaches the live corpus
without founder approval.
```

**Wave 5c — AI profile + metrics**
```
Finish AIProfilePage: show what the coach remembers (categorized), delete-memory
buttons, persona switcher, language preference, quota usage. Admin metrics
dashboard: WAU, runs/user/week, chat msgs/user/week, AI cost per user (from
ai_usage ledger) with ₹3/₹33 budget lines, plan adherence %, Base→Pro conversion,
D7/D30 retention, persona distribution. NO conversation content anywhere in admin —
aggregates only.
```

**Wave 6a — tests + CI** (v1 §7 wave 5b, plus persona/RAG/budget/guardrail suites)
**Wave 6b — logging (pino) + Sentry + nightly sqlite backup to object storage + restore doc**
**Wave 6c — Razorpay end-to-end**
```
Complete Razorpay: order creation, checkout, webhook signature verification,
payment_history, subscription activate/renew/expire lifecycle (expiry → view-only
plan mode), upgrade Base→Pro proration choice (simplest: new period), test-mode
E2E test with Razorpay test keys. Leave LIVE keys as env placeholders + a
docs/PM-GUIDE.md launch checklist item for the founder.
```
**Wave 6d — design polish**: semantic type scale, lucide-react icons replacing emoji
mix, one card/button vocabulary, skeletons everywhere, persona picker + chat as the
hero surfaces, share card polish. 375px always.

---

## 4. Launch checklist (beta day, 50 users)

- [ ] Wave 1 bugs verified fixed (a Base user pays ₹9 and everything Base works)
- [ ] ANTHROPIC_API_KEY set on Railway (SS-030); model IDs valid
- [ ] Razorpay live keys flipped by founder (SS-031)
- [ ] Cost ledger shows projected ≤₹3/₹33 per active user
- [ ] Kill-switch flags tested (turn off ai_chat → templates return)
- [ ] Unverified features behind flags (hidden, not deleted)
- [ ] Nightly backup ran + restore tested once
- [ ] Sentry receiving events; CI green on main
- [ ] /audit + /sprint-team review passed
