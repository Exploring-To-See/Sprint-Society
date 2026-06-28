# 🏃 Sprint Society — AI Running Coach

A **headless** AI running coach library, ready to wire into a host app (e.g. the
Sprint Society application) with its own frontend. It ships the **₹9 one-way plan**:
the coach analyses the runner's data and speaks to them before, during, and after a
run — the runner never has to type or talk back.

> **One-way by design.** Engines do the math, the coach does the words. During-run
> cues are templated and filled only with engine numbers, so the coach can never
> invent a pace, distance, or heart rate — and they're verified by an evaluation
> harness (12/12 metrics passing across 56 scenario×persona checks).

> ⚠️ The Streamlit app (`app.py`, `ui/`) has been **removed** — this repo is now a
> library. Bring your own UI; the coach returns text + audio bytes.

---

## ⚡ Quickstart — the ₹9 one-way coach

```python
from engine.pace_calculator import calculate_pace_zones
from engine.run_state import RunSnapshot, infer_state
from engine.run_cues import CuePlanner
from coaching import cue_library as lib
from coaching.one_way_coach import pre_run_brief, post_run_report

profile = {"age": 30, "gender": "male", "recent_5k_time": 24.0, "level": "intermediate", "max_hr": 191}
zones   = calculate_pace_zones(profile)
planned = {"type": "easy", "target_distance_m": 5000, "target_pace_s_per_km": zones["easy_pace_per_km"]}
persona = "scientist"   # scientist | energizer | warrior | sage

# 1) Before the run
print(pre_run_brief(planned, zones, profile, persona))

# 2) DURING the run — feed each live telemetry tick to ONE planner; it returns the
#    cue to speak now, or None (silence). This is the real-time integration point.
planner = CuePlanner(planned, zones, profile)
def on_tick(snap: RunSnapshot):
    ev = planner.evaluate(snap, infer_state(snap, planned, profile))
    return lib.render_cue(ev, persona) if ev else None   # speak it, or stay quiet

# 3) After the run
print(post_run_report(planned, samples, zones, profile, history=[], persona=persona))
```

### Speak it (optional, headless TTS)

```python
from voice.tts import synthesize          # -> WAV bytes for any player
wav = synthesize("One kilometre done at 6:00/km. Stay smooth.", "scientist")
```
Backends auto-select: **Kokoro-82M** (offline, Apache-2.0; put the model in `models/`)
→ **pyttsx3** (offline OS voices) → null. See `requirements-coach.txt`.

## ✅ Evaluation

```bash
python eval/run_eval.py --show      # scores the coach over the scenario matrix
python tests/test_one_way_coach.py  # 7 behavior tests
```
Deterministic metrics (no API key): grounding (no invented numbers), one-way (no
questions), safety recall, no-unsafe-advice, spacing, in-flow silence, anti-repetition,
persona consistency, brevity, trigger coverage, split accuracy, pre-run grounding.

## 🔌 Integration surface (for the host app)

| Call | In | Out |
|------|----|-----|
| `pre_run_brief(planned, zones, profile, persona)` | plan + profile | brief text |
| `CuePlanner(...).evaluate(snap, state)` per telemetry tick | live `RunSnapshot` | a `CueEvent` or `None` |
| `cue_library.render_cue(event, persona)` | cue event | spoken line |
| `post_run_report(planned, samples, zones, profile, history, persona)` | logged run | recap text |
| `voice.tts.synthesize(text, persona)` | text | WAV bytes |

The full design + feature catalog is in [`docs/`](docs/README.md).

---

## ✨ Features

### Four AI coaches (personalities)
| Coach | Style | Voice |
|-------|-------|-------|
| 🔬 **The Scientist** | Data-driven precision | Leads with numbers, physiology, evidence |
| ⚡ **The Energizer** | High-energy fun | Celebrates everything, playful, warm |
| 🔥 **The Warrior** | No-excuses discipline | Direct, accountable, mental toughness |
| 🧘 **The Sage** | Patient wisdom | Calm, reflective, trusts the process |

### Four runner tiers (auto-classified from your profile)
🌱 **Spark** (Beginner) · 🏃 **Pace** (Intermediate) · 🚀 **Tempo** (Advanced) · 🏆 **Apex** (Elite)

Each tier has its own safety guardrails, volume/intensity limits, coaching depth, and
chooses a Groq model sized to the complexity (8B for Spark/Pace, 70B for Tempo/Apex).

### Per-coach knowledge brains + 10-level training cycles
Every coach has its **own complete knowledge brain** (`knowledge/corpus/coach_*.md`)
covering its full methodology, motivation style, and how it handles every performance
level — and its **own unique 10-level training cycle**:

| Coach | Cycle | Levels 1 → 10 |
|-------|-------|---------------|
| 🔬 Scientist | **The Lab Protocol** | Baseline Diagnostics → Performance Mastery |
| ⚡ Energizer | **The Adventure Ladder** | First Steps → Unstoppable |
| 🔥 Warrior | **The Forge** | Recruit → Champion |
| 🧘 Sage | **The Path** | Seed → Mountain |

The coach places you at a level, names it, frames every session as a step toward the next
one, and **levels you up** (via the `set_training_level` tool) when you meet the criteria.
Your level, history, and progress are shown in the **🎯 Training Cycle** tab.

### Chat threads (saved & loaded)
Keep multiple named conversations. Create, switch, rename, and delete threads from the
sidebar — each is stored in SQLite and reloads exactly where you left off.

