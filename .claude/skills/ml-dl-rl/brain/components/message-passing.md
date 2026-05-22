# Message Passing / Belief Propagation

Inference in tree-structured graphical models by exchanging "messages" along edges. Each node sends a message that summarizes evidence from its subtree.

## Algorithms
- **Sum-product** — marginal probabilities
- **Max-product** — MAP configuration
- **Junction tree** — exact inference on arbitrary graphs (after triangulation, can be expensive)
- **Loopy BP** — apply BP on graphs with cycles; not exact but often good
- **Expectation propagation** (EP) — generalization

## See Also
- [[../concepts/graphical-models]], [[../concepts/bayesian-networks]] — what message passing operates on
- [[gnn]] — modern neural networks built on the message-passing primitive
- [[gibbs-sampling]] — sampling-based alternative for the same problem class

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 9
- [[../summaries/algorithms-for-decision-making]] Ch. 3.4

## Tags
#message-passing #belief-propagation #inference #graphical-models
