# Algorithms for Optimization (Kochenderfer, Wheeler 2019)

Stanford's broad introduction to optimization algorithms (continuous, discrete, stochastic, multidisciplinary), with Julia implementations.

## Identification
- **Authors:** Mykel J. Kochenderfer, Tim A. Wheeler (Stanford)
- **Publisher:** MIT Press, 2019
- **License:** CC-BY-NC-ND
- **Source:** [[../entities/book-opt]]

## Structure (21 chapters)

### Foundations
1. Introduction — optimization process, basic problem, constraints, critical points, [[../concepts/contour-plots]]
2. **Derivatives & Gradients** — numerical / [[../concepts/automatic-differentiation]]
3. **Bracketing** (1D) — Fibonacci, golden section, quadratic fit, Shubert-Piyavskii, bisection
4. **Local Descent** — descent direction, line search, [[../components/trust-region-methods]], termination

### Continuous Optimization
5. **First-Order Methods** — [[../components/gradient-descent]], conjugate gradient, momentum, Nesterov, [[../components/adagrad]], [[../components/rmsprop]], [[../components/adam]]
6. **Second-Order** — [[../components/newtons-method]], secant, [[../components/bfgs]] / [[../components/lbfgs]]
7. **Direct Methods** — coordinate search, Powell, Hooke-Jeeves, [[../components/nelder-mead]], DIRECT
8. **Stochastic Methods** — noisy descent, MADS, [[../components/simulated-annealing]], [[../components/cross-entropy-method]]
9. **Population Methods** — [[../components/genetic-algorithms]], [[../components/particle-swarm]], evolution strategies, CMA-ES
10. **Constraints** — Lagrange multipliers, KKT, penalty/barrier methods, augmented Lagrangian
11. **Linear Programming** — simplex, duality
12. **Multiobjective** — Pareto fronts, scalarization, MOEAs

### Modern Optimization
13. **Sampling Plans** — full factorial, Latin hypercube, low-discrepancy, quasi-random
14. **Surrogate Models** — RBFs, kriging, response surfaces
15. **Probabilistic Surrogate Models** — [[../components/gaussian-processes]], [[../components/bayesian-optimization]], acquisition functions (PI, EI, UCB)
16. **Surrogate Optimization** — surrogate model search
17. **Optimization Under Uncertainty** — robust optimization
18. **Uncertainty Propagation** — Monte Carlo, polynomial chaos, [[../components/bayesian-monte-carlo]]
19. **Discrete Optimization** — IPs, rounding, cutting planes, branch & bound, dynamic programming, [[../components/ant-colony-optimization]]
20. **Expression Optimization** — [[../components/genetic-programming]], grammatical evolution
21. **Multidisciplinary Optimization** — collaborative, simultaneous analysis

### Appendices
- A: Julia primer; B: standard test functions (Ackley, Booth, Branin, Rosenbrock, etc.); C: math concepts; D: solutions

## Why It Matters
- The continuous + stochastic + discrete optimization reference for ML
- Optimization chapters in [[probabilistic-ml-introduction]] (Ch. 8) and [[probabilistic-ml-advanced]] (Ch. 6) cover ML-specific optimizers; this book covers the *whole* engineering optimization landscape (BO, evolutionary, multidisciplinary)
- Pairs with [[algorithms-for-decision-making]] and [[algorithms-for-validation]] as the Stanford trilogy

## Tags
#optimization #gradient-descent #bayesian-optimization #genetic-algorithms #simulated-annealing #julia #kochenderfer #textbook

## Source
- Raw: `raw/optimization-1e.pdf` (md5: c7af6b1520c0c2c25bfb155c9e248a55)
- Online: algorithmsbook.com/optimization
