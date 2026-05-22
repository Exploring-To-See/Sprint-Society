# Value Function

The expected cumulative future reward from a state (V) or state-action pair (Q) under a given policy.

## Definitions
- **State value:** V^π(s) = E_π[Σ γ^t r_t | s_0 = s]
- **Action value:** Q^π(s,a) = E_π[Σ γ^t r_t | s_0 = s, a_0 = a]
- **Optimal:** V*(s) = max_π V^π(s); Q*(s,a) = max_π Q^π(s,a)
- **Advantage:** A^π(s,a) = Q^π(s,a) - V^π(s)

## Key Equations
- **[[bellman-equation]]:** V^π(s) = Σ_a π(a|s) [r(s,a) + γ Σ_s' p(s'|s,a) V^π(s')]
- **[[bellman-optimality]]:** V*(s) = max_a [r(s,a) + γ Σ_s' p(s'|s,a) V*(s')]

## How It's Estimated
- **Tabular:** one entry per state (or state-action)
- **Function approximation:** linear features, tile coding, RBF, neural networks
- **Bayesian / posterior** value estimates ([[../summaries/probabilistic-ml-advanced]] Ch. 35)

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 3.5
- [[../summaries/algorithms-for-decision-making]] Ch. 7.3, Ch. 8 (approximate)
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 2.4 (Bellman in games)

## Tags
#value-function #reinforcement-learning #bellman #foundation
