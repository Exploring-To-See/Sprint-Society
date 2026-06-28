# Sprint Society AI Coach — Integration Contract

## Engine Entry Point

```python
from coaching.engine_v2 import coach

result = coach.handle(feature, context)
```

### Request (context dict)

```python
context = {
    "user_id": int,           # Sprint Society user ID
    "message": str,           # User's message or query context
    "tier": str,              # "spark" | "pace" | "tempo" | "apex"
    "persona": str,           # "scientist" | "energizer" | "warrior" | "sage"
    "plan": str,              # "free" | "base" | "pro"
    "thread_id": int | None,  # Conversation thread (for chat history)
    "locale": str,            # "en" | "hi" | "hinglish" (auto-detected if not set)
}
```

### Feature (first argument)

```
"chat"            # Free-form conversation with coach
"profiling"       # Initial runner classification
"plan"            # Generate/adjust training plan
"daily_insight"   # Today's coaching tip
"pre_run"         # Pre-run briefing
"post_run"        # Post-run analysis
"challenge"       # Weekly challenge
"weekly_summary"  # Week-in-review
"proactive"       # Proactive alerts (overtraining, streak, etc.)
"race_predict"    # Race time prediction
"injury_risk"     # Injury risk assessment
"pace_zones"      # Calculate pace zones (Level 0, no LLM)
"vo2max"          # Estimate VO2max (Level 0, no LLM)
"readiness"       # Training readiness score (Level 0, no LLM)
```

### Response (CoachResult)

```python
{
    "text": str,              # The coaching response (may be in Hindi/Hinglish)
    "tools_used": [str],      # Which tools the agent called
    "citations": [{"title": str, "source": str}],  # RAG chunks used
    "tokens": {"input": int, "output": int},
    "est_cost": float,        # Estimated cost in USD
    "model": str,             # Model used (e.g., "llama-3.3-70b-versatile")
    "provider": str,          # "groq" | "anthropic" | "rules" | "fallback" | "cache"
    "level": int,             # Task complexity level (0-3)
    "feature": str,           # Echo of requested feature
    "guardrail_flags": [str], # Any guardrail warnings/blocks
    "route_reason": str,      # Why this model was chosen
    "cached": bool,           # Whether this was a cached response
    "locale": str,            # Language of response
}
```

---

## Data Adapter Mapping

The engine's tools need data from Sprint Society's database. Here's the mapping:

### Sprint Society (TypeScript/SQLite) → Coach Engine (Python)

| Engine Tool | Needs | Sprint Society Source |
|-------------|-------|---------------------|
| `get_runner_profile` | User profile (tier, age, gender, goals, injuries) | `users` + `runner_profiles` tables |
| `get_recent_runs` | Last N runs (distance, pace, duration, type) | `activities` table |
| `get_training_history` | Weekly summaries over N weeks | `activities` aggregated |
| `get_personal_records` | Best times per distance | `activities` filtered by best |
| `get_goals` | Active goals (type, target, deadline) | `user_goals` table |
| `get_progress_and_level` | XP, level (1-40), streak | `user_xp` + `streaks` tables |
| `get_weekly_load_acwr` | Daily distances for 28 days | `activities` last 28 days |
| `get_current_plan` | Active training plan + sessions | `training_plans` + `plan_sessions` |
| `get_memory_insights` | Stored insights from past coaching | `ai_insights` table |
| `log_training_run` | Write a run entry | INSERT into `activities` |
| `set_goal` | Create/update a goal | INSERT/UPDATE `user_goals` |
| `save_memory_insight` | Store insight for future | INSERT into `ai_insights` |

### Integration Options

#### Option A: HTTP Service (FastAPI)
```
Sprint Society (Express) --HTTP--> Coach Service (FastAPI/Python)
                                    ├── Uses its own SQLite for chat/memory
                                    └── Calls back to Sprint Society API for run data
```

#### Option B: TypeScript Port
```
Sprint Society (Express)
├── server/src/ai/engine.ts  (ported from Python)
├── server/src/ai/tools.ts   (tools call local DB directly)
└── server/knowledge/         (corpus + index files)
```

#### Option C: Subprocess
```
Sprint Society (Express) --spawn--> python coach_cli.py --feature chat --context '{...}'
```

**Recommended: Option A** for initial deployment (least risk, fastest to ship).
Later: Option B for lower latency and simpler infra.

---

## Environment Variables

```env
# Required (at least one LLM provider)
GROQ_API_KEY=gsk_...              # Primary (free tier)
ANTHROPIC_API_KEY=sk-ant-...      # Premium (for Pro users)

# Optional
GROQ_MODEL_SMALL=llama-3.1-8b-instant
GROQ_MODEL_LARGE=llama-3.3-70b-versatile
```

---

## Deployment (Railway)

### As a Service (Option A)
```yaml
# railway.toml
[build]
  builder = "nixpacks"

[deploy]
  startCommand = "uvicorn api:app --host 0.0.0.0 --port $PORT"
  healthcheckPath = "/health"
```

### Required files for service deployment:
- `api.py` — FastAPI wrapper around `coach.handle()`
- `requirements.txt` — Python deps
- `knowledge/corpus/` — All corpus files
- `knowledge/index/` — Pre-built FAISS + BM25 index

### Resource requirements:
- RAM: 512MB minimum (for embedding model + FAISS index)
- Disk: 100MB (corpus + index + model weights)
- CPU: 1 vCPU sufficient (LLM inference is remote)

---

## Consent & Privacy Contract

The engine respects these privacy rules:

1. **Data minimization**: Only pass fields the feature needs (not entire user profile for every call)
2. **No PII in logs**: User names, emails, phone numbers are never logged
3. **Retention**: Chat history retained for 90 days, then auto-deleted
4. **Delete on request**: `DELETE /api/ai/data/:user_id` removes all coaching data
5. **Consent**: User must accept coaching T&C before first AI interaction
6. **No sharing**: Individual coaching data is never shared between users

---

## Testing Checklist (before connecting)

- [ ] `GROQ_API_KEY` set and working (test with `python tests/test_providers.py`)
- [ ] Corpus index built (`python scripts/build_index.py`)
- [ ] All 24 tools return valid data when connected to Sprint Society's DB
- [ ] Guardrail tests pass (`python tests/test_guardrails.py`)
- [ ] Pipeline test passes (`python tests/test_pipeline.py`)
- [ ] Budget meter correctly blocks at ceiling
- [ ] Fallback responses work when providers are down
- [ ] Hindi/Hinglish responses are natural (manual check with native speaker)
- [ ] No PII leaks in logs (check `data/monitoring/` after 10 test conversations)
- [ ] Cost per conversation stays under Rs 3 (Base) / Rs 33 (Pro) per month at 5 msg/day

---

## API Wrapper (for Option A deployment)

```python
# api.py — FastAPI service wrapper
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from coaching.engine_v2 import coach

app = FastAPI(title="Sprint Society AI Coach")

class CoachRequest(BaseModel):
    feature: str
    user_id: int
    message: str = ""
    tier: str = "pace"
    persona: str = "energizer"
    plan: str = "base"
    thread_id: int | None = None
    locale: str = "en"

@app.post("/coach")
def handle_coach(req: CoachRequest):
    result = coach.handle(req.feature, req.dict())
    return result.to_dict()

@app.get("/health")
def health():
    return {"status": "ok"}
```
