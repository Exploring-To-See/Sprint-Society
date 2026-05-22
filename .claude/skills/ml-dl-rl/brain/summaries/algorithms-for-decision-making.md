# Algorithms for Decision Making (Kochenderfer, Wheeler, Wray 2022)

A 700-page computational treatment of decision making, from Bayesian networks through MDPs and POMDPs to multi-agent systems, with Julia code.

## Identification
- **Authors:** Mykel J. Kochenderfer, Tim A. Wheeler, Kyle H. Wray (Stanford)
- **Publisher:** MIT Press, 2022
- **License:** CC-BY-NC-ND
- **Source:** [[../entities/book-dm]]

## Structure

### Part I — Probabilistic Reasoning (Ch. 2–6)
- Representation: probability distributions, [[../concepts/bayesian-networks]], conditional independence
- Inference: variable elimination, belief propagation, sampling (direct, likelihood-weighted, [[../components/gibbs-sampling]])
- [[../concepts/parameter-learning]] (MLE, Bayesian, nonparametric, missing-data)
- [[../concepts/structure-learning]] (Bayesian scoring, graph search, Markov equivalence)
- Simple decisions: [[../concepts/utility-theory]], [[../components/decision-networks]], [[../concepts/value-of-information]]

### Part II — Sequential Problems (Ch. 7–13)
- Exact MDP methods: [[../components/policy-iteration]], [[../components/value-iteration]], LP formulation
- Approximate value functions (parametric, kNN, kernel, linear, NN regression)
- Online planning: rollouts, forward search, branch-and-bound, sparse sampling, [[../components/mcts]]
- Policy search, policy gradient (estimation + optimization), [[../components/actor-critic]]
- Policy validation

### Part III — Model Uncertainty (Ch. 15–18)
- [[../concepts/exploration-exploitation]] (bandits, Thompson sampling, UCB)
- [[../concepts/model-based-rl]] vs [[../concepts/model-free-rl]]
- [[../concepts/imitation-learning]] (behavioral cloning, DAgger, IRL)

### Part IV — State Uncertainty (Ch. 19–23)
- Beliefs and belief MDPs (POMDPs)
- [[../components/pomdp-planning]]: exact, offline, online belief-state planning
- Controller abstractions (FSCs, alpha-vector pruning)

### Part V — Multiagent Systems (Ch. 24–27)
- Multi-agent reasoning, [[../concepts/sequential-multi-agent-problems]]
- State uncertainty in multi-agent settings
- Collaborative agents (Dec-POMDP)

## Why It Matters
- Algorithms-first companion to the more theoretical [[decision-making-under-uncertainty]] (2015)
- Heavy overlap with [[reinforcement-learning-introduction]] but more decision-theoretic, less ML-flavored
- Same author backbone as [[algorithms-for-optimization]] and [[algorithms-for-validation]] — the "Stanford algorithms trilogy"

## Tags
#decision-making #mdp #pomdp #planning #reinforcement-learning #bayesian-networks #julia #kochenderfer #textbook

## Source
- Raw: `raw/dm.pdf` (md5: d928c88cb69f0ab1a143036c54e94340)
- Online: algorithmsbook.com/decisionmaking
