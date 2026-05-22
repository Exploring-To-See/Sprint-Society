# Batch Normalization

Normalizes activations within a minibatch to zero mean / unit variance per channel, then learns scale/shift. Speeds training and provides implicit regularization.

## Variants
- **LayerNorm** — across features per sample (transformers default)
- **GroupNorm** — middle ground (small batch settings)
- **InstanceNorm** — per-sample, per-channel (style transfer)
- **RMSNorm** — drop the mean, just normalize RMS (LLM standard)

## See Also
- [[cnn]] — BatchNorm is a CNN staple; later replaced by GroupNorm in some recipes
- [[transformer]], [[transformer-encoder-decoder]] — LayerNorm / RMSNorm here
- [[residual-connections]] — typically composed: norm → linear → residual
- [[dropout]], [[l2-regularization]] — alternative regularizers (BN is partial substitute)

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 9

## Tags
#batch-norm #normalization #deep-learning
