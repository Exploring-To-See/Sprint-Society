# Markov Decision Process (MDP)

The mathematical framework for sequential decision making under uncertainty.

## Definition
Tuple ⟨S, A, p, r, γ⟩:
- States S, actions A
- Transition p(s'|s,a)
- Reward r(s,a) (or r(s,a,s'))
- Discount γ ∈ [0,1)

**Markov property:** the future depends on the past only through the current state.

## Key Equations
- **[[bellman-equation]]:** v_π(s) = E[r + γ v_π(s')]
- **Optimality:** v*(s) = max_a E[r + γ v*(s')]
- **Q-form:** Q*(s,a) = E[r + γ max_a' Q*(s',a')]

## Variants
- **POMDP** — partial observability; agent maintains a belief b(s) over states
- **Stochastic / Markov game** — multi-agent (see [[../summaries/multi-agent-reinforcement-learning]])
- **Continuous-time / continuous-state MDPs**
- **Constrained MDPs**, risk-sensitive MDPs

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 3 (the canonical statement)
- [[../summaries/algorithms-for-decision-making]] Ch. 7 (exact methods)
- [[../summaries/decision-making-under-uncertainty]] Ch. 4
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 2.2

## Tags
#mdp #reinforcement-learning #foundation
