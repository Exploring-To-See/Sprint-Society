# Maximum Likelihood Estimation (MLE)

Find the parameters θ that maximize the likelihood of the observed data.

## Definition
θ̂_MLE = argmax_θ p(D|θ)

For i.i.d. data: equivalent to maximizing the sum of log-likelihoods. Often equivalent to minimizing a loss (e.g., negative log-likelihood = [[cross-entropy-loss]] for classification).

## Properties
- **Consistent** under regularity (converges to true θ as n → ∞)
- **Asymptotically efficient** (achieves Cramér-Rao lower bound)
- **Asymptotically Gaussian** (central limit theorem on score function)
- **Invariant** to reparametrization
- *Not* guaranteed unbiased in finite samples; can overfit
- Adding a prior → MAP estimate; integrating over prior → [[bayesian-inference]]

## Connections
- **MLE for Bernoulli:** p̂ = sample mean
- **MLE for Gaussian:** μ̂ = sample mean, Σ̂ = (biased) sample covariance
- **MLE for linear regression:** ordinary least squares (Gaussian noise)
- **MLE = empirical risk minimization** under log-loss

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 4.2 (introduction), 11 (linear regression), throughout
- [[../summaries/probabilistic-ml-advanced]] Ch. 3 (frequentist statistics), 2.4.5 (exponential family MLE)
- [[../summaries/algorithms-for-decision-making]] Ch. 4.1
- [[../summaries/decision-making-under-uncertainty]] Ch. 2.3.1

## Tags
#mle #estimation #statistics #optimization #foundation
