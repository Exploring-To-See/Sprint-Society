# Optimization

Finding parameters that minimize an objective — the engine of all learning.

## Categories
- **Continuous unconstrained:** [[../components/gradient-descent]], [[../components/newtons-method]], [[../components/bfgs]]
- **Continuous constrained:** Lagrangian, KKT, penalty/barrier, augmented Lagrangian
- **Stochastic:** [[../components/sgd]], [[../components/adam]], [[../components/adagrad]], [[../components/rmsprop]]
- **Direct (zeroth-order):** [[../components/nelder-mead]], DIRECT, pattern search
- **Population-based:** [[../components/genetic-algorithms]], [[../components/particle-swarm]], CMA-ES
- **Black-box / sample-efficient:** [[../components/bayesian-optimization]], surrogate models
- **Discrete:** branch & bound, cutting planes, [[../components/ant-colony-optimization]]
- **Multi-objective:** Pareto fronts, scalarization

## Big Ideas
- **Convexity** — global optimum guaranteed; most ML problems are non-convex
- **Lipschitz / smoothness** assumptions drive convergence rates
- **First-order vs second-order** trade compute for iterations
- **Robust optimization** handles uncertainty in data/parameters

## See Also
- [[stochastic-gradient-descent]] — minibatch concept that anchors deep learning
- [[contour-plots]] — visual intuition for optimization landscapes
- [[automatic-differentiation]] — how gradients are computed in modern stacks
- [[../decisions/optimizer-choice]] — Adam vs SGD vs alternatives in practice

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] — the canonical reference (21 chapters, Julia code)
- [[../summaries/probabilistic-ml-introduction]] Ch. 8 (ML-specific overview)
- [[../summaries/probabilistic-ml-advanced]] Ch. 6 (deeper on stochastic, constrained, proximal)
- [[../summaries/understanding-deep-learning]] Ch. 6 (DL-specific: SGD, Adam)

## Tags
#optimization #foundation
