# Laplace Approximation

Approximate the posterior with a Gaussian centered at the MAP estimate, with covariance equal to the inverse Hessian of -log p(θ|D) at the MAP.

Cheap when the loss landscape is locally Gaussian; degrades for multi-modal posteriors.

Used in [[bayesian-neural-networks]] and as a baseline for [[variational-inference]].

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 7 / 17

## Tags
#laplace #bayesian #approximation
