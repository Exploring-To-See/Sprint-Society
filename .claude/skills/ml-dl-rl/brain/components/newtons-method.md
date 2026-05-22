# Newton's Method

Second-order optimization: use the inverse Hessian to take a quadratic-aware step.

θ_{t+1} = θ_t - H⁻¹ ∇f(θ_t)

## Properties
- Quadratic convergence near a minimum
- Cost: O(d²) for Hessian, O(d³) for inverse — infeasible for deep nets
- Sensitive: H must be positive definite; otherwise step direction may be wrong (use modified Newton, regularized Hessian)

## Approximations
- **Quasi-Newton** ([[bfgs]], [[lbfgs]]) — build H⁻¹ approximation from gradients only
- **Hessian-free** — use Hessian-vector products via autodiff
- **K-FAC** — Kronecker-factored approx for neural nets
- **Natural gradient** — H = Fisher information instead of true Hessian

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 6
- [[../summaries/probabilistic-ml-introduction]] Ch. 8

## Tags
#newton #optimization #second-order
