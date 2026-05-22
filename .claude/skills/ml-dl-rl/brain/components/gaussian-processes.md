# Gaussian Processes

A nonparametric Bayesian model that defines a *distribution over functions*. The posterior over function values at any finite set of inputs is jointly Gaussian.

## Specification
GP(m(x), k(x, x')) — mean function m and kernel k.

## Common Kernels
- **RBF / squared exponential** — smooth, infinitely differentiable
- **Matérn** — controlled smoothness ν
- **Linear / polynomial** — bounds on extrapolation
- **Periodic** — for cyclical data
- **Composite** — sums and products of kernels

## Strengths
- Principled uncertainty estimates → drives [[bayesian-optimization]]
- Few hyperparameters (kernel parameters fit by marginal likelihood)
- Works well in low-data regime

## Limitations
- O(n³) training, O(n²) memory for n training points — sparse approximations (inducing points), random Fourier features for scaling
- Choice of kernel encodes strong inductive biases
- Struggle in high dim without specialized kernels

## See Also
- [[bayesian-optimization]] — primary application; GP is the standard surrogate
- [[bayesian-monte-carlo]] — GP-based numerical integration
- [[bayesian-neural-networks]] — infinite-width-limit connection (Neal 1996, NTK)
- [[../concepts/bayesian-inference]] — broader paradigm
- [[../concepts/hyperparameter-tuning]] — primary BO+GP use case
- [[laplace-approximation]] — alternative for non-Gaussian GP likelihoods
- [[../concepts/probability-distributions]] — multivariate-Gaussian foundation

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 18 (full chapter)
- [[../summaries/algorithms-for-optimization]] Ch. 15

## Tags
#gaussian-processes #bayesian #nonparametric
