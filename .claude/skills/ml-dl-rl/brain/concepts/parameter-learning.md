# Parameter Learning

Estimating numerical parameters of a probabilistic model from data.

## Approaches
- **MLE** — point estimate maximizing likelihood; see [[maximum-likelihood-estimation]]
- **MAP** — point estimate maximizing posterior (likelihood × prior)
- **Bayesian** — full posterior over parameters
- **EM algorithm** — when latent variables make the likelihood intractable; alternates E-step (compute posterior over latents) and M-step (max likelihood given those)
- **Nonparametric** — let model complexity grow with data (kernel density, Bayesian nonparametrics)
- **Missing data** — handle with EM, multiple imputation, or marginalization

## Where It's Covered
- [[../summaries/algorithms-for-decision-making]] Ch. 4
- [[../summaries/decision-making-under-uncertainty]] Ch. 2.3
- [[../summaries/probabilistic-ml-introduction]] Ch. 4
- [[../summaries/probabilistic-ml-advanced]] Ch. 3 (frequentist + Bayesian)

## Tags
#parameter-learning #estimation #statistics
