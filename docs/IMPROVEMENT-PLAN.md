# Sprint Society — Production Readiness & AI Coach Upgrade Plan

> Status: proposed roadmap. Based on a full audit of this repo plus the two AI coach
> prototypes (`Exploring-To-See/sprint-society-ai-coach`, `rg6830303/Ishan-AI-Coach`).
> Designed to be executed as parallel Opus 4.6 sessions — ready-to-run prompts in §7.

---

## 0. Diagnosis — why it feels laggy, disconnected, and average

The foundation is genuinely good: 13 deterministic coaching engines (VDOT plans,
adaptive load, 40-level classification), React Query + code-split routes, a real
design token system. The problems are execution-level, not architectural.

### Why it lags
| Cause | Where |
|---|---|
| 4–8 independent queries fire per page (AI Insights tab fires 7) | `client/src/components/coach/AIAnalyticsTab.tsx` |
| Notifications poll every 30s, chat suggestions every 60s, no backoff | `AppShell.tsx`, `chat/ChatFAB.tsx` |
| Hundreds of `motion.div`s with 0.07s stagger on dashboard mount | `components/dashboard/Dashboard.tsx` |
| No `React.memo`/`useMemo` on list renders (feed, runs, challenges) | `social/FeedTab.tsx` etc. |
| leaflet + html-to-image in main bundle (used on 2 pages) | `client/package.json`, no dynamic import |
| Full-res images, no `loading="lazy"`, no aspect-ratio hints (CLS) | feed/avatars everywhere |
| Correlated-subquery N+1s on feed, events, admin runners | `social.routes.ts:23-34`, `events.routes.ts:66-67`, `admin.routes.ts:33-42` |

### Why it feels disconnected
- **Silent failures everywhere**: `.catch(() => {})` / `catch {}` swallow errors
  (`RunTrackerPage.tsx:116-123`, `websocket.ts:95`); user sees stale/empty UI with no explanation.
- **Subscription tier bug**: DB seeds plans `base`/`pro` (`database/db.ts:191-196`) but
  `middleware/subscription.ts` hierarchy only knows `free`/`pro`/`premium` →
  `PLAN_HIERARCHY['base']` is `undefined` → **paying ₹9 users fail every `requirePlan` check**.
- **Inconsistent API shapes** (`/runs` returns array OR `{runs:[]}`), defensive client code papering over it.
- Dead/duplicate pages (`TrainPage`, `TrainingPage`, `CoachingPage`, `ChatPage`) and Strava remnants confuse navigation and maintenance.
- Feature flags, push notifications, email reset, Razorpay are half-built — UI promises things the backend never delivers.

### Why AI coaching feels average
Today the "AI" is: one Sonnet chat endpoint with a context dump + last 10 messages,
keyword-based memory extraction, and everything else fully deterministic templates.
There is **no knowledge base, no retrieval, no tool use, no real memory, no voice**.
The prototypes already solved all of these (§4).

---

## 1. Product decision locked in (tier model)

| | **Base — ₹9/mo** | **Pro — ₹99/mo** |
|---|---|---|
| AI coach speaks via | Plans, weekly summaries, pre/post-run briefs, insights, adaptive adjustments (**one-way**) | Everything in Base **+ two-way chat and voice** |
| Personality | Same single coach personality everywhere (existing prompt in `ai.service.ts:237`) — **no persona switching**, per decision |

Implications:
- The RAG + memory + guardrails upgrade must power **both** tiers — Base users feel the
  coach through better generated text, Pro users through conversation.
- The 3-persona system from Ishan-AI-Coach is **not** ported. Its other pieces are.

---

## 2. Phase 1 — Stop the bleeding (P0 bugs) ~1 wave

1. **Fix plan-key mismatch**: make `PLAN_HIERARCHY = { free: 0, base: 1, pro: 2 }`,
   remove `premium`, audit every `requirePlan()` call against the §1 matrix.
   Also `chatWithSonnet` hardcodes `checkUsageLimit(userId, 'pro')` regardless of real plan.
2. **Kill silent failures**: ban `catch {}`; every client query gets an error state
   (toast or inline retry); wrap `JSON.parse` of DB fields (`runs.routes.ts:131`,
   `social.routes.ts:190`).
3. **Standardize API envelope**: `{ data, error }` everywhere; fix `/runs` dual shape;
   typed client in `lib/api.ts`; shared response types in `shared/types.ts`.
