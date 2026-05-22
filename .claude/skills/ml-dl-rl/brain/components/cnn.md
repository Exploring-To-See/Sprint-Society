# Convolutional Neural Network (CNN)

Neural network with weight-sharing convolutional layers — exploits spatial locality and translation equivariance, dominant for images.

## Building Blocks
- **Convolutional layer** — small learnable filters slid across input
- **Pooling** (max, avg) — downsample, build hierarchy
- **Stride / padding** — control spatial resolution
- **Skip connections** ([[residual-connections]]) — enable very deep nets

## Landmark Architectures
- **LeNet** (1998) — digit recognition
- **AlexNet** (2012) — ImageNet breakthrough
- **VGG** (2014) — depth via tiny 3×3 convs
- **GoogLeNet / Inception** (2014) — multi-scale modules
- **ResNet** (2015) — residual connections, 152+ layers
- **EfficientNet** — scaling depth/width/resolution jointly
- **U-Net** — encoder-decoder for segmentation
- **Vision Transformer (ViT)** (2020) — replaces convs with [[multi-head-attention]]
- **ConvNeXt** (2022) — modernized convnet that matches or beats ViT under matched training recipes; demonstrates that the gap was largely about training, not the conv prior
- **DINOv2 / hybrid backbones** (2023+) — self-supervised vision foundation models, often hybrid CNN/Transformer; CNN and Transformer paradigms have converged in practice

## See Also
- [[backpropagation]] — how convnet gradients are computed
- [[batch-normalization]] — standard component in modern CNNs
- [[residual-connections]] — enabling block for deep networks (ResNet)
- [[vit]] — Vision Transformer, the modern attention-based competitor
- [[transformer-encoder-decoder]], [[multi-head-attention]] — ViT's underlying architecture

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 14
- [[../summaries/understanding-deep-learning]] Ch. 10–11
- [[../summaries/machine-learning-systems]] Ch. 4.3 (system implications)

## Tags
#cnn #deep-learning #vision #foundation
