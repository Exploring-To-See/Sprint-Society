# BFGS / L-BFGS

> **Canonical page** for both BFGS and its memory-limited variant L-BFGS. See [[lbfgs]] for the L-BFGS-specific differences only.

Quasi-Newton methods that approximate the inverse Hessian using gradient differences across iterations.

- **BFGS** stores the full d×d approximate Hessian
- **L-BFGS** ("limited memory") stores only the last m gradient pairs (typically m=10–20) — practical for high-dim problems

Often the default for medium-scale convex / smooth problems where SGD's noise is unhelpful.

## Why Quasi-Newton
- [[newtons-method]] uses the true Hessian — quadratic convergence but O(d²) memory and O(d³) per step to invert
- BFGS approximates the inverse Hessian using only first-order info (gradients), achieving superlinear convergence at much lower cost
- Updates use the secant equation: H⁺ (g_{k+1} - g_k) ≈ (x_{k+1} - x_k)

## See Also
- [[newtons-method]] — uses the true Hessian
- [[gradient-descent]] — first-order baseline
- [[trust-region-methods]] — alternative second-order family
- [[lbfgs]] — limited-memory variant page

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 6.3
- [[../summaries/probabilistic-ml-introduction]] Ch. 8

## Tags
#bfgs #lbfgs #optimization #quasi-newton
