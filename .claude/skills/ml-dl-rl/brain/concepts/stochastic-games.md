# Stochastic Games (Markov Games)

Multi-agent generalization of MDPs: at each state, all agents simultaneously choose actions, the environment transitions stochastically based on the joint action, and each agent receives an individual reward.

## Definition
⟨N, S, {A_i}, p, {r_i}, γ⟩
- N agents, joint action a = (a_1, ..., a_N)
- p(s' | s, a), r_i(s, a, s')
- Each agent maximizes its own expected return

## Special Cases
- **Zero-sum** (e.g., two-player chess) — competitive
- **Cooperative / common-reward** — all share the same reward
- **General-sum** — most realistic, hardest

## Solution Concepts
- [[nash-equilibrium]] (pure or mixed)
- Minimax for zero-sum
- Pareto-optimal joint policies
- [[../components/centralized-training-decentralized-execution]] in deep MARL

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 3 (full chapter)
- [[../summaries/decision-making-under-uncertainty]] Ch. 3.3
- [[../summaries/algorithms-for-decision-making]] Ch. 24

## Tags
#stochastic-games #marl #game-theory
