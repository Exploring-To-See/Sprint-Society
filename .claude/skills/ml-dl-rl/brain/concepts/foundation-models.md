# Foundation Models

Large models pretrained at scale on broad data that serve as the **base** for many downstream tasks via [[transfer-learning]]. The term (Bommasani et al. 2021, Stanford CRFM) names the pattern that emerged with BERT/GPT/CLIP: one expensive pretrain, many cheap adaptations.

## Defining Features
- **Scale** — billions to trillions of parameters, trillions of tokens
- **Generality** — a single model serves many downstream tasks (sometimes with no parameter update)
- **Emergence** — capabilities (in-context learning, chain-of-thought) appear above scale thresholds; not present in smaller siblings
- **Centralization** — trained by a small number of organizations with the compute and data to do so

## Modalities
- **Language** — GPT, Claude, Gemini, Llama; see [[../components/large-language-models]]
- **Vision** — CLIP, DINOv2, SAM, ViT
- **Multimodal** — GPT-4o, Gemini, Claude (vision + text + audio + sometimes video)
- **Code** — CodeLlama, StarCoder, Codex
- **Domain-specific** — AlphaFold (proteins), ESM, Med-PaLM, Voyage

## Why They Matter
- **Sample efficiency downstream** — adaptation needs orders of magnitude less data than from-scratch training
- **One model, many uses** — flips the economics of ML deployment
- **Capability frontier moves with compute** — predictable scaling laws guide investment
- **Concentration risk** — few labs control the base of widely-used downstream systems (regulatory and fairness implications — see [[../summaries/fairness-and-machine-learning]])

## Adaptation Patterns (in order of cost)
1. **Prompting / in-context learning** — no weight changes
2. **PEFT** (LoRA, prefix tuning, adapters) — train < 1% of parameters
3. **Full fine-tuning** — all weights, small LR
4. **Continued pretraining** — domain-shifted base before fine-tune

See [[transfer-learning]] for details on each.

## Open Problems
- **Alignment and safety** — RLHF / Constitutional AI are shallow; jailbreaks remain
- **Hallucination** — even frontier models confidently fabricate
- **Evaluation** — broad benchmarks game easily; saturation hides gaps
- **Costs** — training compute and inference compute both growing fast
- **Data sourcing** — copyright, consent, web exhaustion (synthetic data, self-training)

## See Also
- [[../components/large-language-models]] — the language modality
- [[transfer-learning]] — the adaptation paradigm foundation models enable
- [[representation-learning]] — what pretraining objectives optimize
- [[../components/transformer]] — dominant architectural family
- [[../components/autoregressive-models]] — dominant generative paradigm for text/code
- [[../components/diffusion-models]] — dominant generative paradigm for images / video
- [[mlops]] — deployment patterns for serving foundation models

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 12 (transformers as foundation)
- [[../summaries/probabilistic-ml-advanced]] Ch. 22 (foundation generative models)
- [[../summaries/machine-learning-systems]] Ch. 4, 8, 17 (architectures, training, responsible AI)

## Tags
#foundation-models #pretraining #scaling #llm #foundation
