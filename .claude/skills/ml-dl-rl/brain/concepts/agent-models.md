# Agent Models (Validation)

> **Disambiguation:** This page is about **system-level agent models for safety validation** (black-box / gray-box / white-box). For **opponent modeling in multi-agent RL** (Bayesian, theory-of-mind, etc.), see [[agent-modeling]].

System-level models of an autonomous agent's behavior — needed to validate the *closed loop* (agent + environment), not just the agent's policy in isolation.

## Forms
- **Black-box agent** — only inputs/outputs accessible (treat as oracle)
- **Gray-box** — partial structure known
- **White-box / mechanistic** — full access to weights and architecture

## What's Validated
- Conformance to specification ([[temporal-logic]])
- Closed-loop reachability (where can the system end up?)
- Failure-mode discovery via [[../components/fuzzing]] / falsification
- Distribution-shift robustness

## Where It's Covered
- [[../summaries/algorithms-for-validation]] Ch. 2.4 (Agent Models)

## Tags
#agent-models #validation #safety
