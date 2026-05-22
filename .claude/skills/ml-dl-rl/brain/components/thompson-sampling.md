# Thompson Sampling

Bandit / RL strategy: maintain a Bayesian posterior over arms (or Q-values), then at each step **sample** a θ from the posterior and act greedy w.r.t. that sample.

Probability-matching: sample arm a with probability that a is optimal under the posterior. Achieves O(log T) regret on bandits, often outperforms UCB empirically.

Generalizes naturally to contextual bandits (LinTS) and Bayesian RL.

## See Also
- [[ucb]] — frequentist counterpart, same problem family
- [[multi-armed-bandits]] — the canonical setting
- [[bayesian-optimization]] — TS is a standard acquisition function
- [[../concepts/exploration-exploitation]] — the trade-off TS resolves
- [[../concepts/bayesian-inference]] — posterior maintenance underlies the approach

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 2 (briefly)
- [[../summaries/algorithms-for-decision-making]] Ch. 15

## Tags
#thompson-sampling #bandits #bayesian #exploration
