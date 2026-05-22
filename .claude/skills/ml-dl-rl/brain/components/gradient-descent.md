# Gradient Descent

The most fundamental optimizer: step opposite the gradient.

θ_{t+1} = θ_t - η ∇f(θ_t)

## Variants
- **Batch GD** — use full dataset gradient (slow per step, expensive per epoch)
- **[[../concepts/stochastic-gradient-descent]]** — minibatch
- **Momentum** — accumulate velocity: v_{t+1} = β v_t + (1-β) ∇f; θ_{t+1} = θ_t - η v_{t+1}
- **Nesterov accelerated** — momentum lookahead
- **[[adam]] / [[rmsprop]] / [[adagrad]]** — adaptive per-parameter step sizes

## Convergence
- Convex L-smooth: O(1/k) for fixed step ≤ 1/L; O(1/k²) with Nesterov
- Strongly convex: O(exp(-k)) linear convergence
- Non-convex (deep nets): converges to stationary points; saddle points are most non-minima but SGD escapes them

## See Also
- [[sgd]], [[../concepts/stochastic-gradient-descent]] — minibatch variant (SGD)
- [[momentum]] — first major improvement
- [[adam]], [[adagrad]], [[rmsprop]] — adaptive variants
- [[newtons-method]], [[bfgs]] — second-order alternatives
- [[../concepts/optimization]] — overarching concept
- [[contour-plots]] — visual intuition for gradient steps

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 5
- [[../summaries/probabilistic-ml-introduction]] Ch. 8
- [[../summaries/understanding-deep-learning]] Ch. 6

## Tags
#optimization #gradient-descent #foundation
