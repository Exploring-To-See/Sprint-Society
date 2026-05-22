# Residual Connections

Skip connections that add the input to the output of a block: y = F(x) + x.

## Why It Matters
- Solves vanishing gradients in very deep nets — gradient flows directly through identity
- Enables ResNet (152 layers) and modern transformers (typically 12–96+ residual blocks)
- Each block can learn a residual *correction* over the identity, easier than learning the full mapping

## Variants
- Pre-norm vs post-norm placement (LayerNorm before vs after residual)
- Highway networks (gated residuals)
- DenseNet (concat instead of add)

## See Also
- [[cnn]] — ResNet popularized residuals
- [[transformer]], [[transformer-encoder-decoder]] — every sublayer wraps a residual
- [[batch-normalization]] — paired with residuals in modern blocks
- [[backpropagation]] — residuals are an explicit gradient-flow fix

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 11

## Tags
#residual #resnet #deep-learning
