# Brain Index

Knowledge compiled from 11 textbooks covering machine learning, deep learning, reinforcement learning, decision making, optimization, validation, fairness, and ML systems.

See [[decisions/textbook-reading-order]] for a suggested path through the material.

## Summaries (one per source book)
- [[summaries/probabilistic-ml-introduction]] — Murphy 2022 (foundations through deep learning)
- [[summaries/probabilistic-ml-advanced]] — Murphy 2023 (advanced Bayesian, generative, RL)
- [[summaries/algorithms-for-decision-making]] — Kochenderfer/Wheeler/Wray 2022
- [[summaries/decision-making-under-uncertainty]] — Kochenderfer 2015 (theory + aviation cases)
- [[summaries/fairness-and-machine-learning]] — Barocas/Hardt/Narayanan 2023
- [[summaries/machine-learning-systems]] — Reddi 2026 (production ML)
- [[summaries/multi-agent-reinforcement-learning]] — Albrecht/Christianos/Schäfer 2024
- [[summaries/algorithms-for-optimization]] — Kochenderfer/Wheeler 2019
- [[summaries/reinforcement-learning-introduction]] — Sutton & Barto 2018/2020
- [[summaries/understanding-deep-learning]] — Prince 2026
- [[summaries/algorithms-for-validation]] — Kochenderfer/Katz/Corso/Moss 2026

## Concepts — cross-cutting ideas
**Foundations**
- [[concepts/probability-distributions]], [[concepts/bayesian-inference]], [[concepts/maximum-likelihood-estimation]]
- [[concepts/decision-theory]], [[concepts/utility-theory]], [[concepts/value-of-information]]
- [[concepts/information-theory]], [[concepts/cross-entropy-loss]], [[concepts/optimization]], [[concepts/contour-plots]]
- [[concepts/automatic-differentiation]], [[concepts/stochastic-gradient-descent]]

**Probabilistic structure**
- [[concepts/graphical-models]], [[concepts/bayesian-networks]]
- [[concepts/parameter-learning]], [[concepts/structure-learning]]
- [[concepts/probabilistic-programming]]
- [[concepts/representation-learning]], [[concepts/interpretability]], [[concepts/double-descent]]
- [[concepts/transfer-learning]], [[concepts/foundation-models]]

**Reinforcement learning**
- [[concepts/reinforcement-learning]], [[concepts/markov-decision-process]]
- [[concepts/policy]], [[concepts/value-function]]
- [[concepts/bellman-equation]], [[concepts/bellman-optimality]]
- [[concepts/exploration-exploitation]], [[concepts/exploring-starts]], [[concepts/importance-sampling]]
- [[concepts/model-based-rl]], [[concepts/model-free-rl]], [[concepts/imitation-learning]], [[concepts/options-framework]]

**Multi-agent**
- [[concepts/stochastic-games]], [[concepts/nash-equilibrium]], [[concepts/agent-modeling]]
- [[concepts/sequential-multi-agent-problems]]

**Fairness, validation, systems**
- [[concepts/causality]]
- [[concepts/independence-criterion]], [[concepts/separation-criterion]], [[concepts/sufficiency-criterion]]
- [[concepts/temporal-logic]], [[concepts/satisfiability]], [[concepts/agent-models]]
- [[concepts/data-labeling]], [[concepts/mlops]]

**Practice & methodology**
- [[concepts/active-learning]] — choosing what to label
- [[concepts/hyperparameter-tuning]] — choosing what to train

## Components — specific algorithms / architectures
**Optimization**
- [[components/gradient-descent]], [[components/sgd]], [[components/momentum]], [[components/adam]], [[components/adagrad]], [[components/rmsprop]]
- [[components/newtons-method]], [[components/bfgs]], [[components/lbfgs]], [[components/trust-region-methods]]
- [[components/nelder-mead]], [[components/simulated-annealing]], [[components/cross-entropy-method]]
- [[components/genetic-algorithms]], [[components/particle-swarm]], [[components/genetic-programming]], [[components/ant-colony-optimization]]
- [[components/bayesian-optimization]], [[components/gaussian-processes]], [[components/bayesian-monte-carlo]]

**Deep learning architectures**
- [[components/mlp-tabular]], [[components/cnn]], [[components/vit]], [[components/rnn-sequences]], [[components/gnn]]
- [[components/transformer]], [[components/transformer-encoder-decoder]], [[components/multi-head-attention]], [[components/residual-connections]]
- [[components/backpropagation]], [[components/dropout]], [[components/batch-normalization]], [[components/l2-regularization]], [[components/early-stopping]]
- [[components/large-language-models]] — modern decoder-only LLM stack

