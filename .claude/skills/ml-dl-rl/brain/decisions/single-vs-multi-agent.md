# Decision: Single-Agent vs Multi-Agent Framing

When you have multiple actors, should you treat them as one super-agent (centralized) or as separate learners (decentralized)?

## Single-Agent / Centralized
- Treat the joint state and joint action as a single MDP
- Pros: leverages full RL theory, simple
- Cons: action space grows |A|^N; communication assumed costless; not deployable to truly distributed agents

## Multi-Agent (MARL)
- Each agent has its own policy and (often) own observation
- Pros: scalable, deployable to distributed systems, handles heterogeneous incentives
- Cons: non-stationarity (everyone is learning), credit assignment, equilibrium selection

## CTDE Sweet Spot
[[../components/centralized-training-decentralized-execution]] gives the best of both: centralized info during training (e.g., centralized critics, [[../components/value-decomposition]]) but decentralized execution.

## When Each Wins
- **Few cooperating agents, simulator available** — centralized planning often suffices
- **Large heterogeneous fleet, real-time** → MARL with CTDE
- **Self-interested agents (markets, traffic, security)** → general-sum MARL with [[../concepts/nash-equilibrium]] reasoning

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] (the whole book)
- [[../summaries/algorithms-for-decision-making]] Ch. 24–27
- [[../summaries/decision-making-under-uncertainty]] Ch. 6, 11

## Tags
#decisions #marl #single-agent #multi-agent
