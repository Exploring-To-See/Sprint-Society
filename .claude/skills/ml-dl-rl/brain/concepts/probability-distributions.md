# Probability Distributions

The mathematical machinery for reasoning about uncertainty — random variables, densities, expectations, and the families that show up everywhere in ML.

## Core Families
- **Discrete:** Bernoulli, binomial, categorical, multinomial, Poisson, geometric
- **Continuous on R:** Gaussian, Student t, Cauchy, Laplace
- **Continuous on R+:** gamma, exponential, chi-squared, log-normal, inverse-gamma
- **Continuous on [0,1]:** beta, Dirichlet (multivariate)
- **Multivariate:** multivariate Gaussian, multivariate t, Wishart, inverse-Wishart
- **Exponential family** unifies many of the above

## Key Identities
- Bayes' rule: p(θ|x) ∝ p(x|θ) p(θ)
- Conjugate priors keep posteriors in the same family (beta–Bernoulli, Gaussian–Gaussian, gamma–Poisson, Dirichlet–categorical)
- Central limit theorem: averages → Gaussian
- Marginalization, conditioning, change of variables (Jacobian)

## Why It Matters
- Foundation for all probabilistic ML: [[bayesian-inference]], [[maximum-likelihood-estimation]], [[graphical-models]]
- Used to define loss functions ([[cross-entropy-loss]] = negative log likelihood under categorical)
- Choice of likelihood determines the model

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 2–3 (univariate + multivariate)
- [[../summaries/probabilistic-ml-advanced]] Ch. 2 (full exponential family treatment, divergences)
- [[../summaries/algorithms-for-decision-making]] Ch. 2 (representation), [[../summaries/decision-making-under-uncertainty]] Ch. 2
- [[../summaries/algorithms-for-validation]] Ch. 2 (probability for system modeling)

## Tags
#probability #statistics #foundation #distributions
