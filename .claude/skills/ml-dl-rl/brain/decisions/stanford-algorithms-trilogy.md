# Decision: The Stanford SISL Algorithms Series

The Kochenderfer-led "Algorithms for X" books form a coherent body of work that should be read together — not standalone.

## The Books
1. [[../entities/book-opt]] — Algorithms for Optimization (2019)
2. [[../entities/book-dm]] — Algorithms for Decision Making (2022)
3. [[../entities/book-val]] — Algorithms for Validation (2026)

Plus the predecessor [[../entities/book-dmu]] — Decision Making Under Uncertainty (2015).

## Why They Belong Together
- **Same notation, same Julia code style** — algorithms are immediately portable across books
- **Sequential dependencies**: optimization is the engine inside decision-making (LP for MDPs, BO for hyperparameters); decision making feeds validation (you need to model the system before falsifying it)
- **Aviation / autonomous-systems case studies** thread through: TCAS → ACAS X → autonomous driving → drone swarms

## When to Use Which
- Building a planner / RL agent → start with [[../summaries/algorithms-for-decision-making]]
- Tuning hyperparameters / engineering objective → [[../summaries/algorithms-for-optimization]]
- Verifying safety of a deployed agent → [[../summaries/algorithms-for-validation]]
- Real-world aviation case study depth → [[../summaries/decision-making-under-uncertainty]]

## Tags
#decisions #stanford #sisl #kochenderfer #textbook
