# Generative Adversarial Network (GAN)

Two networks playing a minimax game: generator G synthesizes samples, discriminator D tries to distinguish them from real. Trained jointly.

min_G max_D E_real[log D(x)] + E_z[log(1 - D(G(z)))]

## Innovations
- **DCGAN** — convolutional GANs
- **WGAN** — Wasserstein loss, gradient penalty
- **StyleGAN** — high-resolution photorealistic faces
- **CycleGAN** — unpaired image-to-image translation
- **BigGAN** — class-conditional, large-scale

## Status (2026)
Mostly displaced by [[diffusion-models]] for image generation; still useful for unsupervised image-to-image and certain real-time generation.

## Training Pathologies
- Mode collapse (G produces narrow distribution)
- Training instability — D gets too strong, G's gradient vanishes
- Hyperparameter sensitivity

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 26
- [[../summaries/understanding-deep-learning]] Ch. 15

## Tags
#gan #generative-models #adversarial
