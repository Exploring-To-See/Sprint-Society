# Multi-Armed Bandits

The simplest [[../concepts/exploration-exploitation]] setting: a single state, K arms, each with unknown reward distribution. At each step, pull one arm and observe its reward; minimize regret = T·μ* - Σ rewards.

## Algorithms
- **ε-greedy** — pull random arm with probability ε, else best-mean arm
- **Optimistic initialization** — start with high estimates → forced exploration
- **[[ucb]]** — upper confidence bound, logarithmic regret
- **[[thompson-sampling]]** — sample posterior, take argmax

## Variants
- **Contextual bandits** — observe a feature x_t before picking arm; bridge to RL
- **Adversarial bandits** — no stochastic model
- **Best-arm identification** — pure exploration
- **Bayesian bandits** — full posterior over each arm's mean

## See Also
- [[ucb]] — upper confidence bound algorithm
- [[thompson-sampling]] — Bayesian posterior sampling
- [[../concepts/exploration-exploitation]] — central trade-off
- [[../concepts/value-of-information]] — VoI motivates information-gathering arms
- [[bayesian-optimization]] — close cousin (continuous-arm bandit)
- [[../concepts/active-learning]] — sibling problem (active labeling vs active arm-pulling)
- [[../concepts/reinforcement-learning]] — bandits are the contextless special case

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 2 (the bandit chapter)
- [[../summaries/probabilistic-ml-introduction]] Ch. 5.3
- [[../summaries/algorithms-for-decision-making]] Ch. 15

## Tags
#bandits #exploration #reinforcement-learning
