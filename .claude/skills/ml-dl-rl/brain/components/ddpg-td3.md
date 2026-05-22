# DDPG and TD3 (Deterministic Policy Gradient)

Off-policy [[actor-critic]] methods for **continuous action spaces**. The actor is a deterministic function μ_θ(s) → a; the critic is a Q-network. The gradient of the actor flows through the critic by the deterministic policy gradient theorem (Silver et al. 2014):

∇_θ J(θ) = E_s[ ∇_a Q(s, a) ∇_θ μ_θ(s) ]

## DDPG (Lillicrap et al. 2016)
- Combines deterministic policy gradient + DQN-style tricks ([[experience-replay]] + target networks)
- Continuous-control answer to [[dqn]]: same off-policy data reuse, but deterministic actor for continuous actions
- Notoriously brittle: performance is hyperparameter-sensitive and can collapse mid-training

## TD3 (Fujimoto et al. 2018) — "Twin Delayed DDPG"
Three fixes that make DDPG-class methods reliable:
1. **Twin critics** — train two Q networks; bootstrap target uses min(Q1, Q2) to fight overestimation (the same overestimation that motivates [[double-q-learning]])
2. **Delayed policy updates** — update the actor every d critic steps, not every step
3. **Target policy smoothing** — add clipped Gaussian noise to the target action; prevents the critic from exploiting sharp Q peaks

TD3 with default hyperparameters is competitive with [[sac]] on most MuJoCo benchmarks.

## DDPG / TD3 vs SAC
- TD3: deterministic actor, exploration via injected action noise (OU or Gaussian)
- [[sac]]: stochastic actor with entropy bonus, exploration is built into the objective
- SAC is the modern default for continuous control; TD3 is competitive and simpler

## Multi-Agent Variant
- **MADDPG** — centralized critics over the joint action, decentralized deterministic actors. Foundation of cooperative continuous-action MARL. See [[centralized-training-decentralized-execution]].

## See Also
- [[actor-critic]] — DDPG/TD3 are off-policy actor-critic
- [[policy-gradient]] — broader family
- [[sac]] — stochastic continuous-control sibling
- [[double-q-learning]] — the bias fix TD3 reuses on the critic
- [[experience-replay]] — replay enables off-policy learning
- [[dqn]] — discrete-action analogue
- [[../decisions/on-policy-vs-off-policy]] — DDPG/TD3 are off-policy

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 13 (policy-gradient family)
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 8 (deep RL primer); Ch. 9 (MADDPG)

## Tags
#ddpg #td3 #policy-gradient #actor-critic #continuous-control #off-policy #reinforcement-learning
