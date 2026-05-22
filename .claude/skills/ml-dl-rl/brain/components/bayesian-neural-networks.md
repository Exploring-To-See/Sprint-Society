# Bayesian Neural Networks

NNs where weights are random variables with a posterior — gives uncertainty estimates instead of point predictions.

## Approaches
- **[[laplace-approximation]]** — Gaussian around MAP
- **[[variational-inference]]** — mean-field or full-covariance Gaussian over weights
- **MC dropout** — interpret dropout at test time as approximate VI
- **Deep ensembles** — train multiple nets, average predictions
- **HMC** ([[mcmc]]) for small models
- **Stochastic-gradient MCMC** for large models (SGLD; see [[mcmc]])

## Why Useful
- Calibrated uncertainty for safety-critical / out-of-distribution detection
- Active learning (acquisition functions need uncertainty)

## Connection to GPs
- Infinite-width single-hidden-layer BNNs converge to [[gaussian-processes]] (Neal 1996); modern Neural Tangent Kernel theory extends this to deep networks at initialization

## See Also
- [[gaussian-processes]] — infinite-width limit of BNNs
- [[mcmc]] — HMC and SGLD posteriors
- [[variational-inference]], [[laplace-approximation]] — approximate inference building blocks
- [[dropout]] — basis of MC dropout interpretation
- [[../concepts/bayesian-inference]] — underlying paradigm

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 17

## Tags
#bayesian-nn #uncertainty #bayesian #deep-learning