### Agentic RAG on Groq
The coach runs a tool-calling loop with four tools:
- `calculate_pace_zones` — VO2max & pace zones from your 5K time or profile
- `retrieve_knowledge` — hybrid (FAISS dense + BM25 sparse) search over the coaching corpus
- `check_guardrails` — validates recommendations against tier-specific safety rules
- `log_training_run` — records runs you mention straight into your training log

### Continuous personalization (the coaches update themselves)
Every message is analyzed for goals, injuries, preferences, mood, topics, and mileage.
These signals are merged into an evolving model that is injected into the coach's prompt
**on the same turn**, so it reacts immediately and remembers next time. Everything is
stored locally and visible in the UI:

```
data/personalization/<user_id>/
├── profile.json          # snapshot of your structured profile
├── personalization.json  # evolving model the coach reads every turn
├── events.jsonl          # append-only log of every interaction
└── training_log.jsonl    # every run you (or the coach) logs
```

### Voice (browser-based, optional)
- 🎤 **Speak** your message — captured in the browser and transcribed to text.
- 🔊 **Read replies aloud** — the coach's answer is spoken with the browser's
  built-in speech synthesis. **Multiple strong voice styles** (Strong Male, Strong
  Female, Deep & Commanding, Energetic, Calm & Warm), and each coach has a signature
  default voice. A 🔈 Test / ⏹️ Stop control lets you preview.
Both degrade gracefully to text-only if unavailable.

### Knowledge base
Markdown corpus under `knowledge/corpus/`, covering general running science plus dedicated
files for **psychology**, coaching **mentality**, **tactics/tips**, **planning**, and
**tier-specific** mentality/psychology/tactics/planning for all four runner types.

---

## 🚀 Run it locally

### 1. Prerequisites
- Python 3.10+
- A free **Groq API key** → https://console.groq.com/keys

### 2. Install
```bash
pip install -r requirements.txt
```

### 3. Add your Groq key
Create a `.env` file in the project root:
```
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL_SMALL=llama-3.1-8b-instant
GROQ_MODEL_LARGE=llama-3.3-70b-versatile
```
> The app also tolerates a loosely-formatted `.env.txt` for convenience, but a proper
> `.env` (or Streamlit secrets) is recommended.

### 4. (Optional) Build the dense vector index
The app works out-of-the-box using BM25. For higher-quality semantic retrieval, build the
FAISS index once (requires `sentence-transformers`, included in requirements):
```bash
python scripts/build_index.py
```
If the index isn't present, retrieval automatically falls back to BM25.

### 5. Launch
```bash
streamlit run app.py
```
Open http://localhost:8501, sign up, complete the 8-step profiling wizard, and start chatting.

---

## ☁️ Deploy to Streamlit Community Cloud

1. Push this repo to GitHub (public or private).
2. Go to https://share.streamlit.io → **New app** → pick this repo, branch `main`, file `app.py`.
3. In **Advanced settings → Secrets**, add:
   ```toml
   GROQ_API_KEY = "gsk_your_key_here"
   GROQ_MODEL_SMALL = "llama-3.1-8b-instant"
   GROQ_MODEL_LARGE = "llama-3.3-70b-versatile"
   ```
4. Deploy. 🎉

**Notes for cloud:**
- Never commit your real key — `.env` and `.env.txt` are git-ignored; use Streamlit secrets.
  `config.py` reads the key from environment **or** Streamlit secrets automatically.
- Accounts, profiles, **chats and chat threads** (SQLite) and the personalization JSON/JSONL
  all save and reload correctly while the app is running — log out, come back, switch threads,
  and everything is there. Note the disk is **ephemeral on redeploy/reboot**: for permanent
  durability across redeploys, point `DB_PATH`/`DATA_DIR` at a mounted volume or external DB.
- Browser mic access requires HTTPS — Streamlit Cloud serves over HTTPS, so voice input works.

### Keeping the app awake (no sleeping from inactivity)
Community Cloud sleeps apps with no traffic. This repo ships a GitHub Actions
workflow (`.github/workflows/keep-alive.yml`) that pings the app every 10 minutes
to keep it awake. To use it:
1. Set a repo **variable** `APP_URL` to your deployed URL: **Repo → Settings →
   Secrets and variables → Actions → Variables → New variable** →
   `APP_URL = https://your-app.streamlit.app` (or just edit the default in the workflow).
2. Enable Actions if prompted, then it runs automatically (or trigger it once from the
   **Actions** tab → *Keep Streamlit app awake* → *Run workflow*).

> GitHub's scheduled workflows can be delayed a few minutes and are auto-disabled after
> ~60 days with no repo commits. For rock-solid uptime, also point a free uptime monitor
> (e.g. **UptimeRobot** or **cron-job.org**) at the same URL on a 5-minute interval.

---

## 🗂️ Project structure
```
app.py                  # entry point + routing
config.py               # env/key loading, tiers, models, paths
agent/                  # agentic loop, tools, personas, system prompts
coaching/               # per-coach 10-level training cycles + progression logic
engine/                 # classifier, guardrails, pace calculator, VO2max
knowledge/              # corpus (markdown incl. per-coach brains), chunking, retriever
personalization/        # JSON/JSONL store + signal extractor (continuous learning)
database/               # SQLite models, auth, threads, conversation/insight memory
ui/                     # theme, auth, profiling wizard, chat + dashboards, voice
scripts/build_index.py  # one-off FAISS index builder
```

---

## ⚠️ Disclaimer
This is an educational coaching assistant, not medical advice. Always stop for sharp or
worsening pain and consult a professional for injuries or health concerns.
