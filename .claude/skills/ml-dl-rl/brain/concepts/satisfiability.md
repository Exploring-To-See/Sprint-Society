# Satisfiability (SAT / SMT)

Decision problems for logical formulas: is there a variable assignment that makes the formula true?

- **SAT** — Boolean satisfiability (NP-complete)
- **SMT** — SAT modulo theories (linear arithmetic, bitvectors, arrays); used for program verification, BMC

## Why Useful
- Encode reachability of discrete systems as a SAT/SMT query
- Bounded model checking unrolls transitions for K steps and checks whether the bad state is reachable
- Solvers: Z3, MiniSat, Yices

## See Also
- [[temporal-logic]] — what gets compiled to SAT/SMT for verification
- [[../components/neural-network-reachability]] — Reluplex/Marabou are SMT-based NN verifiers
- [[../decisions/falsification-vs-verification]] — SAT/SMT is on the verification side

## Where It's Covered
- [[../summaries/algorithms-for-validation]] Ch. 10.3 (SAT for discrete-system reachability)

## Tags
#sat #smt #verification #discrete
