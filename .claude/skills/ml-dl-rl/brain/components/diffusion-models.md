# Diffusion Models

Generative models that learn to *denoise* — train a network to undo iterative Gaussian noise added to data, then sample by starting from pure noise and denoising.

## Variants / Names
- DDPM (denoising diffusion probabilistic models)
- Score-based generative modeling (Song & Ermon)
- DDIM (deterministic, fewer steps)
- Latent diffusion (Stable Diffusion) — operate in VAE latent space, much cheaper
- Flow matching, rectified flow — continuous-time generalizations

## Why Dominant (since ~2022)
- Beat GANs on FID for image generation
- Stable training (no min-max)
- High-quality samples; controllable via guidance (classifier-free, cross-attention text)
- Powers DALL·E 2/3, Stable Diffusion, Midjourney, video diffusion (Sora-class)

## Costs
- Slow inference (many denoising steps); distillation / consistency models reduce to few steps
- Memory-intensive training

## See Also
- [[variational-inference]] — diffusion training loss is a hierarchical variational lower bound
- [[variational-autoencoder]] — VAE shares the ELBO foundation; latent diffusion runs *inside* a VAE
- [[../components/gan]], [[../components/normalizing-flows]], [[../components/autoregressive-models]] — alternative generative families
- [[../decisions/generative-model-choice]] — comparison table

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 25
- [[../summaries/understanding-deep-learning]] Ch. 18

## Tags
#diffusion #generative-models #score-based
