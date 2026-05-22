# Actor-Critic

Combines [[policy-gradient]] (the *actor*) with a learned [[../concepts/value-function]] estimate (the *critic*). The critic gives a low-variance baseline, dramatically improving sample efficiency.

Update:
- Critic: minimize TD error of V (or Q)
- Actor: ∇log π · advantage, where advantage = critic estimate

## Modern Variants
- **A2C / A3C** — synchronous / asynchronous parallel actors
- **[[ppo]]** — clipped surrogate objective, stable
- **[[sac]]** — entropy regularization for exploration
- **TD3** — twin critics + delayed policy updates for continuous actions

## See Also
- [[policy-gradient]] — the actor side
- [[../concepts/value-function]] — what the critic learns
- [[ppo]], [[sac]] — modern actor-critic algorithms
- [[temporal-difference-learning]] — TD targets the critic minimizes
- [[multi-agent-policy-gradient]] — multi-agent extensions (MADDPG, MAPPO)

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 13
- [[../summaries/algorithms-for-decision-making]] Ch. 13

## Tags
#actor-critic #policy-gradient #reinforcement-learning
