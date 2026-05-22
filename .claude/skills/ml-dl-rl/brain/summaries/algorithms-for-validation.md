# Algorithms for Validation (Kochenderfer, Katz, Corso, Moss 2026)

The newest book in the Stanford algorithms series — how to validate that an autonomous system meets safety and behavioral requirements.

## Identification
- **Authors:** Mykel J. Kochenderfer, Sydney M. Katz, Anthony L. Corso, Robert J. Moss (Stanford SISL)
- **Publisher:** MIT Press, 2026
- **License:** CC-BY-NC-ND (typical for the series)
- **Source:** [[../entities/book-val]]

## Structure (12+ chapters)

1. **Introduction** — validation as a discipline, history, societal consequences (safety, fairness), challenges
2. **System Modeling** — model building, parameter learning, [[../concepts/agent-models]], model validation
3. **Property Specification** — properties, metrics, composite metrics, logical specs, [[../concepts/temporal-logic]] (LTL/STL/MTL), reachability specs
4. **Falsification through Optimization** — direct sampling, [[../components/fuzzing]], optimization for falsification, objective functions
5. **Falsification through Planning** — shooting methods, tree search, heuristic search, [[../components/mcts]], RL-based falsification
6. **Failure Distribution** — distribution over failures, rejection sampling, [[../components/mcmc]], [[../concepts/probabilistic-programming]]
7. **Failure Probability Estimation** — direct estimation, [[../components/importance-sampling]], adaptive IS, sequential MC, ratio of normalizing constants, [[../components/multilevel-splitting]]
8. **Reachability for Linear Systems** — forward reachability, set propagation, set representations (zonotopes, polytopes), LP
9. **Reachability for Nonlinear Systems** — interval arithmetic, inclusion functions, Taylor models, optimization-based, partitioning, [[../components/neural-network-reachability]]
10. **Reachability for Discrete Systems** — graph formulation, reachable sets, [[../concepts/satisfiability]] (SAT/SMT), probabilistic reachability, abstraction
11. **Explainability** — interpretability for safety-critical AI
12. **Runtime Monitoring** — monitoring during operation

## Why It Matters
- Newest (2026) and unique focus: *not* how to build the system but how to verify it's safe before deployment
- Complements [[algorithms-for-decision-making]] and [[algorithms-for-optimization]] in the Stanford trilogy → now a quartet
- Crosswalks to [[machine-learning-systems]] Ch. 16 (Robust AI) — that book is engineering-systems oriented; this is algorithm/theory of validation
- Critical for safety-critical autonomy (aviation, autonomous driving) — extends [[decision-making-under-uncertainty]]'s aviation case studies

## Tags
#validation #safety #verification #falsification #reachability #safety-critical #autonomous-systems #kochenderfer #stanford #textbook

## Source
- Raw: `raw/val.pdf` (md5: a32b3c1d927a81671044166c476b1566)
- Online: algorithmsbook.com/validation
