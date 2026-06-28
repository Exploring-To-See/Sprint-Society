# AI Coach Build References — Code to Steal & Architecture Patterns

Use this file while building Sprints 2-7. Each entry has: what to take, where it is, and how to use it.

---

## CODE TO STEAL (Formulas & Algorithms)

### VDOT / Pace Zone Calculations
| Repo | What to take | Path |
|------|-------------|------|
| `ronek22/runningCalculator` | Jack Daniels VDOT tables, race time predictions, training pace derivation | `knowledge/sources/runningCalculator/` |
| `hivrich/vdot-calculator` | VDOT calculation from race time, pace zone tables, equivalent performances | `knowledge/sources/vdot-calculator/` |
| `ZacBlanco/vdot` | Clean VDOT implementation | `knowledge/sources/vdot/` |
| `johnjdavisiv/gap-app` | Grade-adjusted pace algorithm (accounts for hills) | `knowledge/sources/gap-app/` |
| `thehivemakes/hive-run-calc` | Pace + VO2max + HR zone calculator (combined) | `knowledge/sources/hive-run-calc/` |

**How to use:** Port the VDOT math from these into our `engine/pace_calculator.py` and `engine/vo2max.py`. Cross-validate our formulas against theirs. Steal the grade-adjusted pace from `gap-app` for hill running features.

---

### Training Load / ACWR / TRIMP
| Repo | What to take | Path |
|------|-------------|------|
| `ropensci/Athlytics` | ACWR (rolling + EWMA), TRIMP, training monotony, strain calculations | `knowledge/sources/Athlytics/` |
| `aaron-schroeder/heartandsole` | Running data analysis: HR zones, power, pace analysis, elevation correction | `knowledge/sources/heartandsole/` |
| `danielgtr/running_analysis` | FIT file parsing, HR zone calculations, form metrics (cadence, GCT, vertical oscillation) | `knowledge/sources/running_analysis/` |

**How to use:** `Athlytics` has production-ready ACWR + EWMA formulas in R — port to Python for our `engine/guardrails.py` and load management tools. `heartandsole` has elevation correction algorithms. `running_analysis` has FIT file structure docs useful when we add Garmin import.

---

### Exercise Physiology Equations
| Repo | What to take | Path |
|------|-------------|------|
| `dpfens/PyExPhys` | VO2max estimation (multiple formulas), BMR, body composition, energy expenditure, heart rate equations | `knowledge/sources/pyexphys/` (Python) |
| `dpfens/FitnessJS` | Same equations in TypeScript (useful for Sprint Society TS port later) | `knowledge/sources/FitnessJS/` |

**How to use:** These are libraries of validated exercise science formulas. Use as reference to verify our `engine/vo2max.py` calculations. When we port to TypeScript, `FitnessJS` gives us the equations pre-translated.

---

### Training Plan Generation
| Repo | What to take | Path |
|------|-------------|------|
| `sbailliez/training-plan` | FIRST method plan templates (5K to marathon), week-by-week structure | `knowledge/sources/training-plan/` |
| `jandroav/vtrain` | Jack Daniels VDOT-based auto-generated plans, CLAUDE.md has the coaching logic | `knowledge/sources/vtrain/` |
| `benranderson/training-plan` | Simple training plan structure | `knowledge/sources/training-plan/` |

**How to use:** Study `sbailliez/training-plan` for FIRST method week templates. Study `vtrain` for how to auto-generate plans from VDOT. Use these as ground-truth when building our `generate_training_plan` tool.

---

### Strava / Garmin Integration Patterns
| Repo | What to take | Path |
|------|-------------|------|
| `eddmann/intervals-icu-mcp` | MCP server pattern for training data (intervals.icu) | `knowledge/sources/intervals-icu-mcp/` |
| `Ahmosys/garmin-metrics-api` | Garmin API wrapper, metrics extraction | `knowledge/sources/garmin-metrics-api/` |
| `COLINZH26/garmin-ai-skill` | Garmin + AI coaching skill integration | `knowledge/sources/garmin-ai-skill/` |
| `markwk/qs_ledger` | Quantified-self data aggregation across platforms | `knowledge/sources/qs_ledger/` |

