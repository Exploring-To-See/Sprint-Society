# JAX

Google's NumPy-compatible accelerated array computing with JIT, autograd, and parallelism.

## Snapshot
- **Origin:** Google Research / DeepMind
- **License:** Apache 2.0
- **Programming model:** Functional, pure-function compilation via XLA
- **Strengths:** Composable transforms (`jit`, `grad`, `vmap`, `pmap`), TPU-native, strong for Bayesian/research

## Brain Refs
- [[../summaries/machine-learning-systems]] Ch. 7 — JAX as a major framework alongside PyTorch and TensorFlow
- Murphy's Probabilistic ML books ([[book-pml1]] / [[book-pml2]]) use JAX in the companion notebooks
- `jax.grad` is composable [[../concepts/automatic-differentiation]] (forward and reverse modes)
- Hosts [[../concepts/probabilistic-programming]] DSLs (NumPyro, BlackJAX) for fast Bayesian inference

## Tags
#framework #jax #google #functional
