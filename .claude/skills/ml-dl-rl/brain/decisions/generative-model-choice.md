# Decision: Which Generative Model?

Modern probabilistic ML offers five main families. Each makes different trade-offs.

## Comparison

| Family | Likelihood | Sample Quality | Sample Speed | Training |
|---|---|---|---|---|
| [[../components/autoregressive-models]] | Exact | High | Slow (sequential) | Stable |
| [[../components/normalizing-flows]] | Exact | Medium | Fast | Stable |
| [[../components/variational-autoencoder]] | Lower bound (ELBO) | Medium (blurry) | Fast | Stable |
| [[../components/gan]] | None (implicit) | Very high | Fast | Unstable |
| [[../components/diffusion-models]] | Lower bound | Very high | Slow (many steps) | Very stable |
| [[../components/energy-based-models]] | Unnormalized | High | Slow (MCMC) | Tricky |

## When to Use Which
- **LLMs / text / code** → autoregressive
- **High-quality image / video / audio** → diffusion (state-of-the-art since 2022)
- **Density estimation / scientific** → normalizing flows
- **Latent space for downstream tasks** → VAE
- **Ultra-high-quality + fast** → distilled diffusion or VQ-GAN

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 20 (overview chapter)
- [[../summaries/understanding-deep-learning]] Ch. 14–18

## Tags
#decisions #generative-models #deep-learning
