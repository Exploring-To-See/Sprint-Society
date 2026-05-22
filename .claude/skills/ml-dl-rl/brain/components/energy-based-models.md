# Energy-Based Models

Generative models that define p(x) ∝ exp(-E(x)) for an energy function E learned by a neural net. Sampling requires MCMC or Langevin dynamics.

Connections to score-based / [[diffusion-models]]: the gradient of -E is the score ∇log p(x).

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 24

## Tags
#ebm #generative-models #score
