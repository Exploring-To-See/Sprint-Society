# Decision: Variational Inference vs MCMC

## Use [[../components/variational-inference]] when
- Posterior inference must be fast (real-time, large data)
- Acceptable to have biased mode-seeking estimates
- You want gradient-based optimization
- The ELBO is differentiable (e.g., reparametrization)
- Examples: [[../components/variational-autoencoder]], Bayesian neural nets, large topic models

## Use [[../components/mcmc]] when
- You need asymptotically exact posterior samples
- You can afford lengthy training (hours to days)
- Gradient information is available (HMC/NUTS) — much better than naive MH
- You're doing science / model checking with full uncertainty
- Examples: hierarchical Bayesian models, small / medium data with rich structure

## Hybrid
- **Stochastic gradient MCMC** (SGLD) — bridges optimization and sampling for big models
- **Amortized inference** — VI to initialize MCMC

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 7 (overview), 10 (VI), 12 (MCMC)

## Tags
#decisions #bayesian-inference #variational #mcmc
