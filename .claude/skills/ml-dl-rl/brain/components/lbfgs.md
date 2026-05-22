# L-BFGS

> **Canonical page is [[bfgs]]** (covers both BFGS and L-BFGS). This page focuses on the memory-limited differences.

Limited-memory variant of [[bfgs]]. Instead of storing the full d×d approximate inverse Hessian, L-BFGS keeps only the last m vector pairs (s_k, y_k) of position and gradient differences (typically m = 10–20).

## Memory & Compute
- BFGS: O(d²) memory, O(d²) per step
- L-BFGS: O(md) memory, O(md) per step — practical for d in the millions

## Two-Loop Recursion
The classic L-BFGS update reconstructs the search direction using a two-loop recursion over the stored pairs, avoiding any explicit Hessian materialization.

## When to Use
- Medium-scale smooth problems where the full Hessian doesn't fit but second-order info still pays off
- Logistic regression, CRF training, MAP for hierarchical Bayes
- Often the default in scientific Python (`scipy.optimize.minimize` method='L-BFGS-B')

## See Also
- [[bfgs]] — canonical page (full BFGS plus L-BFGS context)
- [[newtons-method]], [[trust-region-methods]] — other second-order methods

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 6.3

## Tags
#lbfgs #optimization #quasi-newton
