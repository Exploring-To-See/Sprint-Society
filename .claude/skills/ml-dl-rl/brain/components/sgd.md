# Stochastic Gradient Descent (SGD)

> **Disambiguation:** This page is the **algorithmic implementation** (pseudocode, hyperparameters, practical defaults). For the concept (why it works, theoretical properties, variants), see [[../concepts/stochastic-gradient-descent]].

## Pseudocode
```
for epoch in 1..E:
    shuffle(data)
    for batch in minibatches(data):
        g ← ∇L(θ, batch) / |batch|
        θ ← θ - η * g
```

## Hyperparameters
- **Learning rate η** — most important; too big diverges, too small crawls
- **Batch size** — small = more noise (regularizes) but slower wall-clock; large = stable, less regularizing
- **LR schedule** — step decay, cosine, warmup-then-decay; LR warmup helps with large batch
- **Momentum β** — typically 0.9

## In Practice
- [[adam]] is the default for most DL; SGD+momentum is common for vision (gap has narrowed with modern recipes — see notes on adam.md)
- Mixed precision (fp16/bf16) is standard
- See [[momentum]] for the most common SGD enhancement

## See Also
- [[gradient-descent]] — non-stochastic precursor
- [[momentum]], [[adam]], [[adagrad]], [[rmsprop]] — common variants
- [[../concepts/stochastic-gradient-descent]] — theoretical concept

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 6.2
- [[../summaries/probabilistic-ml-introduction]] Ch. 8

## Tags
#sgd #optimization #deep-learning
