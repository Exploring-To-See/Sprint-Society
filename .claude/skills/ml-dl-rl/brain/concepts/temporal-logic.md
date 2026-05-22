# Temporal Logic

Formal languages for specifying *when* properties must hold over time — used to express system requirements precisely enough to verify.

## Variants
- **LTL** (Linear Temporal Logic) — operators G (always), F (eventually), X (next), U (until). Example: "G(request → F response)"
- **CTL** (Computation Tree Logic) — branching time, ∀/∃ over execution paths
- **STL** (Signal Temporal Logic) — over real-valued signals, supports robustness *degree* (how strongly satisfied/violated)
- **MTL** (Metric Temporal Logic) — temporal operators with bounded time intervals
- **PSL**, μ-calculus — more expressive but harder to use

## Use in Validation
- Encode safety requirements ("the car never crashes") and liveness ("the agent eventually reaches the goal")
- STL robustness gives a *signed real number* you can falsify with optimization → see [[../summaries/algorithms-for-validation]] Ch. 4

## See Also
- [[satisfiability]] — SAT/SMT backend for model checking
- [[agent-models]] — closed-loop systems whose properties get specified
- [[../decisions/falsification-vs-verification]] — what temporal-logic specifications get checked against
- [[../components/neural-network-reachability]] — reachability uses temporal-logic safety specs
- [[../components/fuzzing]] — falsification typically targets STL robustness

## Where It's Covered
- [[../summaries/algorithms-for-validation]] Ch. 3.5 (temporal logic chapter)

## Tags
#temporal-logic #ltl #stl #verification #safety
