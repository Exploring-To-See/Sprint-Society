# Policy Gradient

Directly optimize the policy parameters θ via gradient ascent on expected return:

∇J(θ) = E_π[∇log π_θ(a|s) · A(s,a)]

where A is an advantage estimate (or just Q, or just discounted return for REINFORCE).

## Variants
- **REINFORCE** — Monte Carlo return
- **[[actor-critic]]** — replace return by a learned baseline V; reduces variance
- **A2C / A3C** — synchronous / asynchronous actor-critic
- **TRPO** — trust region constraint on KL between old and new policy
- **[[ppo]]** — clipped surrogate objective; the workhorse of modern deep RL
- **DDPG / TD3** — deterministic policy gradient for continuous actions
- **SAC** — entropy-regularized soft actor-critic

## Why Useful
- Naturally handles continuous / high-dim action spaces
- Stochastic policies for exploration / mixed strategies
- Drop-in differentiable: policy is just a network

## See Also
- [[actor-critic]] — main extension (variance reduction via critic)
- [[ppo]] — modern default for on-policy deep RL
- [[../concepts/policy]], [[../concepts/value-function]] — underlying RL constructs
- [[../concepts/reinforcement-learning]], [[../concepts/model-free-rl]] — broader context
- [[multi-agent-policy-gradient]] — multi-agent extension

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 13
- [[../summaries/algorithms-for-decision-making]] Ch. 12
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 8 (deep RL primer)

## Tags
#policy-gradient #reinforcement-learning #foundation
