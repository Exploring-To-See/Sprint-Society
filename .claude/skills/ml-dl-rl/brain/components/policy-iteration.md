# Policy Iteration

Exact MDP-solving algorithm:
1. **Evaluate** the current policy π — solve the linear system V^π = R^π + γ P^π V^π
2. **Improve** — set π'(s) = argmax_a [r(s,a) + γ Σ p(s'|s,a) V^π(s')]
3. Repeat until policy stops changing → optimal

Converges in finite steps for finite MDPs (each iteration strictly improves or terminates).

Faster wall-clock than [[value-iteration]] when policy evaluation is cheap relative to many VI sweeps.

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 4.3
- [[../summaries/algorithms-for-decision-making]] Ch. 7.4

## Tags
#policy-iteration #dynamic-programming #mdp #foundation
