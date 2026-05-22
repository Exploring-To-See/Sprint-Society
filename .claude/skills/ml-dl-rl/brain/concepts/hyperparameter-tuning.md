# Hyperparameter Tuning

Searching over the (small, high-impact) set of training settings the learner does *not* fit from data: learning rate, weight decay, batch size, depth/width, regularizers, schedule, optimizer, etc.

## Methods (Cheap → Expensive)

### Grid / Random Search
- **Grid search** — exhaustive over a Cartesian product. Simple, but wastes budget on dimensions that don't matter
- **Random search** — sample from a distribution per hyperparameter. Beats grid when only a few hyperparameters dominate (Bergstra & Bengio 2012)

### Sequential / Adaptive
- **Successive halving / Hyperband** — start many trials with small budget, kill the worst, give survivors more compute
- **ASHA** — asynchronous Hyperband for distributed clusters
- **Population-Based Training (PBT)** — train a population in parallel; periodically copy weights from winners and perturb their hyperparameters. Used in [[../components/alpha-star]]

### Model-Based
- **[[../components/bayesian-optimization]]** — fit a surrogate (typically [[../components/gaussian-processes]]); pick the next point via an acquisition function
- **TPE / SMAC** — tree-structured Parzen estimator and random forests for high-dim or conditional spaces
- **BOHB** — combines Bayesian optimization with Hyperband

### Gradient-Based
- **Hypergradient descent** — differentiate through (a few) inner training steps and update LR / weight decay along the gradient
- **Implicit differentiation** through fixed points (T1-T2 split, hyperparameter optimization with implicit Jacobians)

## Decisions
- **What to tune** — learning rate is almost always #1. Weight decay, batch size, schedule next. Architecture last.
- **Search budget** — random search to scope the space, then BO / Hyperband to refine
- **Per-trial budget** — Hyperband-style successive halving when full training is expensive

## Pitfalls
- **Tuning on the test set** — keep a held-out test set the search never sees
- **LR / batch-size coupling** — batch size scaling changes effective LR; tune them jointly
- **Over-tuning a single seed** — variance across seeds often exceeds variance across reasonable hyperparameters

## See Also
- [[../components/bayesian-optimization]] — the canonical model-based tuner
- [[../components/gaussian-processes]] — the canonical BO surrogate
- [[active-learning]] — sibling problem (active *labeling* vs active *config evaluation*)
- [[exploration-exploitation]] — every adaptive search trades these
- [[value-of-information]] — VOI framing of "is this trial worth running?"
- [[../decisions/optimizer-choice]] — LR is the single most consequential hyperparameter

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 14–16 (surrogate-based, BO)
- [[../summaries/probabilistic-ml-introduction]] Ch. 5.6
- [[../summaries/machine-learning-systems]] Ch. 7 (training-system perspective)
- [[../summaries/understanding-deep-learning]] Ch. 8

## Tags
#hyperparameter-tuning #optimization #bayesian-optimization #automl