**How to use:** When building Strava/Garmin data import for Sprint Society, reference these for API patterns and data schemas.

---

## ARCHITECTURE PATTERNS (How to build the AI coach)

### Multi-Agent RAG Coach (Most relevant to our build)
| Repo | Pattern | What to learn |
|------|---------|---------------|
| `Mohamed-Elguindy/Fitness-App` | Agentic RAG router with LlamaIndex + Groq | How to route queries to different RAG strategies |
| `Hayfa78/fitness-nutrition-agent` | Hybrid RAG (FAISS + LangGraph) | Graph-based agent orchestration with vector retrieval |
| `kenhuangus/fitness-multi-agent-plan` | LangGraph + memory + injury avoidance | Multi-step planning with safety constraints |
| `saisrujanseelam/AI-multi-agentic-consensus-fitness-trainer-` | Multi-LLM consensus | Multiple models vote on best response (like our council) |
| `vimalkumarasamy/agent-balboa` | Strava + coach + LLM tools | Strava data feeding into coaching agent |

**How to use:** Study `Fitness-App` for router patterns (our task classifier). Study `fitness-multi-agent-plan` for how to wire guardrails into agent loops. Study `AI-multi-agentic-consensus` for consensus patterns (validates our AI Ishu council approach).

---

### Agent Loop / Tool-Calling Patterns
| Repo | Pattern | What to learn |
|------|---------|---------------|
| `oscartiz/hermes-agent` | Clean tool-calling agent loop | Minimal implementation of tool-augmented reasoning |
| `Coding-Phantom/FitnessForge` | Fitness agent with structured tools | Tool definitions for fitness domain |
| `LI-explorer/LLM-Fitness-Coach` | LLM-based coaching with tool use | How to structure coaching prompts |
| `blandevv/home-fitness-agent` | Home fitness agent pattern | Simple agent architecture reference |
| `jnkue/open-trainaa` | Endurance AI coach (FastAPI + Supabase) | Production deployment pattern for coach API |

**How to use:** When building Sprint 2 (adaptive routing) and Sprint 3 (full tool set), reference these for how others structure the agent loop, tool definitions, and error handling.

---

### Trail Running Coach (Most Feature-Rich Reference)
| Repo | What to learn | Path |
|------|---------------|------|
| `EmmanuelDiaz95/trail-running-coach` | Full architecture: agents, tools, personas, memory, plans, training cycles | `knowledge/sources/trail-running-coach/` |

**How to use:** This is the most complete reference architecture (411KB of docs). Study their `ARCHITECTURE.md` for module boundaries. Their approach to training cycles is directly relevant to our coaching cycles system.

---

## KNOWLEDGE CONTENT REPOS (Already extracted into corpus)

These repos' markdown content is already in `research_github_repos.md`:
- `PatrickWiloak/proper-distance-running-training-guidance` — Scientific training guide
- `jeff3388/awesome-injury-prevention-science` — Curated peer-reviewed injury evidence
- `ColinEberhardt/claude-running-coach` — Evidence-based AI coach skill
- `trail-running-coach` — Complete coaching architecture documentation
- `running_analysis` — FIT file structure, dashboard guides
- `vtrain` — CLAUDE.md with coaching logic
- `running-app` — Product/feature documentation
- `running-coach` — Training plan methodology

---

## QUICK LOOKUP: Which repo for which Sprint?

| Sprint | Repos to reference |
|--------|-------------------|
| Sprint 2 (Routing + Budget) | `Mohamed-Elguindy/Fitness-App` (router), `oscartiz/hermes-agent` (loop) |
| Sprint 3 (Tools) | `dpfens/PyExPhys` (formulas), `ropensci/Athlytics` (ACWR), `ronek22/runningCalculator` (VDOT) |
| Sprint 4 (Guardrails) | `kenhuangus/fitness-multi-agent-plan` (safety), `trail-running-coach` (architecture) |
| Sprint 5 (All features) | `jnkue/open-trainaa` (FastAPI coach), `vimalkumarasamy/agent-balboa` (Strava+coach) |
| Sprint 7 (Integration) | `dpfens/FitnessJS` (TS equations), `eddmann/intervals-icu-mcp` (MCP pattern) |
