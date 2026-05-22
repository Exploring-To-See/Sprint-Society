# Decision: Depth vs Width in Neural Networks

Universal approximation says one hidden layer is enough — in theory. In practice deeper is dramatically more parameter-efficient.

## Why Depth Helps
- Compositional features: each layer reuses representations from below
- Exponential expressivity for functions with hierarchical structure
- Cheaper to express common operations (e.g., parity)

## Why Width Helps
- Overparametrization → smoother loss landscape → easier optimization
- "Lottery tickets" → sparse subnets that train well
- Empirically: scaling laws favor wider models for large LLMs

## Modern Verdict
- For vision: ResNets and ViTs are deep AND wide
- For LLMs: width scales with depth (Chinchilla-style scaling laws)
- Below 10 layers usually too shallow; above 1000 hits diminishing returns without specialized arch

## See Also
- [[../components/residual-connections]] — what makes very deep networks trainable
- [[../components/cnn]], [[../components/transformer]] — architectures where depth/width is tuned
- [[../concepts/double-descent]] — generalization phenomenon tied to width
- [[../components/batch-normalization]] — depth-enabling normalization technique

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 4.5

## Tags
#decisions #deep-learning #architecture
