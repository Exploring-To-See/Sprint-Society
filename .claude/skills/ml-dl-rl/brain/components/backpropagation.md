# Backpropagation

Reverse-mode [[../concepts/automatic-differentiation]] applied to neural networks: forward pass computes activations, backward pass computes gradients via chain rule.

## Why Cheap
- Cost of backward pass ≈ cost of forward pass (constant factor)
- Gradients of *all* parameters w.r.t. a scalar loss in one backward sweep
- Compositional: differentiable layers compose into differentiable models

## Implementations
- **Manual** — derive and code by hand (rare, error-prone)
- **Computational graph + autodiff** — modern frameworks ([[../entities/pytorch]], [[../entities/jax]])
- **Higher-order grads** — autodiff applied to autodiff

## See Also
- [[../concepts/automatic-differentiation]] — the underlying technique (reverse-mode AD)
- [[gradient-descent]], [[sgd]], [[adam]] — what consumes the gradients
- [[cnn]], [[transformer]], [[transformer-encoder-decoder]] — architectures that depend on backprop
- [[../entities/pytorch]], [[../entities/jax]] — modern autodiff frameworks

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 7
- [[../summaries/probabilistic-ml-introduction]] Ch. 13

## Tags
#backpropagation #autodiff #deep-learning #foundation
