# Momentum

Add a velocity term that accumulates past gradients to dampen oscillation in steep directions and accelerate in shallow valleys.

v_{t+1} = β v_t + (1-β) ∇f(θ_t)
θ_{t+1} = θ_t - η v_{t+1}

## Nesterov Accelerated Gradient
Look ahead by β v_t before computing the gradient: θ_t' = θ_t - η β v_t, then evaluate gradient at θ_t'. Convergence rate O(1/k²) for convex.

## See Also
- [[gradient-descent]], [[sgd]] — what momentum augments
- [[adam]] — uses momentum as its 1st-moment estimate
- [[../concepts/optimization]] — broader context

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 5.3–5.4
- [[../summaries/understanding-deep-learning]] Ch. 6.3

## Tags
#momentum #optimization #foundation
