# Representation Learning

Learning useful features from data automatically rather than engineering them by hand.

## Forms
- **Self-supervised** — predict masked or future parts of input (BERT, GPT, SimCLR, masked autoencoders)
- **Autoencoders / [[../components/variational-autoencoder]]** — reconstruct from compressed code
- **Contrastive learning** — pull positives together, push negatives apart
- **Pretraining + fine-tuning** — a representation transfers across tasks
- **Disentangled representations** — independent factors of variation

## Why It Matters
- Drives modern foundation models (LLMs, vision foundation models)
- Enables few-shot, transfer, and multi-modal learning
- Replaces feature engineering at scale
- Connects to [[information-theory]] (InfoMax, MI maximization objectives)

## See Also
- [[foundation-models]] — representation learning at scale
- [[transfer-learning]] — what good representations enable
- [[../components/variational-autoencoder]] — classic latent-representation model
- [[../components/large-language-models]] — pretrained LLMs as universal representation learners
- [[../components/transformer]] — backbone of modern representation learning
- [[information-theory]] — InfoMax / mutual-information objectives
- [[double-descent]] — generalization phenomenon connected to overparameterized representations

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 19–20
- [[../summaries/probabilistic-ml-advanced]] Ch. 32 (representation learning), 28 (latent factor models)
- [[../summaries/understanding-deep-learning]] throughout (esp. Ch. 14 unsupervised, Ch. 12 transformers)

## Tags
#representation-learning #self-supervised #foundation-models
