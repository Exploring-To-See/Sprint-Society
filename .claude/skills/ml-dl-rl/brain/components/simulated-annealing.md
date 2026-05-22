# Simulated Annealing

Stochastic optimization that accepts worsening moves with probability exp(-ΔE/T), with temperature T cooled over time.

Inspired by metallurgical annealing. Provably converges to the global optimum given a slow enough cooling schedule (in practice you stop earlier).

Useful for combinatorial / discrete problems (TSP, scheduling) and as a baseline for [[cross-entropy-method]] and [[bayesian-optimization]].

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 8.3

## Tags
#simulated-annealing #optimization #stochastic #combinatorial
