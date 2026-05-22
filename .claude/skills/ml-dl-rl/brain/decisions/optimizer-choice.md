# Decision: Which Optimizer for Deep Learning?

## Defaults That Just Work
- **[[../components/adam]]** (or AdamW) — Bayesian default for transformers, NLP, generative models
- **[[../components/sgd]] + [[../components/momentum]]** — often slightly better generalization on vision (ResNet, EfficientNet)
- **[[../components/lbfgs]]** — small problems, smooth losses

## Hyperparameter Sensitivity (rough)
- LR: most important, an order of magnitude wrong = no learning
- Weight decay: tune jointly with LR
- Batch size: affects effective LR; larger batch = larger LR (linear scaling rule with warmup)
- Schedule: cosine decay with warmup is the modern default for transformers

## Newer Choices
- **Lion** — sign-based, less memory; competitive on transformers
- **Sophia** — diagonal Hessian preconditioning, faster convergence
- **Adafactor** — memory efficient (factored 2nd moment), used for very large models

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 6
- [[../summaries/algorithms-for-optimization]] Ch. 5

## Tags
#decisions #optimization #deep-learning
