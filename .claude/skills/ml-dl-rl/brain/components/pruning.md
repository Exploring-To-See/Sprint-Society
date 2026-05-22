# Pruning

Remove weights or whole structures from a trained model. Trades a small accuracy hit for big memory/latency wins.

## Variants
- **Unstructured** — zero out individual weights (need sparse kernels to realize speedup)
- **Structured** — drop whole filters, channels, attention heads, layers (always speeds up)
- **Magnitude-based** — drop smallest |w|
- **Lottery ticket hypothesis** — sparse subnetworks trainable from a fortunate init
- **Iterative magnitude pruning** with rewind

## See Also
- [[quantization]] — orthogonal compression axis (often combined with pruning)
- [[knowledge-distillation]] — alternative compression strategy (smaller student model)
- [[../decisions/deployment-paradigm]] — pruning is decisive for Edge / TinyML targets

## Where It's Covered
- [[../summaries/machine-learning-systems]] Ch. 10

## Tags
#pruning #efficiency #ml-systems
