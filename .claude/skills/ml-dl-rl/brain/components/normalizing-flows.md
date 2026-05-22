# Normalizing Flows

Generative models built from a sequence of invertible neural transformations of a simple base distribution. Tractable exact likelihood and exact sampling.

## Architectures
- **NICE / RealNVP** — coupling layers
- **Glow** — invertible 1×1 conv + coupling
- **MAF / IAF** — autoregressive flows (one of forward/inverse fast, the other slow)
- **Continuous flows / FFJORD** — neural ODE
- **Residual flows** — Lipschitz-constrained residual blocks

Trade-off: invertibility constrains expressiveness vs unconstrained networks (CNN, transformer).

## See Also
- [[diffusion-models]], [[variational-autoencoder]], [[gan]], [[autoregressive-models]] — alternative generative families
- [[../decisions/generative-model-choice]] — when to pick flows
- [[../concepts/maximum-likelihood-estimation]] — flows train with exact MLE (no ELBO)

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 23
- [[../summaries/understanding-deep-learning]] Ch. 16

## Tags
#normalizing-flows #generative-models #invertible
