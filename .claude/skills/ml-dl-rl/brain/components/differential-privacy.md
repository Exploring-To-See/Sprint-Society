# Differential Privacy (DP)

A formal guarantee that a model's output distribution doesn't change much whether or not any single individual is in the training set. Adds carefully calibrated noise (Laplace, Gaussian) to gradients, queries, or outputs.

## Mechanisms
- DP-SGD — clip per-example gradients, add Gaussian noise
- Output perturbation
- Subsampling amplifies privacy
- Rényi DP and zCDP for tighter composition

Trade-off: more privacy → more noise → less accuracy.

## See Also
- [[federated-learning]] — DP is the standard privacy primitive paired with FL
- [[sgd]] — DP-SGD is its privacy-preserving variant
- [[../concepts/mlops]] — DP is a deployment-time concern in production ML
- [[../summaries/fairness-and-machine-learning]] — privacy and fairness frequently trade off

## Where It's Covered
- [[../summaries/machine-learning-systems]] Ch. 15

## Tags
#differential-privacy #privacy #ml-systems
