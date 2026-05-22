# Monte Carlo Methods

Approximate expectations by sampling: E_p[f(X)] ≈ (1/N) Σ f(X_i), with X_i ~ p.

## Key Tools
- **Direct sampling** when you can sample p directly
- **[[../concepts/importance-sampling]]** when you can only sample a different q
- **Rejection sampling** when you can evaluate p (up to constant) but not sample
- **[[mcmc]]** when even normalization is intractable
- **[[sequential-monte-carlo]]** for sequential / state-space models

## See Also
- [[mcmc]] — Markov-chain refinement when the target is intractable to sample directly
- [[sequential-monte-carlo]] — sequential / particle-based generalization
- [[../concepts/importance-sampling]] — variance-reduction tool built on MC
- [[bayesian-monte-carlo]] — GP-based variance reduction
- [[multilevel-splitting]] — rare-event variance reduction

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 11
- [[../summaries/algorithms-for-validation]] Ch. 7

## Tags
#monte-carlo #sampling #foundation
