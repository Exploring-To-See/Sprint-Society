# Markov Chain Monte Carlo (MCMC)

Construct a Markov chain whose stationary distribution is the target distribution; samples from the chain converge to samples from the target.

## Algorithms
- **Metropolis-Hastings** — accept/reject with target ratio
- **[[gibbs-sampling]]** — sample one variable at a time conditional on others
- **Hamiltonian Monte Carlo (HMC)** — use gradient information; far better mixing in high dim
- **NUTS** (No-U-Turn) — adaptive HMC
- **Langevin** dynamics — stochastic gradient + noise; bridges MCMC and SGD
- **Replica exchange / parallel tempering** for multimodal posteriors

## Practical Issues
- Mixing time and convergence diagnostics (R̂, ESS)
- Burn-in
- Cost of evaluating the target density per step

## See Also
- [[monte-carlo]] — the parent family
- [[gibbs-sampling]] — coordinate-wise MCMC variant
- [[../concepts/importance-sampling]] — alternative when MCMC mixing is hard
- [[variational-inference]] — deterministic alternative for posterior approximation
- [[bayesian-neural-networks]] — uses HMC / SGLD for BNN posteriors

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 12
- [[../summaries/algorithms-for-decision-making]] Ch. 3.8 (Gibbs)
- [[../summaries/algorithms-for-validation]] Ch. 6.3

## Tags
#mcmc #sampling #bayesian #foundation
