# PyTorch

Open-source deep learning framework with dynamic computational graphs.

## Snapshot
- **Origin:** Meta AI Research
- **License:** BSD
- **Programming model:** Define-by-run (eager); compile to graph via TorchScript / `torch.compile`
- **Strengths:** Pythonic, flexible, debugging-friendly, dominant in research

## Brain Refs
- [[../summaries/machine-learning-systems]] Ch. 7 (AI Frameworks) compares PyTorch with [[jax]] and TensorFlow
- Used to build [[../components/cnn]], [[../components/transformer]], [[../components/transformer-encoder-decoder]], [[../components/mlp-tabular]] etc.
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 10 implements MARL algorithms in PyTorch
- Implements [[../concepts/automatic-differentiation]] via `torch.autograd` (define-by-run reverse-mode AD)
- Power user notebooks for [[../components/bayesian-neural-networks]] and [[../concepts/probabilistic-programming]] (Pyro, NumPyro on JAX)

## Tags
#framework #deep-learning #pytorch #meta
