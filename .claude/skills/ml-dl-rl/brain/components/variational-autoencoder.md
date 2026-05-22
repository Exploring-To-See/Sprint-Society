# Variational Autoencoder (VAE)

Generative model that pairs an encoder q_φ(z|x) (recognition network) with a decoder p_θ(x|z), trained to maximize the ELBO:

ELBO = E_q[log p(x|z)] - KL(q(z|x) || p(z))

## Key Points
- Latent prior typically standard Gaussian
- Reparametrization trick: z = μ + σ·ε with ε ~ N(0,I) makes the encoder differentiable
- Provides a *probabilistic* latent space — can sample, interpolate
- β-VAE controls disentanglement via KL weight β

## Variants
- VQ-VAE (discrete codebook), used in autoregressive image / audio generation
- Hierarchical VAEs (NVAE)
- Conditional VAE for controllable generation

## See Also
- [[variational-inference]] — VAE is amortized VI: the encoder learns a q(z|x) family
- [[../components/diffusion-models]], [[../components/gan]], [[../components/normalizing-flows]] — alternative generative families
- [[../decisions/generative-model-choice]] — when to pick which family
- [[../concepts/bayesian-inference]] — underlying paradigm

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 21 (full chapter)
- [[../summaries/understanding-deep-learning]] Ch. 17

## Tags
#vae #generative-models #latent-variable #variational
