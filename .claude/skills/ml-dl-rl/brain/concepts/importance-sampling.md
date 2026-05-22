# Importance Sampling

Estimate E_p[f(X)] using samples from a *different* distribution q, with re-weighting.

E_p[f(X)] = E_q[f(X) · p(X)/q(X)]

## In RL
- **Off-policy evaluation:** estimate target policy's value from behavior policy's data, weight by π_target/π_behavior
- Per-decision and discounting-aware variants reduce variance
- Per-decision tree-backup avoids importance ratios

## In Inference / Validation
- Estimate rare-event probabilities by sampling from a distribution that emphasizes the rare region (failures), then re-weight
- Adaptive IS, sequential IS (particle filtering)

## Trade-off
Lower bias when q ≈ p; can have unbounded variance if q is very different from p (importance ratios blow up).

## See Also
- [[../components/monte-carlo]] — base estimator IS reweights
- [[../components/sequential-monte-carlo]] — particle-filter generalization
- [[../components/mcmc]] — alternative posterior sampler when IS variance is too high
- [[../decisions/on-policy-vs-off-policy]] — IS is the bridge in off-policy RL

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 5.5–5.9 (off-policy MC), Ch. 7.3
- [[../summaries/algorithms-for-validation]] Ch. 7.2–7.3 (failure probability estimation)
- [[../summaries/probabilistic-ml-advanced]] Ch. 11–12 (Monte Carlo + IS)

## Tags
#importance-sampling #monte-carlo #off-policy
