# Nelder-Mead Simplex Method

Direct (gradient-free) optimization using a simplex of d+1 points that reflects, expands, contracts, and shrinks toward the optimum.

Robust for low-dim, noisy, non-differentiable objectives. Default in `scipy.optimize.minimize`. Slow but doesn't need gradients.

## See Also
- [[simulated-annealing]], [[cross-entropy-method]], [[genetic-algorithms]] — other gradient-free options
- [[bayesian-optimization]] — sample-efficient alternative for expensive black-box objectives
- [[../concepts/optimization]] — broader landscape

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 7.5

## Tags
#nelder-mead #optimization #direct #gradient-free
