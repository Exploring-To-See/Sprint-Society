# Neural Network Reachability

Compute (over- or under-approximations of) the output set of a neural network for a given input set — used to verify safety properties of NN-controlled systems.

## Methods
- Interval bound propagation (IBP) — fast, loose
- CROWN, α-β-CROWN — tighter linear-relaxation bounds
- MIP / SAT encoding — exact but exponential
- Reluplex / Marabou — SMT-based exact verification

## See Also
- [[../concepts/satisfiability]] — SAT/SMT backend for exact NN verification
- [[../concepts/agent-models]] — the surrounding system the NN policy plugs into
- [[../decisions/falsification-vs-verification]] — reachability is on the verification side

## Where It's Covered
- [[../summaries/algorithms-for-validation]] Ch. 9.7

## Tags
#nn-reachability #verification #safety #neural-networks
