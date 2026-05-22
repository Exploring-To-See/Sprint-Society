# Gibbs Sampling

[[mcmc]] method that samples each variable conditional on the others, in turn:
x_i^(t+1) ~ p(x_i | x_{-i}^(t)).

Works well when full conditionals are tractable (Bayes nets, Ising models, latent Dirichlet allocation). Slow mixing if variables are highly correlated → block Gibbs or HMC.

## Where It's Covered
- [[../summaries/algorithms-for-decision-making]] Ch. 3.8
- [[../summaries/probabilistic-ml-advanced]] Ch. 12

## Tags
#gibbs #mcmc #bayesian