**Generative models**
- [[components/variational-autoencoder]], [[components/gan]], [[components/normalizing-flows]]
- [[components/diffusion-models]], [[components/autoregressive-models]], [[components/energy-based-models]]

**Bayesian inference**
- [[components/laplace-approximation]], [[components/variational-inference]]
- [[components/monte-carlo]], [[components/mcmc]], [[components/gibbs-sampling]]
- [[components/sequential-monte-carlo]], [[components/gaussian-filtering]], [[components/message-passing]]
- [[components/bayesian-neural-networks]]

**RL & decision making**
- [[components/policy-iteration]], [[components/value-iteration]], [[components/generalized-policy-iteration]]
- [[components/temporal-difference-learning]], [[components/q-learning]], [[components/sarsa]], [[components/double-q-learning]], [[components/experience-replay]]
- [[components/dqn]] — foundational deep RL algorithm
- [[components/policy-gradient]], [[components/reinforce]], [[components/actor-critic]], [[components/a2c-a3c]], [[components/ppo]], [[components/sac]], [[components/ddpg-td3]]
- [[components/multi-armed-bandits]], [[components/ucb]], [[components/thompson-sampling]]
- [[components/mcts]], [[components/decision-networks]], [[components/pomdp-planning]]
- [[components/alpha-go]], [[components/alpha-go-zero]], [[components/alpha-zero]], [[components/muzero]], [[components/alpha-star]]
- [[components/decision-transformer]] — RL-as-sequence-modeling

**Multi-agent RL**
- [[components/joint-action-learning]], [[components/minimax-q-learning]], [[components/no-regret-learning]]
- [[components/centralized-training-decentralized-execution]], [[components/value-decomposition]]
- [[components/multi-agent-policy-gradient]], [[components/parameter-sharing]], [[components/policy-self-play]]

**Validation**
- [[components/fuzzing]], [[components/multilevel-splitting]], [[components/neural-network-reachability]]

**ML systems**
- [[components/quantization]], [[components/pruning]], [[components/knowledge-distillation]]
- [[components/feature-store]], [[components/differential-privacy]], [[components/federated-learning]]

## Decisions — key trade-offs and choices
- [[decisions/textbook-reading-order]] — recommended path through these 11 books
- [[decisions/stanford-algorithms-trilogy]] — Kochenderfer's interlinked four-book series
- [[decisions/bayesian-vs-frequentist]] — inference paradigms
- [[decisions/inference-method-choice]] — VI vs MCMC
- [[decisions/generative-model-choice]] — VAE vs GAN vs diffusion vs flow vs autoregressive
- [[decisions/optimizer-choice]] — Adam vs SGD vs alternatives
- [[decisions/depth-vs-width]] — DL architecture
- [[decisions/model-based-vs-model-free-rl]]
- [[decisions/on-policy-vs-off-policy]]
- [[decisions/single-vs-multi-agent]]
- [[decisions/fairness-criteria-tradeoff]] — independence/separation/sufficiency impossibility
- [[decisions/falsification-vs-verification]]
- [[decisions/deployment-paradigm]] — Cloud / Edge / Mobile / TinyML

## Entities — books, authors, frameworks
**Books:** [[entities/book-pml1]], [[entities/book-pml2]], [[entities/book-dm]], [[entities/book-dmu]], [[entities/book-fairml]], [[entities/book-mlsys]], [[entities/book-marl]], [[entities/book-opt]], [[entities/book-rl-suttonbarto]], [[entities/book-udl]], [[entities/book-val]]

**Authors:** [[entities/author-kevin-murphy]], [[entities/author-mykel-kochenderfer]], [[entities/author-tim-wheeler]], [[entities/author-kyle-wray]], [[entities/author-sydney-katz]], [[entities/author-anthony-corso]], [[entities/author-robert-moss]], [[entities/author-richard-sutton]], [[entities/author-andrew-barto]], [[entities/author-simon-prince]], [[entities/author-stefano-albrecht]], [[entities/author-filippos-christianos]], [[entities/author-lukas-schafer]], [[entities/author-solon-barocas]], [[entities/author-moritz-hardt]], [[entities/author-arvind-narayanan]], [[entities/author-vijay-janapa-reddi]]

**Frameworks / benchmarks:** [[entities/pytorch]], [[entities/jax]], [[entities/atari-dqn]]

## Schema
Brain organization rules in `../schema.md`. Source PDFs in `../raw/`. Ingestion state in `../report/ingestion-history.json`.
