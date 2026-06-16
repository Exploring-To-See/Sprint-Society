# /council — Run the Sprint Society product+engineering council

Orchestrate the full council (product engineers + PMs) on a task. The `council-lead` agent decomposes
the work, dispatches specialists IN PARALLEL, gates on QA + code review, and returns ONE synthesized
report to the founder.

## The council (agents in `.claude/agents/`)
| Agent | Role | Skill loadout |
|-------|------|---------------|
| `council-lead` | Orchestrator ("Kendu Prime") | dispatching-parallel-agents, subagent-driven-development, writing/executing-plans, brainstorming, using-superpowers, verification-before-completion, git-worktrees, finishing-a-branch, requesting/receiving-code-review (11) |
| `product-pm` | Head of Product | brainstorming, writing-plans, writing-skills, ux-writing, frontend-design, slides, spreadsheet, pdf, ml-dl-rl, verification (10+) |
| `growth-pm` | Growth / Business | brainstorming, writing-plans, slides, spreadsheet, ux-writing, frontend-design, pdf, ascii-to-infographic, verification, WebSearch (10) |
| `frontend-lead` | UI / Design Eng | frontend-design + 7 references, TDD, systematic-debugging, security(react), verification (12) |
| `backend-lead` | API / Platform Eng | security(express/node), TDD, systematic-debugging, writing/executing-plans, git-worktrees, requesting/receiving-review, claude-api, verification (11) |
| `ai-algo-lead` | AI / Algorithm Eng | ml-dl-rl (RAG corpus), claude-api, TDD, systematic-debugging, brainstorming, writing-plans, dispatching-parallel-agents, security, frontend-design, verification (10) |
| `qa-release` | QA / Release gate | TDD, systematic-debugging, verification, security, requesting/receiving-review, executing-plans, git-worktrees, finishing-a-branch, verify/run (10) |
| `brand-studio` | Brand / Content / Video | frontend-design + 3 references, slides, ascii-to-infographic, pdf, writing-skills, brainstorming, verification (10) |

## Usage
- `/council` — orient + recommend the next highest-impact move, then wait for direction.
- `/council audit` — full health audit (build/typecheck/test + static review) → report + decision matrix.
- `/council build <feature>` — spec (product-pm) → parallel build (frontend/backend/ai) → QA gate → report.
- `/council ship <milestone>` — drive a milestone to green build + deploy + verified-on-device.
- `/council gtm` — growth-pm produces/updates the go-to-market + metrics plan.

## How it runs
Invoke the `council-lead` agent with the task. It will: ORIENT → PLAN → DISPATCH specialists in parallel
→ GATE (qa-release + code review) → SYNTHESIZE one report → update `TASKS.md`. Escalate to the founder
before new deps, schema DROP/MODIFY, auth changes, branding, money, deleting features, or deploy/.env.

## Non-negotiable gates
`npm run typecheck` + `npm test` green · loading/error/empty states · mobile-first 375px · auth on every
protected route · zod on inputs · no hardcoded secrets · verify on the real app before "done".
