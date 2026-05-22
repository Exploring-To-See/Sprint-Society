# Transformer (Encoder–Decoder)

> **Scope:** This page covers the **canonical encoder-decoder architecture** from the 2017 "Attention Is All You Need" paper — building blocks, layouts, and architectural mechanics. For the broader conceptual family overview (why transformers won, where they show up beyond language), see [[transformer]].

The 2017 architecture (Vaswani et al., "Attention Is All You Need") that replaces recurrence and convolution with self-attention. Foundation of modern LLMs.

## Building Blocks
- **[[multi-head-attention]]** — query/key/value projections, scaled dot-product, parallel heads
- **Position encodings** (sinusoidal, learned, RoPE)
- **Feed-forward** layers between attention blocks
- **Layer norm + residual** at every sublayer
- **Causal mask** for autoregressive decoding

## Architecture Variants
- **Encoder-only** (BERT) — bidirectional, classification / encoding tasks
- **Decoder-only** (GPT) — autoregressive language modeling
- **Encoder-decoder** (T5, original transformer) — translation, summarization

## Why Dominant
- Highly parallel (no sequential dependency in attention)
- Scales: more data + parameters consistently improves
- Long-range dependencies: O(1) path between any pair of positions

## Variants for Long Context
- Sparse / sliding-window attention
- Linear attention, Performer, FlashAttention (compute-optimal exact)
- Mamba and other state-space alternatives

## See Also
- [[transformer]] — high-level family overview
- [[multi-head-attention]] — core operator
- [[autoregressive-models]] — decoder-only Transformers are autoregressive generative models
- [[backpropagation]] — how Transformer gradients are computed
- [[batch-normalization]] — LayerNorm (not BatchNorm) is the Transformer norm
- [[adam]] — AdamW is the Transformer optimizer
- [[residual-connections]] — every sublayer uses one

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 12 (full chapter)
- [[../summaries/probabilistic-ml-introduction]] Ch. 15 (sequences)

## Tags
#transformer #attention #deep-learning #foundation
