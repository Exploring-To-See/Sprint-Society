# Decision: Falsification vs Formal Verification

For safety-critical AI systems, two complementary approaches:

## Formal Verification
- Prove the system *cannot* fail under specified assumptions
- Tools: theorem proving, model checking, [[../components/neural-network-reachability]]
- Strong guarantee but: scales poorly, requires precise specs, often abstracts the messy real world

## Falsification
- Search for inputs that cause failure (without proving safety)
- Tools: [[../components/fuzzing]], optimization-driven adversarial search, [[../components/mcts]] for trajectories
- No guarantee, but: scales to complex models, finds real bugs, useful even when verification is infeasible

## Practical Combination
- Falsify first to find obvious bugs cheaply
- Verify the cleaned-up system on simplified abstractions
- Use [[../components/importance-sampling]] / [[../components/multilevel-splitting]] to estimate failure probabilities for rare events
- Runtime monitoring to catch what slipped through

## Where It's Covered
- [[../summaries/algorithms-for-validation]] (the entire book)

## Tags
#decisions #validation #safety #verification #falsification
