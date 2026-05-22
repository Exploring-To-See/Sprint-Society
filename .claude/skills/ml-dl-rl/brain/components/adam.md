# Adam Optimizer

Adaptive moment estimation. Maintains exponential moving averages of gradient (1st moment) and squared gradient (2nd moment), then divides one by the square root of the other.

## Update
m_t = β₁ m_{t-1} + (1-β₁) g_t
v_t = β₂ v_{t-1} + (1-β₂) g_t²
m̂_t = m_t / (1-β₁^t),  v̂_t = v_t / (1-β₂^t)
θ ← θ - η m̂_t / (√v̂_t + ε)

## Defaults
β₁=0.9, β₂=0.999, ε=1e-8

## When to Use
- Deep learning default; works on transformers, CNNs, RNNs
- AdamW (decoupled weight decay) is preferred over Adam-with-L2 for transformers, and is the standard for modern vision training as well
- The historical "SGD+momentum generalizes better for vision" claim is recipe-dependent — with cosine schedules, warmup, and tuned weight decay, AdamW matches or beats SGD on ImageNet in many 2023+ papers

## Variants
- **AdamW** — decoupled weight decay (modern default)
- **Adafactor** — memory efficient (factored 2nd moment)
- **Lion** — sign-based momentum

## See Also
- [[sgd]], [[../concepts/stochastic-gradient-descent]] — first-order baseline / variance comparison
- [[momentum]] — Adam's first moment is essentially momentum
- [[rmsprop]], [[adagrad]] — Adam's adaptive scaling lineage
- [[../decisions/optimizer-choice]] — when to pick Adam vs SGD vs alternatives

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 6.4
- [[../summaries/algorithms-for-optimization]] Ch. 5.8

## Tags
#adam #optimization #deep-learning
