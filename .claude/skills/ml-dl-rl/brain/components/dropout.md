# Dropout

Regularization that randomly zeros out activations during training (probability p, typically 0.1–0.5). At inference all activations are used (with appropriate scaling).

Theoretical interpretation: approximate Bayesian model averaging over an ensemble of subnets. Less commonly used in transformers (where layer norm + weight decay suffice) but standard in CNNs and MLPs.

## See Also
- [[l2-regularization]] — sibling regularizer; weight decay often suffices for transformers
- [[early-stopping]] — sibling regularizer; classic baseline
- [[bayesian-neural-networks]] — MC Dropout is an approximate BNN inference scheme
- [[batch-normalization]] — interacts with dropout (don't compose them naively)

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 9

## Tags
#dropout #regularization #deep-learning
