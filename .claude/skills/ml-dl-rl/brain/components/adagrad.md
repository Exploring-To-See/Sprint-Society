# Adagrad

Per-parameter adaptive learning rate that decreases as the cumulative squared gradient grows.

θ_i ← θ_i - η g_i / (√(Σ_t g_{i,t}²) + ε)

Sparse / infrequent features get larger updates. Aggressive decay (denominator only grows) means it eventually stops learning — fixed by [[rmsprop]] / [[adam]].

## Strengths
- Strong on **sparse features** (NLP bag-of-words, embedding tables) where some parameters see updates rarely
- No per-parameter LR tuning — the accumulator does it
- Convex convergence guarantees (Duchi, Hazan, Singer 2011)

## Weaknesses
- Monotonically shrinking step size halts learning on long deep-learning runs
- [[rmsprop]] and [[adam]] use exponential moving averages instead of cumulative sums to fix this

## See Also
- [[gradient-descent]], [[sgd]] — non-adaptive baselines
- [[rmsprop]] — Adagrad with EMA of squared gradients
- [[adam]] — RMSProp + momentum + bias correction
- [[../decisions/optimizer-choice]] — when adaptive optimizers win

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 5.5
- [[../summaries/understanding-deep-learning]] Ch. 6 (briefly)

## Tags
#adagrad #optimization #adaptive-lr