4. **Startup env validation**: fail fast in prod when `JWT_SECRET` weak/missing,
   warn loudly for `ANTHROPIC_API_KEY`, `RAZORPAY_*`, `GOOGLE_CLIENT_ID`.
   Remove hardcoded fallback secret in `websocket.ts:28`.
5. **Fix N+1s**: rewrite feed/events/admin queries as JOIN + GROUP BY; add missing
   indexes (`ai_usage(user_id, created_at)`, `community_chat_messages(community_id, created_at)`,
   `kendu_transactions(user_id, created_at)`).
6. **Delete dead code**: Strava remnants (`strava_tokens` migrations), unused pages,
   the stubbed feature-flag rollout, or wire them — don't ship half.
7. **Google OAuth account linking**: same email via Google + password must merge, not error.

## 3. Phase 2 — Performance ("Strava feel") ~1 wave

**Server**
- `GET /api/dashboard` and `GET /api/coach/insights` **batch endpoints** — one round
  trip returns xp + tier + challenges + stats + plan week (resp. all 7 insights metrics).
  better-sqlite3 is sync; one handler doing 8 prepared statements is far cheaper than 8 HTTP round trips.
- Keep rate limiter, add `app.set('trust proxy', 1)` so per-IP limits work on Railway.

**Client**
- Adopt the batch endpoints; raise `staleTime` to 2–5 min for slow-moving data
  (tier, plan, records); `invalidateQueries` after mutations instead of polling.
