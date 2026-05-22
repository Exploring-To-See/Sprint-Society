# REINFORCE

Williams (1992): the original Monte Carlo [[policy-gradient]] estimator. Uses the *full* return G_t from each rollout as the advantage signal — no critic, no bootstrapping.

∇J(θ) = E_π[ ∇log π_θ(a_t|s_t) · G_t ]

## Why It Works
- Unbiased estimator of the policy gradient
- The score-function trick (∇log π) lets you differentiate through stochastic sampling
- A constant baseline b can be subtracted from G_t without changing the expectation, and reduces variance — this is the on-ramp to [[actor-critic]] (where b = V(s))

## Strengths
- Conceptually the simplest policy-gradient method
- No bootstrapping → no off-policy / deadly-triad issues
- Naturally on-policy

## Weaknesses
- **High variance** — full returns swing wildly across episodes
- **Poor sample efficiency** — must complete entire episodes before any update
- Slow convergence vs. modern actor-critic methods

## Where It Shows Up Today
- Conceptual building block taught before actor-critic and PPO
- Original [[alpha-go]] used REINFORCE for the RL self-play stage
- Black-box variational inference uses REINFORCE-style score-function gradients
- LLM RLHF estimators (e.g. RLOO) revisit baseline-subtracted REINFORCE for stability

## See Also
- [[policy-gradient]] — the family this is the canonical instance of
- [[actor-critic]] — replaces G_t with critic estimate to cut variance
- [[ppo]] — modern descendant with clipped objective
- [[../concepts/importance-sampling]] — REINFORCE off-policy correction uses IS weights
- [[../decisions/on-policy-vs-off-policy]] — REINFORCE is strictly on-policy

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 13.3 (REINFORCE algorithm)
- [[../summaries/algorithms-for-decision-making]] Ch. 12

## Tags
#reinforce #policy-gradient #monte-carlo #on-policy #reinforcement-learning
