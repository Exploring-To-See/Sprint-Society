# Double Descent

Surprisingly, test error in heavily over-parametrized models can *decrease again* as model size grows past the interpolation threshold.

## The Curve
Classic U: error ↓ (underfit → fit), then ↑ (fit → overfit). Modern empirical observation: keep growing past interpolation, error ↓ *again*.

## Why It Happens (current understanding)
- Implicit regularization of [[../components/sgd]] biases toward smooth solutions
- Over-parametrized regime makes the loss surface easier to traverse
- Lottery-ticket / neural-tangent-kernel theory provides partial explanations

## Implications
- "Bigger model + more data" is often the right move, contrary to classical statistical wisdom
- Cross-validation curves can be misleading near the interpolation threshold

## See Also
- [[../components/sgd]] — implicit regularizer driving the second descent
- [[representation-learning]], [[../decisions/depth-vs-width]] — companion architecture-side decisions
- [[../components/l2-regularization]], [[../components/dropout]] — explicit regularization that interacts with the curve

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 8.4 (the dedicated section)
- Mentioned briefly across Murphy's [[../summaries/probabilistic-ml-introduction]]/[[../summaries/probabilistic-ml-advanced]]

## Tags
#double-descent #generalization #deep-learning
