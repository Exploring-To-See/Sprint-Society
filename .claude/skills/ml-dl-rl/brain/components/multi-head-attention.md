# Multi-Head Attention

The core operation of [[transformer-encoder-decoder]]: each "head" performs scaled dot-product attention; outputs are concatenated and linearly projected.

Attention(Q, K, V) = softmax(QKᵀ / √d_k) V

Multiple heads (typically 8–96) attend to different subspaces in parallel. Self-attention: Q=K=V from the same sequence. Cross-attention: Q from decoder, K/V from encoder.

## Variants
- Causal (masked) self-attention for autoregressive
- FlashAttention — IO-aware exact computation that fits in SRAM
- Sparse, sliding-window, and ring attention for long context
- Grouped-query attention (GQA) reduces KV cache for inference

## See Also
- [[transformer]] — high-level family overview MHA is the core of
- [[transformer-encoder-decoder]] — full architecture using MHA
- [[autoregressive-models]] — causal MHA powers decoder-only LMs
- [[batch-normalization]] — LayerNorm is the normalization paired with MHA
- [[residual-connections]] — wrap each MHA sublayer
- [[cnn]] — Vision Transformer (ViT) replaces conv with MHA over patches

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 12

## Tags
#attention #transformer #deep-learning
