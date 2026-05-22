# Large Language Models (LLMs)

Decoder-only [[transformer]] models trained on large web-scale text corpora to predict the next token, then post-trained for instruction-following, helpfulness, and safety. The dominant interface for general-purpose AI in 2024+: GPT, Claude, Gemini, Llama.

## Architecture (the Common Stack)
- **Decoder-only [[transformer]]** with causal mask
- **[[multi-head-attention]]** with grouped-query attention (GQA) at inference for KV-cache efficiency
- **RoPE / ALiBi** positional encoding (sinusoidal/learned absolute is dated)
- **RMSNorm + SwiGLU** feed-forward (LLaMA family) — slightly better than LayerNorm + GeLU
- **Mixture-of-Experts (MoE)** in larger models (GPT-4, Mixtral, Gemini 1.5)

## Training Stages
1. **Pretraining** — next-token prediction on trillions of tokens; this is where capabilities emerge
2. **Supervised fine-tuning (SFT)** — instruction-following on curated data; uses [[../concepts/imitation-learning]]
3. **RLHF / RLAIF** — preference-tuned with [[ppo]] (or DPO/IPO/KTO) against a reward model fit to human preferences
4. **Constitutional / safety training** — Anthropic-style critique-and-revise with model-written feedback

## Scaling and Inference
- **Scaling laws** — loss ∝ compute^a · params^b · data^c (Kaplan, then Chinchilla); guides compute-optimal training
- **Speculative decoding**, **Medusa**, **EAGLE** — accelerate [[autoregressive-models]] generation
- **Quantization** ([[quantization]]), **distillation** ([[knowledge-distillation]]) — deployment-time compression
- **KV cache** management dominates inference memory at long context

## Capabilities and Failure Modes
- **In-context learning** — pattern-match few-shot examples without weight updates
- **Chain-of-thought / extended thinking** — explicit reasoning traces improve hard reasoning
- **Tool use** — function calling, code execution, retrieval (RAG)
- **Hallucination** — confidently wrong outputs, especially on rare facts
- **Jailbreaks**, prompt injection — current alignment is shallow

## Status (2026)
- Frontier models are multimodal (vision/audio/code/agentic); pure text is legacy framing
- Open-weights ecosystem (Llama, Qwen, DeepSeek) is competitive with frontier closed labs at smaller scales
- Reasoning models (o1, R1, Claude with extended thinking) trade more inference compute for deeper deliberation
- Agentic LLMs (computer use, long-horizon coding) are the active research frontier

## See Also
- [[transformer]] — architectural family
- [[autoregressive-models]] — generative paradigm
- [[rnn-sequences]] — pre-transformer language modeling (LSTMs); replaced by attention
- [[../concepts/foundation-models]] — broader concept LLMs instantiate
- [[../concepts/transfer-learning]] — pretraining-then-fine-tuning is the canonical pattern
- [[ppo]] — RLHF's RL stage
- [[../concepts/imitation-learning]] — SFT is behavioral cloning on instruction data
- [[multi-head-attention]] — core operator
- [[../concepts/representation-learning]] — pretrained LLMs are universal representation learners
- [[decision-transformer]] — same recipe applied to RL trajectories

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 22 (autoregressive generation)
- [[../summaries/understanding-deep-learning]] Ch. 12 (Transformers)
- [[../summaries/machine-learning-systems]] Ch. 4 (system implications)

## Tags
#llm #gpt #claude #transformer #autoregressive #foundation-model #foundation
