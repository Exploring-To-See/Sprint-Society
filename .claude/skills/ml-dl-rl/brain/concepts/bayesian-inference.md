# Bayesian Inference

Treating model parameters as random variables; updating beliefs with data via Bayes' rule.

## Core
Posterior ∝ likelihood × prior. The output is a *distribution* over parameters, not a point estimate.

- **Prior** p(θ): beliefs before data
- **Likelihood** p(x|θ): generative model
- **Posterior** p(θ|x): beliefs after data
- **Posterior predictive** p(x_new|x): integrates over θ

## Practical Methods
When the posterior is not closed-form:
- [[../components/variational-inference]] — optimize an approximation (fast, biased)
- [[../components/mcmc]] — sample from the posterior (slow, asymptotically exact)
- [[../components/sequential-monte-carlo]] — particle methods for sequential data
- [[../components/laplace-approximation]] — Gaussian around MAP

## Variants
- **Empirical Bayes:** estimate hyperparameters from data
- **Hierarchical Bayes:** nested priors share information across groups
- **Bayesian model averaging:** average predictions over models weighted by posterior

## See Also
- [[maximum-likelihood-estimation]] — frequentist counterpart (MAP is the bridge)
- [[probability-distributions]] — building blocks for priors and likelihoods
- [[../components/mcmc]], [[../components/variational-inference]], [[../components/laplace-approximation]] — inference algorithms
- [[../components/bayesian-neural-networks]] — Bayesian inference applied to NN weights
- [[../decisions/bayesian-vs-frequentist]], [[../decisions/inference-method-choice]] — paradigm and method choice

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 4 (statistics) — frequentist vs Bayesian
- [[../summaries/probabilistic-ml-advanced]] Ch. 3 (deep treatment), Ch. 7–13 (inference algorithms)
- [[../summaries/algorithms-for-decision-making]] Ch. 4 (parameter learning)
- [[../summaries/decision-making-under-uncertainty]] Ch. 2.3
- See [[../decisions/bayesian-vs-frequentist]] for trade-offs

## Tags
#bayesian #inference #probability #foundation
