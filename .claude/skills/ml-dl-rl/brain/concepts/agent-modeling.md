# Agent Modeling (in MARL)

> **Disambiguation:** This page is about **opponent modeling in multi-agent RL**. For the system-level **agent models** used in safety validation (black-box / gray-box / white-box), see [[agent-models]].

Each agent maintains an explicit model of *other* agents to anticipate their behavior and adapt.

## Forms
- **Best response** — assume others play fixed strategy, optimize against it (fictitious play)
- **Type-based / Bayesian** — distribution over possible opponent types
- **Recursive (theory of mind)** — model that the opponent models me modeling the opponent…
- **Neural agent models** — RNN / Transformer over opponent's action history

## Challenges
- Non-stationarity — every agent is updating, so models go stale
- Identifiability — multiple opponent strategies can produce identical observed behavior
- Compute: type space can explode
- Mixed-motive games make pure modeling insufficient — see [[nash-equilibrium]]

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 6.3, 9.6 (deep agent modeling)
- [[../summaries/algorithms-for-decision-making]] Ch. 24 (multi-agent reasoning)

## Tags
#agent-modeling #marl #game-theory
