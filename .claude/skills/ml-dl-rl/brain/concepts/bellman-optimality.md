# Bellman Optimality

V*(s) = max_a E[r + γ V*(s')] — the fixed-point equation that the optimal value function satisfies.

## Why Important
- Optimal policies are *greedy* w.r.t. V* (or Q*)
- Establishes that value iteration converges (γ-contraction)
- The max makes it nonlinear → can't always solve in closed form, hence iteration

## Computational Implications
- Tabular: O(|S|²|A|) per iteration
- LP formulation possible but typically slower than VI/PI for large MDPs

## See Also
- [[bellman-equation]] — the policy-evaluation form (without the max)
- [[value-function]], [[policy]] — what the equation describes
- [[../components/value-iteration]], [[../components/policy-iteration]] — algorithms that exploit it
- [[markov-decision-process]] — MDP context

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 3.6
- [[../summaries/algorithms-for-decision-making]] Ch. 7.5

## Tags
#bellman-optimality #reinforcement-learning #foundation
