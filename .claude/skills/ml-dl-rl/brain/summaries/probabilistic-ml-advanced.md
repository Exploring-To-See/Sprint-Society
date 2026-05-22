# Probabilistic Machine Learning: Advanced Topics (Murphy 2023)

The 1200-page advanced companion to Murphy's introduction, covering modern Bayesian inference, generative models, and decision-theoretic action.

## Identification
- **Author:** Kevin P. Murphy (Google Research)
- **Publisher:** MIT Press, 2023
- **License:** CC-BY-NC-ND
- **Series:** Adaptive Computation and Machine Learning
- **Source:** [[../entities/book-pml2]]

## Structure

### Part I — Fundamentals (Ch. 2–6)
- Probability: divergence measures, exponential family, [[../concepts/graphical-models]]
- Statistics: [[../concepts/bayesian-inference]] (frequentist, conjugate priors, hierarchical, empirical Bayes), model selection
- Information theory, [[../concepts/optimization]] (constrained, stochastic, proximal)

### Part II — Inference (Ch. 7–13)
- [[../components/gaussian-filtering]] (Kalman filters, smoothers)
- [[../components/message-passing]] / belief propagation
- [[../components/variational-inference]]
- [[../components/monte-carlo]] / [[../components/mcmc]] / [[../components/sequential-monte-carlo]]
- [[../concepts/probabilistic-programming]] — language-level abstraction over inference

### Part III — Prediction (Ch. 14–19)
- Generalized linear models, deep neural networks
- [[../components/bayesian-neural-networks]]
- [[../components/gaussian-processes]]
- Beyond i.i.d.: time series, transfer, domain adaptation

### Part IV — Generation (Ch. 20–26)
- [[../components/variational-autoencoder]]
- [[../components/autoregressive-models]]
- [[../components/normalizing-flows]]
- [[../components/energy-based-models]]
- [[../components/diffusion-models]]
- [[../components/gan]]

### Part V — Discovery (Ch. 27–33)
- Latent factor models (PCA, ICA, NMF)
- State-space models, graph learning
- Bayesian nonparametrics, [[../concepts/representation-learning]]
- [[../concepts/interpretability]]

### Part VI — Action (Ch. 34–36)
- [[../concepts/decision-theory]] under uncertainty (bandits, BO, active learning)
- [[../concepts/reinforcement-learning]]
- [[../concepts/causality]]

## Why It Matters
- The most extensive single-volume reference for modern Bayesian/probabilistic ML
- Pairs with [[probabilistic-ml-introduction]] (vol. 1)
- Generative-models part overlaps with [[understanding-deep-learning]] but goes deeper into Bayesian framing

## Tags
#machine-learning #bayesian #generative-models #inference #variational #mcmc #murphy #textbook #advanced

## Source
- Raw: `raw/book2.pdf` (md5: 4b75dd3408260acb0542dd5f29e634dd)
- Online: probml.github.io/pml-book/book2.html
