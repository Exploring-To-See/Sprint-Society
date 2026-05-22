# Early Stopping

Stop training when validation loss stops improving (patience = N epochs without improvement).

Free regularization: never overfit to the training set, no extra hyperparameter pressure beyond patience. The classic baseline against which other regularizers are measured.

## See Also
- [[dropout]] — sibling regularizer
- [[l2-regularization]] — sibling regularizer; equivalence to early stopping for linear models is a classic result
- [[../concepts/double-descent]] — generalization phenomenon early stopping interacts with
- [[sgd]] — pairs naturally with stochastic optimization

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 9
- [[../summaries/probabilistic-ml-introduction]] Ch. 4.5

## Tags
#early-stopping #regularization
