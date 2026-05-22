# Transformer (Architecture Overview)

> **Scope:** This page is the **conceptual family overview** — what makes something a transformer, the three sibling layouts, why it won, and where it shows up beyond language. For a deeper architectural treatment of the canonical encoder-decoder design (the original 2017 paper), see [[transformer-encoder-decoder]].

The architecture family introduced by Vaswani et al. (2017) that replaces recurrence and convolution with self-attention. Three sibling layouts share the same building blocks but differ in masking and information flow.

## What Makes a Transformer
- **Self-attention** as the primary mixing operator — every token attends to every other (within its mask)
- **[[multi-head-attention]]** for parallel relational queries
- **Position encodings** (sinusoidal, learned, RoPE, ALiBi) since attention is permutation-equivariant
- **Layer norm + residual** at every sublayer (pre-norm is now standard)
- **Feed-forward MLP** between attention blocks (typically 4× hidden width)

## Architecture Layouts
- **Encoder-only** (BERT) — bidirectional attention, masked-LM pretraining; classification, retrieval, encoding
- **Decoder-only** (GPT, Llama, Claude) — causal mask, next-token prediction; modern LLM default
- **Encoder-decoder** (T5, original transformer) — encoder reads, decoder generates with cross-attention; translation, summarization

For the canonical encoder-decoder design and full architectural detail, see [[transformer-encoder-decoder]].

## Why It Won
- **Highly parallel** (no sequential dependency within a layer) — exploits accelerator FLOPs
- **Scales predictably** — performance is a smooth function of params × data × compute
- **Long-range mixing** — O(1) path between any pair of tokens (vs. O(n) for RNN, O(log n) for hierarchical conv)

## Modern Long-Context Variants
- **FlashAttention** — exact attention, IO-aware; standard kernel
- **Sparse / sliding-window attention** — Longformer, BigBird
- **Linear attention** — Performer, RWKV, Linear Transformers
- **State-space alternatives** — Mamba, Mamba-2 (subquadratic, often competitive)
- **Mixture-of-experts** (MoE) — sparse activation across experts per token

## Beyond Language
- [[vit|Vision Transformer (ViT)]] — patches as tokens
- Decision Transformer — RL trajectories as sequences
- Speech (Whisper), code (Codex), proteins (AlphaFold), multimodal (Gemini, GPT-4o)

## See Also
- [[transformer-encoder-decoder]] — detailed encoder-decoder treatment
- [[multi-head-attention]] — core operator
- [[../components/autoregressive-models]] — decoder-only generation paradigm
- [[rnn-sequences]] — the historical predecessor for sequence modeling, displaced for most NLP
- [[large-language-models]] — the dominant transformer application
- [[decision-transformer]] — RL-as-sequence-modeling extension
- [[batch-normalization]] — LayerNorm (a sibling) is the transformer norm of choice
- [[adam]] — AdamW is the standard transformer optimizer

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 12 (full chapter)
- [[../summaries/probabilistic-ml-introduction]] Ch. 15 (sequences)
- [[../summaries/machine-learning-systems]] Ch. 4 (system implications)

## Tags
#transformer #attention #deep-learning #foundation
