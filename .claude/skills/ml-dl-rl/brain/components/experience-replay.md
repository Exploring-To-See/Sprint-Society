# Experience Replay

Store past transitions (s, a, r, s') in a buffer and sample minibatches from it during training. Core to off-policy deep RL — turns a non-stationary online problem into something closer to supervised learning over a stationary distribution.

## Why It Helps
- **Decorrelates samples**: consecutive trajectory steps are highly correlated; sampling uniformly from a buffer breaks the correlation, stabilizing SGD
- **Sample efficiency**: each transition can be reused many times, not thrown away after one update
- **Stabilizes learning**: smooths out the data distribution as the policy improves
- Combined with a target network it makes neural [[q-learning]] (DQN) tractable

## Variants
- **Uniform replay** — DQN default (Mnih et al. 2015, [[../entities/atari-dqn]])
- **Prioritized experience replay (PER)** — sample transitions with probability proportional to TD-error magnitude; faster learning on hard transitions
- **Hindsight Experience Replay (HER)** — relabel goals on failed trajectories, key for sparse-reward goal-conditioned tasks
- **Distributed replay (Ape-X, R2D2)** — many actors fill one shared buffer
- **Replay-ratio tuning** — modern off-policy methods (DroQ, TQC) push the ratio of gradient steps to environment steps far above 1

## Constraints
- **Off-policy only** — on-policy methods like [[ppo]] need fresh rollouts, not stale buffer data
- **Memory** — large buffers (1M+ transitions) need careful storage; image observations especially benefit from compression / shared frames
- **Stale data** — very old transitions can hurt if the policy has drifted; some methods truncate the buffer

## See Also
- [[dqn]] — canonical replay-based deep RL algorithm
- [[q-learning]] — base tabular algorithm DQN extends
- [[../entities/atari-dqn]] — original deep RL benchmark, replay is essential
- [[double-q-learning]] — often paired with replay
- [[ddpg-td3]], [[sac]] — off-policy continuous-control methods that depend on replay
- [[../decisions/on-policy-vs-off-policy]] — replay is an off-policy enabler

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 6, 16 (DQN case study)
- [[../summaries/algorithms-for-decision-making]] Ch. 17

## Tags
#experience-replay #dqn #off-policy #reinforcement-learning #deep-rl #foundation
