# Value Iteration

Iterate the [[../concepts/bellman-optimality]] operator until convergence:
V_{k+1}(s) ← max_a [r(s,a) + γ Σ p(s'|s,a) V_k(s')]

Converges geometrically (γ-contraction). Extract policy at the end as π(s) = argmax of the Bellman backup.

Cheaper per iteration than [[policy-iteration]] but typically needs more iterations.

## Async Variants
- Update in any order, including only on visited states (RTDP)
- Prioritized sweeping orders updates by Bellman error magnitude

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 4.4
- [[../summaries/algorithms-for-decision-making]] Ch. 7.5

## Tags
#value-iteration #dynamic-programming #mdp #foundation
