# Bayesian Optimization

Sample-efficient global optimization for expensive black-box functions. Iteratively:
1. Fit a probabilistic surrogate (typically [[gaussian-processes]]) to seen points
2. Maximize an **acquisition function** that trades exploration vs exploitation
3. Evaluate the true objective at the chosen point, repeat

## Acquisition Functions
- **Probability of improvement (PI)** — P(f(x) > f_best + ξ)
- **Expected improvement (EI)** — E[max(0, f(x) - f_best)]
- **Upper confidence bound (UCB)** — μ(x) + κ σ(x)
- **Thompson sampling** — sample a function from the posterior, take its argmax
- **Information-theoretic** — entropy search, MES

## Use Cases
- Hyperparameter tuning (especially when each trial is expensive — large model training)
- Drug / materials discovery
- Robot policy search
- A/B testing for slow metrics

## See Also
- [[gaussian-processes]] — typical surrogate
- [[../concepts/exploration-exploitation]] — central trade-off encoded by acquisition
- [[../concepts/value-of-information]] — information-theoretic acquisition functions formalize VoI
- [[ucb]], [[thompson-sampling]] — bandit cousins of acquisition strategies

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 15 (probabilistic surrogates), Ch. 16 (surrogate optimization)
- [[../summaries/probabilistic-ml-introduction]] Ch. 5.6

## Tags
#bayesian-optimization #gaussian-processes #black-box #hyperparameter-tuning
