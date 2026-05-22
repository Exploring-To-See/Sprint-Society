# Automatic Differentiation (autodiff)

Computing exact derivatives of programs by tracking the chain rule through elementary operations. Backbone of all modern deep learning.

## Two Modes
- **Forward mode** — propagate tangent vectors alongside values; cost ~1× per input dim
- **Reverse mode (backprop)** — first forward pass storing intermediates, then backward pass propagating cotangents; cost ~1× per *output* dim
- For functions f: R^n → R, reverse mode wins when n is large (typical ML case)

## Implementations
- **Static graph** (TF1): build graph, execute
- **Dynamic graph (define-by-run)** ([[../entities/pytorch]], [[../entities/jax]] under `jax.grad`): trace as you go
- **Source-to-source** vs **operator overloading**

## Beyond First Derivatives
- Hessian-vector products via grad-of-grad
- vmap / jvp / vjp transforms in JAX

## See Also
- [[../components/backpropagation]] — reverse-mode AD applied to neural nets
- [[../entities/pytorch]], [[../entities/jax]] — modern AD frameworks
- [[../components/gradient-descent]], [[../components/adam]] — what consumes AD output

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 2.4
- [[../summaries/machine-learning-systems]] Ch. 7.3.2 (extensive)
- [[../summaries/understanding-deep-learning]] Ch. 7 ([[../components/backpropagation]])

## Tags
#autodiff #backpropagation #deep-learning #optimization
