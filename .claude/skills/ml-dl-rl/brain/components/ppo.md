# Proximal Policy Optimization (PPO)

On-policy policy-gradient method with a clipped surrogate objective that prevents destructively large policy updates. The default first-choice algorithm for continuous-control and many discrete RL benchmarks since 2017 (Schulman et al.).

## Surrogate Objective

Let r_t(θ) = π_θ(a_t|s_t) / π_{θ_old}(a_t|s_t) be the probability ratio between the new and old policy.

PPO maximizes:

L^CLIP(θ) = E_t [ min( r_t(θ) Â_t, clip(r_t(θ), 1−ε, 1+ε) Â_t ) ]

- Â_t is the advantage (typically [[../components/actor-critic|GAE]])
- ε is the clip range, usually 0.1–0.3
- The min over (unclipped, clipped) keeps the objective pessimistic — only takes credit for improvements when the policy hasn't moved too far

## Why It Works
- **Trust-region in disguise**: clipping mimics the KL constraint of TRPO, but is much simpler to implement (no second-order optimization)
- **Multiple epochs per batch**: unlike vanilla [[policy-gradient]], you can take several gradient steps on the same rollout without collapse
- **Stable across hyperparameters**: less sensitive than vanilla actor-critic; widely reproducible

## Practical Recipe
- GAE-λ for advantages (typically λ=0.95, γ=0.99)
- Value loss weight ≈ 0.5; entropy bonus ≈ 0.0–0.01 to encourage exploration
- Clip ratio ε = 0.2; 4–10 epochs per rollout; minibatch size ~64
- Clip the value function as well (PPO2 style)
- Normalize advantages per minibatch
- Orthogonal weight init helps

## Use Cases
- Robotics / continuous control (MuJoCo, real robots)
- Game agents (OpenAI Five, Dota 2)
- LLM alignment: PPO is the dominant method for RLHF (rewarding human-preference-trained reward model)

## See Also
- [[actor-critic]] — PPO is an actor-critic algorithm with clipped objective
- [[policy-gradient]] — the underlying paradigm
- [[../concepts/model-free-rl]] — RL family it belongs to
- [[../decisions/on-policy-vs-off-policy]] — PPO is on-policy

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 13 (policy-gradient family)
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9 (deep MARL applications)

## Tags
#ppo #policy-gradient #actor-critic #reinforcement-learning #on-policy
