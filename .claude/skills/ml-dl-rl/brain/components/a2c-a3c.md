# A2C / A3C (Advantage Actor-Critic)

Synchronous (A2C) and asynchronous (A3C) variants of [[actor-critic]] that popularized parallel rollouts as a stand-in for [[experience-replay]] in on-policy deep RL.

## A3C — Asynchronous Advantage Actor-Critic (Mnih et al. 2016)
- Multiple worker threads each run a copy of the env and compute gradients on their own rollouts
- Workers asynchronously push gradients into a shared parameter server
- Key insight: parallel exploration *decorrelates* updates without needing a replay buffer — solving the same instability that motivated DQN's replay
- Hogwild-style lock-free updates were tolerated empirically

## A2C — Synchronous Variant
- Same algorithm but workers step in lockstep and average gradients before updating
- In practice A2C matches or beats A3C on most benchmarks (the asynchrony was not the win)
- Cleaner to reason about and easier to scale to GPU/TPU

## Update
- Critic loss: TD or n-step return target on V(s)
- Actor loss: -log π(a|s) · Â_t  with  Â_t = r_t + γ V(s_{t+1}) − V(s_t)  (or n-step / GAE)
- Entropy bonus on the policy to encourage exploration

## Status
- Largely superseded by [[ppo]] (more stable, similar wall-clock) for on-policy continuous control and discrete control
- Conceptually important: showed parallelism > replay for on-policy methods
- IMPALA / SEED RL are distributed-actor-critic descendants for very large-scale training

## See Also
- [[actor-critic]] — the family
- [[policy-gradient]] — underlying paradigm
- [[ppo]] — the algorithm that displaced A2C/A3C
- [[reinforce]] — single-actor predecessor
- [[../decisions/on-policy-vs-off-policy]] — A2C/A3C are on-policy

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 13
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 8 (deep RL primer)

## Tags
#a2c #a3c #actor-critic #policy-gradient #on-policy #reinforcement-learning
