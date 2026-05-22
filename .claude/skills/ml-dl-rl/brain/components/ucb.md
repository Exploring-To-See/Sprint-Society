# Upper Confidence Bound (UCB)

Bandit algorithm: select the arm maximizing μ̂_a + c · √(ln t / N_a) — i.e., the upper confidence bound on its mean.

Achieves O(log T) regret, optimal up to constants. The "c" hyperparameter trades exploration for exploitation.

## Variants
- UCB1 (the basic Auer et al. version)
- UCB-V (variance-aware), KL-UCB (tighter for Bernoulli)
- LinUCB (contextual)

Closely related to OFU principle ("optimism in face of uncertainty") that drives many provably efficient RL algorithms.

## See Also
- [[thompson-sampling]] — Bayesian counterpart, same problem family
- [[multi-armed-bandits]] — the canonical setting
- [[mcts]] — UCT (UCB applied to tree search) drives MCTS exploration
- [[bayesian-optimization]] — UCB is a standard acquisition function
- [[../concepts/exploration-exploitation]] — the trade-off UCB resolves

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 2.7

## Tags
#ucb #bandits #exploration
