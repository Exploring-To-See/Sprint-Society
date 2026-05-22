# Soft Actor-Critic (SAC)

Haarnoja et al. (2018): off-policy [[actor-critic]] for continuous control with **maximum-entropy** RL. Optimizes expected return + α·entropy of the policy, encouraging exploration and producing robust stochastic policies.

## Objective
J(π) = Σ_t E_{(s,a)~π} [ r(s,a) + α · H(π(·|s)) ]

The entropy term H(π(·|s)) keeps the policy from collapsing prematurely. The temperature α can be tuned automatically against a target entropy.

## Key Mechanics
- **Twin Q-networks** (clipped double Q) — train two critics, take the min when bootstrapping → cuts overestimation bias
- **Squashed Gaussian actor** — `tanh(μ + σ·ε)` for bounded continuous actions, with the log-prob correction for the change of variables
- **Off-policy with replay** — uses [[experience-replay]] like [[dqn]]
- **Soft target networks** — Polyak averaging θ⁻ ← τθ + (1−τ)θ⁻

## Why It Wins
- **Sample-efficient** for continuous control vs on-policy [[ppo]]
- **Stable across hyperparameters** thanks to entropy bonus + twin Q
- **Strong default** for MuJoCo, robot manipulation, and locomotion
- **Automatic α** removes the hardest hyperparameter

## Variants and Successors
- **TD3** — deterministic counterpart with twin critics + delayed actor updates
- **DroQ, REDQ** — high replay-ratio variants with dropout-regularized critics
- **TQC** — distributional twin critics with quantile truncation
- **Discrete SAC** — adaptation for discrete action spaces

## See Also
- [[actor-critic]] — broader family
- [[ppo]] — on-policy alternative; common comparison
- [[experience-replay]] — required for off-policy operation
- [[../decisions/on-policy-vs-off-policy]] — SAC is firmly off-policy
- [[../concepts/exploration-exploitation]] — entropy bonus encodes exploration

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 13 (policy-gradient family, MaxEnt RL)
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 8 (deep RL primer)

## Tags
#sac #actor-critic #off-policy #continuous-control #max-entropy-rl #deep-rl
