# Cross-Entropy Loss

The standard loss for classification — equivalently, negative log-likelihood under a categorical (or Bernoulli) likelihood.

## Forms
- **Binary:** L = -[y log p + (1-y) log(1-p)]
- **Multiclass:** L = -Σ_c y_c log p_c (one-hot label, softmax output)

Equivalent to KL(p_data || p_model) up to a data-independent constant.

## Why Standard
- Probabilistic interpretation: matches MLE for the categorical likelihood
- Convex w.r.t. logits before the softmax (well-behaved for SGD)
- Pairs naturally with softmax / sigmoid output activations

## Pitfalls
- Class imbalance: vanilla CE under-fits minority classes — fix with weighting, focal loss, or resampling
- Label smoothing: targets become (1-ε)·y + ε/K — improves calibration, reduces over-confidence

## See Also
- [[information-theory]] — KL divergence, entropy underpin CE
- [[maximum-likelihood-estimation]] — CE = NLL of the categorical likelihood
- [[probability-distributions]] — categorical / Bernoulli families
- [[../components/sgd]], [[../components/adam]] — what minimizes CE in practice

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 5
- [[../summaries/probabilistic-ml-introduction]] Ch. 4 (under MLE), 10 (logistic regression)

## Tags
#loss-functions #cross-entropy #classification #foundation