- Replace notification polling with the existing WebSocket channel (it's already there for chat).
- `React.memo` feed/run cards; `useMemo` chart data; virtualize the feed
  (`@tanstack/react-virtual` — tiny, fits the existing TanStack stack).
- Animation budget: stagger only the first ~6 visible cards, `viewport={{ once: true }}`,
  drop confetti to CSS or 12 particles, no spring on chart fills.
- `import()` leaflet and html-to-image at point of use; add `loading="lazy"` +
  fixed aspect ratios to all images; add `rollup-plugin-visualizer` and set a bundle budget.

## 4. Phase 3 — AI Coach upgrade (port the prototypes) ~2 waves

What the prototypes proved (verified directly in the cloned code):

| Piece | Prototype implementation | Port verdict |
|---|---|---|
| **RAG** | Markdown corpus chunked by `##`/`###` headers (+ 800-char sliding window w/ 150 overlap in v2); **local** `all-MiniLM-L6-v2` embeddings (sentence-transformers, 384-dim) in FAISS `IndexFlatIP`; **hybrid retrieval** = dense + BM25 fused with Reciprocal Rank Fusion `1/(60+rank)`; tier boost (1.3× own tier, 0.7× others); top-k varies by tier (2–6); injected as a knowledge block in the system prompt | **Port.** In TS: `@xenova/transformers` runs the same MiniLM model locally in Node (no API key, CPU-fine), BM25 is ~40 lines, vectors as BLOBs in SQLite, cosine + RRF in JS. ~hundreds of chunks → no vector DB needed. |
| **Memory** | SQLite `insights` (goal/health_note/preference/achievement) with confidence × **exponential decay** `exp(-0.03·days)` (~23-day half-life), top-k injected; v2 adds a personalization store: injuries with status lifecycle (active→recovering→resolved), preferences, topics, sentiment trend, derived coaching cues (`needs_encouragement`, `has_active_injury`) | **Port** as DB tables. Replaces the keyword matching in `ai.service.ts:124-175`. Upgrade extraction from regex to a Haiku pass (regex as fallback). |
| **Agent tool loop** | OpenAI-compatible tool-calling loop (Groq Llama in the prototype, max 3–4 iters, falls back to no-tools on malformed tool calls): `get_runner_profile`, `retrieve_knowledge`, `calculate_pace_zones`, `check_guardrails`, + v2 `set_training_level`, `log_training_run`, `search_web` | **Port the pattern, not the provider.** Production keeps Anthropic Sonnet; the loop maps onto Anthropic tool use, and tools wrap the engines that already exist in `server/src/engine/`. The coach stops hallucinating and starts *reading and editing the actual plan*. Skip `search_web` for now. |
| **Guardrails** | Per-tier rule table: max weekly km, max consecutive days, min rest days, max single-run duration, 10% volume increase cap, allowed intensities, never-recommend list (e.g. no intervals for beginners); injury keywords force a cautious mode; exposed as a `check_guardrails` tool the model must call | **Port**, merged with `adaptiveEngine.ts` safety rails (ACWR blocks already exist). |
| **Voice** | **Browser-native, zero API cost**: STT via `streamlit-mic-recorder` (Web Speech API) and TTS via `window.speechSynthesis` with rate/pitch voice styles | **Port** as Pro feature — client-only, no server endpoints, no new keys. Feature-detect and hide on unsupported browsers. Cloud TTS is a later quality upgrade, not a blocker. |
| **Personas (Scientist/Energizer/Warrior/Sage)** | 4 switchable voices, persona corpus files, per-coach 10-level training cycles | **Do NOT port** — single-personality decision stands. (Optional later: adapt ONE neutral 10-level progression track in the current coach voice; it's a strong retention mechanic.) |
| **ML models** | sklearn RandomForest (readiness) + MLP (VDOT forecast) trained on *synthetic VDOT-derived data* | **Do not port.** VDOT formulas (already in repo) are equivalent; `adaptiveEngine.ts` already has the real heuristics (ACWR, monotony, strain). |
| **Plan generator** | 12-week periodized plan with deloads/taper | **Do not port** — production's `trainingPlanGenerator.ts` is already stronger. |

Tier mapping: prototype tiers are spark/pace/tempo/apex (4); production is
beginner/intermediate/advanced (3). Map spark→beginner, pace→intermediate,
tempo+apex→advanced when importing corpus and guardrail tables.

### Architecture in this repo

```
server/src/ai/
  knowledge/corpus/*.md      ← copy the 9 non-persona files from Ishan-AI-Coach
                                (general, spark, pace, tempo, apex, planning,
                                 psychology, mentality, tactics), tier-mapped
  embeddings.ts              ← @xenova/transformers all-MiniLM-L6-v2 locally;
                                build script chunks by ##/### headers (+ sliding
                                window) → knowledge_chunks table (BLOB) in SQLite
  retriever.ts               ← hybrid dense cosine + BM25, RRF fusion, tier boost
  memory.ts                  ← categorized memory + decay weighting + Haiku
                                extraction pass
  guardrails.ts              ← per-tier rule table + injury screening +
                                plan validation
  tools.ts                   ← Anthropic tool schemas + executors wrapping
                                existing engines
  agentLoop.ts               ← tool-use loop (replaces direct messages.create
                                in chatWithSonnet); SAME system personality
                                prompt as today (ai.service.ts:237)
```

### Where each tier feels it
- **Base (₹9)**: weekly AI summary, plan-adjustment notes, post-run analysis, and
  pre-run briefs are generated by **Haiku + RAG + memory** (replacing today's
  hardcoded template strings, e.g. `TrainTab.tsx:194-211` "Coach: Good discipline.").
  One-way: the coach writes to you; you can't write back.
- **Pro (₹99)**: chat becomes the tool-using agent (Sonnet + RAG + memory + tools),
  plus voice. Replace the "Coming Soon" stub in `components/coach/ChatTab.tsx` with a
  real chat UI (the `/api/ai/chat` backend already exists).

**Keys**: no new API keys needed. Anthropic (already configured) covers chat +
extraction; embeddings run locally via `@xenova/transformers` (one new dependency,
~25 MB model cached at build time); voice is browser-native. The prototypes' Groq/Llama
stack is NOT carried over — production stays on Anthropic.

## 5. Phase 4 — Design polish ~1 wave

- Semantic type scale in `tailwind.config.ts` (display/h1/h2/body/caption/label)
  instead of arbitrary `text-[22px]`; one card/button/input vocabulary actually used
  (the `Button` component exists but pages don't use it).
- One icon system (lucide-react) replacing the emoji/SVG mix.
- Consistent radius/spacing scale; skeletons (not spinners) on every async surface,
  including map and chat.
- Hero surfaces that earn the Strava comparison: post-run share card, dashboard
  "today" block, and the new chat — polish these three first; they're what users screenshot.

## 6. Phase 5 — Production readiness ~1 wave

1. **Logging**: pino + request IDs; replace all bare `console.error`.
2. **Error tracking**: Sentry (client + server). Free tier is fine at this scale.
3. **Tests**: vitest + supertest on critical paths — auth, run logging cascade,
   plan generation, subscription gating, AI chat fallback. Target the engines first
   (pure functions, easy wins).
4. **CI**: GitHub Actions — typecheck + lint + test + build on every PR.
5. **Backups**: nightly `sqlite3 .backup` to object storage from Railway cron; restore doc.
6. **Security**: enable CSP in helmet, CSRF strategy for state-changing routes,
   finish or remove Razorpay webhook verification (payments must not be half-working).
7. **Cut or finish**: push notifications (needs service worker) and email reset —
   each either ships complete or gets removed from the UI.

---

## 7. Running this with Opus 4.6 (unlimited tokens)

Rules that make agent waves work:
- **One task per session**, scoped to a phase item, on its own branch.
- Every prompt ends with the same verification gate: `npm run build` passes,
  typecheck clean, and (once Phase 5 lands) tests green.
- Run independent tasks in parallel; merge a wave before starting the next.
- After each wave, run the repo's own `/audit` + `/sprint-team` skills as a review pass.
- Per `CLAUDE.md`, every feature-visible change must update `docs/USER-GUIDE.md`
  and `docs/PM-GUIDE.md` — include that line in every prompt.

### Wave plan
| Wave | Parallel sessions |
|---|---|
| 1 | P0 bugs: (a) tier/plan-key fix + gating audit, (b) silent failures + API envelope, (c) N+1 + indexes, (d) env validation + dead code |
| 2 | Perf: (a) batch endpoints + client adoption, (b) animation/bundle/image budget, (c) WebSocket notifications |
| 3 | AI: (a) RAG pipeline + corpus import, (b) memory + guardrails, (c) agent tool loop |
| 4 | AI surfaces: (a) Pro chat UI + voice, (b) Base-tier generated coaching text |
| 5 | Prod: (a) logging+Sentry, (b) tests+CI, (c) backups+security+payments |

### Ready-to-run prompts (copy-paste into Opus 4.6)

**Wave 1a — subscription tier fix**
```
Fix the subscription tier system. The DB seeds plan keys 'base' (₹9) and 'pro' (₹99)
in server/src/database/db.ts:186-208, but server/src/middleware/subscription.ts uses
PLAN_HIERARCHY {free, pro, premium} — 'base' resolves to undefined so paying Base users
fail every requirePlan check. Change the hierarchy to {free:0, base:1, pro:2}, remove
'premium', and audit EVERY requirePlan/getUserPlan call site against this matrix:
Base = plans, summaries, briefs, insights, pace zones, HR zones, events, communities,
social, leaderboard. Pro = everything + AI chat + voice + adaptive engine +
transformation plans + weekly challenges + create communities + PRs.
Also fix chatWithSonnet in server/src/services/ai.service.ts which hardcodes
checkUsageLimit(userId,'pro') instead of using the user's real plan. Add vitest tests
for getUserPlan/requirePlan covering free/base/pro/expired. Update docs/USER-GUIDE.md
and docs/PM-GUIDE.md tier tables. Verify: npm run build passes.
```

**Wave 1b — silent failures + API envelope**
```
Eliminate silent failures and standardize API responses. Server: every route returns
{ data } on success or { error: { code, message } } on failure; wrap all JSON.parse of
DB fields (server/src/routes/runs.routes.ts:131, social.routes.ts:190) in safe parsers;
replace the empty catch in server/src/websocket.ts:95 with logged handling; make
/api/runs return one shape. Client: extend client/src/lib/api.ts to unwrap the envelope
and throw typed errors; add a global error toast + per-query inline error states with
retry buttons for every useQuery currently using .catch(() => {}) or no error UI
(start with RunTrackerPage.tsx:116-123). Share envelope types via shared/types.ts.
No raw error text shown to users. Verify: npm run build passes at 375px viewport.
```

**Wave 2a — batch endpoints**
```
Create GET /api/dashboard and GET /api/coach/insights batch endpoints. Dashboard returns
{xp, tier, challenges, runStats, planWeek, profilingStatus} in one response (the data
currently fetched by 4-6 separate queries in client/src/components/dashboard/Dashboard.tsx).
Insights returns everything AIAnalyticsTab.tsx fetches with its 7 queries (adaptive load,
weekly summary, vdot, tier, race predictions, stats, records). Implement as single
handlers running the existing prepared statements. Update the client to use one useQuery
per page with staleTime 2 minutes, and invalidate these keys after run-log and
goal mutations. Delete the replaced per-widget queries. Verify build + identical
rendered data.
```

**Wave 3a — RAG pipeline** (clone https://github.com/rg6830303/Ishan-AI-Coach as reference)
```
Port the RAG system from the Ishan-AI-Coach prototype (Python/Streamlit) into
server/src/ai/. Reference implementation: knowledge/embeddings.py (local
sentence-transformers all-MiniLM-L6-v2, 384 dims, FAISS IndexFlatIP; chunks markdown
by '## ' and '### ' headers plus 800-char sliding window with 150 overlap, tagged
{source, section}) and knowledge/retriever.py (hybrid retrieval: dense cosine + BM25
keyword scores fused with Reciprocal Rank Fusion 1/(60+rank); tier boost 1.3x for the
user's tier file, 0.7x others; top-k 3-6 by tier). Build in TypeScript:
(1) copy the 9 non-persona corpus files (general, spark, pace, tempo, apex, planning,
psychology, mentality, tactics) into server/src/ai/knowledge/corpus/, mapping tiers
spark→beginner, pace→intermediate, tempo+apex→advanced; (2) embeddings via
@xenova/transformers running Xenova/all-MiniLM-L6-v2 locally (new dependency — no API
key, CPU inference, cache the model dir); (3) npm script ai:build-index that chunks,
embeds, and stores {source, section, text, embedding BLOB} rows in a new SQLite
'knowledge_chunks' table; (4) retriever.ts implementing BM25 (small, hand-rolled is
fine) + dense cosine + RRF fusion + tier boost; (5) RAG_ENABLED flag with graceful
no-op when index absent. Inject retrieved chunks as a '## RELEVANT KNOWLEDGE' section
into the existing system prompts in chatWithSonnet and evaluateTrainingWithHaiku
(server/src/services/ai.service.ts) — do NOT change the coach personality text.
Unit-test chunking, BM25, cosine, and RRF ranking with fixture chunks.
```

**Wave 3b — memory + guardrails** (clone https://github.com/rg6830303/Ishan-AI-Coach as reference)
```
Upgrade AI memory and add guardrails, porting from Ishan-AI-Coach (database/memory.py,
personalization/extractor.py, engine/guardrails.py). Replace keyword extraction in
server/src/services/ai.service.ts:124-175 with: (1) 'memories' table {user_id,
category: injury|goal|preference|achievement|personal, content, confidence,
status (for injuries: active|recovering|resolved), created_at, last_accessed};
(2) decay-weighted ranking exactly like the prototype: effective_weight =
confidence * exp(-0.03 * days_old) (~23-day half-life), top-8 injected into the
system prompt — but ACTIVE injuries are always included regardless of decay;
(3) a post-chat Haiku extraction pass that writes memories asynchronously after the
response is sent (the prototype used regex patterns for goals/'want to'/'training for',
injuries/'knee pain', preferences/'I prefer|hate' — keep those as a no-API fallback);
(4) migrate existing ai_profiles JSON arrays into the new table.
Guardrails (server/src/ai/guardrails.ts), ported from the prototype's per-tier table:
max weekly km {beginner 15, intermediate 40, advanced 80}, max consecutive run days,
min rest days, max single-run duration, 10% weekly volume increase cap, allowed
intensity types per tier (no intervals/tempo for beginners), never-recommend lists.
Input screening: injury keywords (pain, injury, hurt, dizzy, chest) switch the system
prompt to cautious mode with a medical disclaimer. Apply validation to
trainingPlanGenerator and adaptiveEngine outputs, merged with the existing ACWR rails.
Keep the coach personality prompt unchanged. Tests for extraction parsing, decay
ranking, and each guardrail rule.
```

**Wave 3c — agent tool loop**
```
Convert chatWithSonnet (server/src/services/ai.service.ts:214-250) into a tool-use agent
loop. The pattern to port is agent/agent_loop.py + agent/tools.py from Ishan-AI-Coach
(an OpenAI-compatible tool-call loop on Groq) — reimplement it as a standard Anthropic
tool-use loop on the EXISTING Anthropic SDK + Sonnet model: while stop_reason ===
'tool_use' (max 4 iterations) execute tools and append tool_result blocks; on a
malformed tool call or tool error, retry the turn once without tools (the prototype's
resilience trick). Tools (wrap EXISTING engines, no new logic): retrieve_knowledge
(new retriever from wave 3a), get_runner_profile, get_recent_runs,
calculate_pace_zones (engine/paceCalculator.ts), get_current_plan + update_plan_week
(engine/trainingPlanGenerator.ts + adaptiveEngine.ts, every change validated by
check_guardrails), get_training_load (adaptiveEngine.ts), predict_race_time (VDOT
formulas in engine/vo2max.ts — NOT ML), log_memory (new memory store).
Keep model, max_tokens, personality system prompt, usage tracking, and graceful
fallbacks exactly as they are. Plan changes made via update_plan_week must be visible
on the client plan tab immediately (invalidate training-week query). Integration test:
mocked Anthropic client exercising a 2-tool conversation and the no-tools fallback.
```

**Wave 4a — Pro chat UI + voice**
```
Replace the 'Coming Soon' stub in client/src/components/coach/ChatTab.tsx with a real
chat interface for Pro users against the existing POST /api/ai/chat: message list with
user/coach bubbles, optimistic send, streaming-style reveal, error retry, daily-limit
state (the API returns limit_reached), and an upgrade CTA for free/base users (403 with
required_plan from requirePlan). Then add voice, porting the approach from
Ishan-AI-Coach ui/voice.py — fully browser-native, NO server endpoints and NO API keys:
STT via the Web Speech API (SpeechRecognition / webkitSpeechRecognition) behind a mic
button that fills the chat input; TTS via window.speechSynthesis speaking the coach
reply, with a small voice-style config (rate/pitch presets and a ranked voice-name
preference list, like the prototype's VOICE_STYLES). Voice mode toggle adds
'keep responses under 80 words, conversational' to the chat request. Feature-detect:
hide the mic on unsupported browsers, handle mic-permission denial with a friendly
message, cancel speech on unmount/navigation. Voice is Pro-gated client-side AND the
chat endpoint stays Pro-gated server-side. Must work at 375px (iOS Safari quirks:
speechSynthesis requires a user gesture). Update docs/USER-GUIDE.md and docs/PM-GUIDE.md.
```

**Wave 4b — Base-tier coaching surfaces**
```
Make the Base (₹9) tier feel coached without chat. Replace hardcoded coaching strings
(e.g. client/src/components/coach/TrainTab.tsx:194-211 pre/post-run text, static
'Coach:' quotes) with text generated by evaluateTrainingWithHaiku + RAG + memory:
(1) weekly summary written to a coach_notes table every Sunday via the existing
scheduler; (2) post-run analysis paragraph generated in the run cascade (async, after
response) and shown on the run detail screen; (3) pre-run brief endpoint enriching
engine/coachingOutputs.ts output with one short Haiku-written paragraph. All one-way:
Base users read the coach, never message it. Cache generated text (one generation per
run / per week, stored in DB, never regenerate on page view). Fall back to current
template text when ANTHROPIC_API_KEY missing. Update both docs.
```

**Wave 5b — tests + CI**
```
Add a test foundation and CI. Vitest workspace covering: all pure engines
(tierClassifier, paceCalculator, vo2max, trainingPlanGenerator phase math,
adaptiveEngine ACWR thresholds, guardrails), subscription gating, auth flow (register/
login/me via supertest with a temp sqlite db), run-log cascade (activity insert → XP →
PR detection), and AI service fallbacks with a mocked Anthropic client. GitHub Actions
workflow: install, typecheck both workspaces, lint, test, build on every PR and push to
main. Add npm run test + npm run typecheck root scripts. Target: critical paths covered,
suite under 2 minutes.
```

---

## 8. Sequencing & success criteria

Order matters: **bugs → speed → AI → polish → hardening**. Shipping RAG on top of a
broken tier gate wastes the work.

Done means:
- A Base user pays ₹9 and every Base feature works; the coach "writes" to them weekly.
- A Pro user chats (text or voice) with a coach that reads their actual plan, edits it
  with guardrails, and remembers their injuries — same personality as today.
- Dashboard interactive in ~1 round trip; feed scrolls at 60fps on a mid-range phone.
- CI green on every PR; Sentry quiet; nightly backups restorable.
