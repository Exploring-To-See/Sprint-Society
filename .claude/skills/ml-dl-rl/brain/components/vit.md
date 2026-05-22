# Vision Transformer (ViT)

Dosovitskiy et al. (2020): apply a [[transformer]] directly to image patches, treating each patch as a token. Showed that with enough pretraining data, a near-vanilla transformer matches or exceeds the best [[cnn]]s on ImageNet — overturning the assumption that the convolutional inductive bias was essential for vision.

## Architecture
- **Patchify** — split a H×W image into non-overlapping P×P patches (typically 16×16); flatten each to a vector
- **Linear embedding** — project each patch to the model dimension d
- **Position embedding** — learned (original ViT) or sinusoidal/RoPE (modern variants)
- **[CLS] token** — prepended for classification, similar to BERT
- **Stack of [[multi-head-attention]] + MLP blocks** with [[residual-connections]] and LayerNorm
- **Classification head** — MLP on the final [CLS] embedding (or pooled token mean)

## Variants and Successors
- **DeiT** — strong ViT training recipe with smaller datasets (JFT-300M not required)
- **Swin Transformer** — shifted-window attention, hierarchical resolution; reintroduces some locality
- **MAE / SimMIM / BEiT** — masked image modeling self-supervised pretraining
- **DINO / DINOv2** — self-distillation pretraining; produces strong general-purpose vision features without labels
- **CLIP** — image + text contrastive pretraining; ViT image encoder paired with text encoder

## Convergence with CNNs
- **ConvNeXt** (2022) showed that with modern training recipes, plain CNNs match ViT — much of ViT's edge was the training regime, not the architecture
- **Hybrid backbones** (Swin v2, MaxViT, EfficientFormer) blend conv and attention
- In practice, the prior debate has cooled: pretraining data + scale dominates the inductive bias question

## See Also
- [[transformer]] — base architecture family
- [[multi-head-attention]] — core operator
- [[cnn]] — predecessor paradigm; ConvNeXt is the modern conv counterpart
- [[../concepts/foundation-models]] — DINOv2 / CLIP are vision foundation models
- [[../concepts/representation-learning]] — what self-supervised ViTs learn
- [[residual-connections]], [[batch-normalization]] — standard transformer blocks

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 12 (Transformers — vision applications)
- [[../summaries/probabilistic-ml-advanced]] Ch. 22 (sequences over patches)

## Tags
#vit #vision-transformer #transformer #vision #deep-learning
