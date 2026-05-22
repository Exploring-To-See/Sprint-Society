# Sequential Monte Carlo (Particle Filtering)

Track a posterior over latent state by maintaining and updating a weighted particle ensemble. Standard for hidden Markov models and nonlinear/non-Gaussian state-space models.

## Cycle
1. **Predict** — propagate particles through dynamics
2. **Weight** — re-weight by likelihood of observation
3. **Resample** — replicate high-weight particles, drop low-weight ones (avoid degeneracy)

## Variants
- Auxiliary particle filter
- SMC samplers — generalize to static targets via tempering
- Used for failure probability estimation in [[../summaries/algorithms-for-validation]]

## See Also
- [[gaussian-filtering]] — closed-form alternative for linear-Gaussian models
- [[../concepts/importance-sampling]] — SMC is sequential IS with resampling
- [[mcmc]] — alternative posterior sampler for static targets
- [[multilevel-splitting]] — sibling rare-event method
- [[monte-carlo]] — base estimator family

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 13
- [[../summaries/algorithms-for-validation]] Ch. 7.4

## Tags
#smc #particle-filter #bayesian #state-space
