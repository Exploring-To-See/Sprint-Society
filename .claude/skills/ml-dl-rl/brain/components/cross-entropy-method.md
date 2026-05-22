# Cross-Entropy Method (CEM)

Iterative sampling-based optimizer:
1. Sample N candidates from current distribution p_θ
2. Keep the top-k elite by objective
3. Refit p_θ to the elite (maximum likelihood)
4. Repeat

Used heavily in RL planning (CEM-MPC), policy search, and rare-event simulation.

## Strengths / Weaknesses
- Embarrassingly parallel (sample evaluations are independent)
- Robust to non-smooth / black-box objectives
- Sample-hungry compared to gradient-based methods when gradients are available

## See Also
- [[simulated-annealing]], [[nelder-mead]], [[bayesian-optimization]] — gradient-free siblings
- [[../components/importance-sampling]] — used in the rare-event-simulation framing
- [[../components/policy-gradient]] — alternative for differentiable policies

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 8.4

## Tags
#cem #optimization #stochastic #policy-search
