# Stochastic Gradient Descent

> **Disambiguation:** This page covers the **concept** (why SGD works, theoretical properties). For the practical algorithmic implementation (pseudocode, hyperparameters, defaults), see [[../components/sgd]].

Optimize an objective that's an average over data by sampling minibatches and stepping along the empirical gradient.

θ_{t+1} = θ_t - η ∇L̂(θ_t)

where L̂ is computed on a minibatch.

## Why It Works
- Cheap per step; many steps per epoch
- Gradient noise has implicit regularizing effect — biases toward flat minima
- Combined with momentum and adaptive scaling ([[../components/adam]]) → workhorse of deep learning
- Convergence under standard step-size schedules (Robbins-Monro)

## Variants
- **Minibatch SGD** — most common
- **[[../components/momentum]] / Nesterov**
- **Adagrad / RMSProp / [[../components/adam]] / AdamW**
- **Hypergradient descent** — adapt the LR online
- **Distributed SGD** — sync (allreduce) or async (Hogwild)

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 8 (foundations)
- [[../summaries/probabilistic-ml-advanced]] Ch. 6 (deep treatment)
- [[../summaries/understanding-deep-learning]] Ch. 6
- [[../summaries/reinforcement-learning-introduction]] Ch. 9.3 (semi-gradient methods in RL)
- [[../summaries/algorithms-for-optimization]] Ch. 5

## Tags
#sgd #optimization #foundation
