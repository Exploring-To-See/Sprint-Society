# Transfer Learning

Reuse a model trained on one task or distribution to bootstrap learning on another. The default pattern in modern deep learning: pretrain on a large generic corpus, then adapt.

## Forms
- **Feature extraction** — freeze the backbone, train only a new head on the target task
- **Fine-tuning** — continue training the entire model with a small learning rate on target data
- **Parameter-efficient fine-tuning (PEFT)** — adapt small rank-decomposed adapters (LoRA, IA³, prefix-tuning) instead of all weights; standard for [[../components/large-language-models]]
- **Prompt / in-context learning** — no weight updates, just choose the right inputs (frontier-LLM-only regime)
- **Domain adaptation** — handle covariate shift between source and target distributions
- **Multi-task / meta-learning** — train so transfer is fast (MAML, Reptile, prompt-tuning)

## Why It Works
- Lower layers learn general features (edges, n-gram statistics, syntax) that transfer across tasks
- Pretraining loss is a good proxy for many downstream losses (representation hypothesis)
- Pretraining-then-adapt avoids overfitting on small target datasets

## When It Fails
- Source and target distributions are too different (negative transfer)
- Catastrophic forgetting during continued training
- Pretrained features encode source biases (fairness pitfalls — see [[../summaries/fairness-and-machine-learning]])

## Practical Patterns
- **Pretrain → SFT → RLHF** — the [[../components/large-language-models]] recipe
- **ImageNet → fine-tune** — long-standing CV default (largely replaced by self-supervised + ViT pretraining)
- **LoRA / QLoRA** — parameter-efficient adaptation of frozen LLMs (4-bit quantized base, low-rank trainable update)

## See Also
- [[representation-learning]] — what the source pretraining produces
- [[foundation-models]] — large pretrained models that transfer is built on
- [[../components/large-language-models]] — canonical modern transfer pipeline
- [[../components/knowledge-distillation]] — alternative reuse pattern (compress, not adapt)
- [[../components/dropout]], [[../components/l2-regularization]] — regularizers that help small-data fine-tuning

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 9, 12 (regularization, transfer)
- [[../summaries/probabilistic-ml-introduction]] Ch. 19 (transfer learning chapter)
- [[../summaries/machine-learning-systems]] Ch. 8 (efficient training, fine-tuning at scale)

## Tags
#transfer-learning #fine-tuning #pretraining #peft #foundation
