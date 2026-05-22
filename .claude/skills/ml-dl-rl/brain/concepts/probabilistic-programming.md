# Probabilistic Programming

Programming languages where probabilistic models are expressed as code and inference is provided by the runtime.

## Examples
- Stan, PyMC, NumPyro (HMC/NUTS-focused)
- Pyro, Edward2 (deep PPL with VI)
- Gen, Turing.jl (Julia)
- BUGS / JAGS (older, declarative)

## What They Provide
- Sampling primitives (`x ~ Normal(0, 1)`)
- Conditioning (observe statements)
- Generic inference: HMC, NUTS, [[../components/variational-inference]], particle methods
- Composability: build big models from small ones

## See Also
- [[bayesian-inference]] — what PPLs operationalize
- [[../components/mcmc]], [[../components/sequential-monte-carlo]] — common backend inference engines
- [[../entities/jax]], [[../entities/pytorch]] — host runtimes for NumPyro / Pyro

## Where It's Covered
- [[../summaries/algorithms-for-validation]] Ch. 6.4 (Probabilistic Programming for failure distributions)
- [[../summaries/probabilistic-ml-advanced]] referenced throughout inference chapters

## Tags
#probabilistic-programming #ppl #bayesian-inference
