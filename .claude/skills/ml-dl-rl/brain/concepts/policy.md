# Policy

A policy π specifies the agent's behavior — how to act given the state.

## Forms
- **Deterministic:** π: S → A, written a = π(s)
- **Stochastic:** π(a|s) — distribution over actions
- **Tabular:** for finite S, A; one entry per state
- **Parametric:** π_θ — neural network or linear function with parameters θ

## How It's Optimized
- **Value-based:** derive π greedily from Q* (e.g., [[../components/q-learning]])
- **Policy-based:** [[../components/policy-gradient]] directly optimizes π_θ
- **[[../components/actor-critic]]:** combines value and policy learning
- **Planning:** [[../components/value-iteration]], [[../components/policy-iteration]] when model is known

## Concepts
- **Optimal policy** π* maximizes expected return
- **Behavior vs target policy** in off-policy learning
- **Stochastic policies** for exploration / mixed equilibria in games
- **Hierarchical policies** ([[options-framework]])

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 3.5, throughout
- [[../summaries/algorithms-for-decision-making]] Ch. 7
- [[../summaries/multi-agent-reinforcement-learning]] (in games, policy is the strategy)

## Tags
#policy #reinforcement-learning #foundation
