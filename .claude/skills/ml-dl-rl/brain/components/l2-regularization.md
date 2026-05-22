# L2 Regularization (Weight Decay)

Add λ‖θ‖² to the loss. Equivalent to a Gaussian prior on parameters in MAP estimation.

## In Modern DL
- **AdamW** decouples weight decay from the gradient update — preferred over Adam-with-L2 for transformers
- Typical λ: 1e-4 to 1e-1; tune as a hyperparameter
- Combined with [[dropout]], [[early-stopping]], and data augmentation

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 9
- [[../summaries/probabilistic-ml-introduction]] Ch. 4.5

## Tags
#regularization #l2 #weight-decay
