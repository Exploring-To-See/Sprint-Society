# Fuzzing

Random / structured input generation to explore failure modes of a system. In [[../summaries/algorithms-for-validation]], used as a baseline falsification technique before more guided methods.

## Variants
- Black-box random
- Grammar-aware (generate inputs that conform to a schema)
- Coverage-guided (AFL, libFuzzer) — mutate to maximize new code paths
- Adversarial perturbation for ML models

## See Also
- [[../concepts/agent-models]] — what fuzzing exercises during validation
- [[../decisions/falsification-vs-verification]] — fuzzing is the falsification side
- [[mcts]] — guided search alternative for falsification (vs random)

## Where It's Covered
- [[../summaries/algorithms-for-validation]] Ch. 4.3

## Tags
#fuzzing #falsification #safety
