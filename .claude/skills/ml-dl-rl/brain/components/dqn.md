# Deep Q-Network (DQN)

Mnih et al. (DeepMind, Nature 2015): use a deep [[cnn]] to approximate the action-value function Q(s,a) and train it with [[q-learning]] on game-image inputs. The first algorithm to match human-level performance across the full [[../entities/atari-dqn]] benchmark from raw pixels.

## Why It Was Hard Before
Naively combining Q-learning with deep nets diverges:
- Consecutive frames are highly correlated → gradients are biased
- The target Q* moves every gradient step (the network targets itself)
- Reward magnitudes vary wildly across games

## Two Key Tricks
1. **[[experience-replay]]** — store transitions in a buffer, sample minibatches uniformly. Decorrelates updates, enables data reuse.
2. **Target network** — a frozen copy θ⁻ of the parameters used to compute the bootstrap target r + γ max_{a'} Q_{θ⁻}(s', a'). Updated every C steps. Stops the moving-target instability.

Loss: L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q_{θ⁻}(s',a') − Q_θ(s,a))² ]

## Standard Extensions (the "Rainbow" stack)
- **Double DQN** ([[double-q-learning]]) — decouple action selection from evaluation; fixes max-bias
- **Prioritized experience replay** — sample by TD error
- **Dueling networks** — split V(s) and A(s,a) heads
- **Multi-step returns (n-step)** — bootstrap from n-step targets
- **Distributional RL (C51, QR-DQN)** — learn the return distribution
- **Noisy nets** — parametric exploration noise in the weights
- **Rainbow** (Hessel et al. 2018) combines all six

## Modern Lineage
- Distributed DQN: Ape-X, R2D2 (recurrent), Agent57
- Discrete-action default; continuous control uses [[ppo]] / [[sac]] / TD3 instead
- Offline RL variants: CQL, IQL build on DQN-style value learning

## See Also
- [[q-learning]] — tabular base algorithm
- [[experience-replay]] — replay buffer mechanics
- [[double-q-learning]] — overestimation fix used in Double DQN
- [[../entities/atari-dqn]] — the benchmark DQN was built for
- [[cnn]] — typical backbone for image-based DQN
- [[alpha-go]], [[alpha-zero]] — same DeepMind era; DQN proved deep RL works on Atari, AlphaGo proved it works on Go
- [[ppo]], [[sac]], [[ddpg-td3]] — continuous-control / on-policy alternatives
- [[../decisions/on-policy-vs-off-policy]] — DQN is off-policy

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 16.5 (Human-level Video Game Play)
- [[../summaries/understanding-deep-learning]] Ch. 19
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 8 (deep RL primer)

## Tags
#dqn #deep-rl #q-learning #off-policy #reinforcement-learning #foundation
