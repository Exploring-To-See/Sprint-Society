# Understanding Deep Learning (Prince 2026 update)

A modern, principles-first deep learning textbook covering supervised, unsupervised, and RL with deep nets, including transformers, diffusion, and ethics.

## Identification
- **Author:** Simon J.D. Prince
- **Publisher:** MIT Press, December 2023; current draft updated 2026-02
- **License:** CC-BY-NC-ND
- **Source:** [[../entities/book-udl]]

## Structure (21 chapters)

1. **Introduction** — supervised, unsupervised, [[../concepts/reinforcement-learning]], ethics, structure
2. **Supervised Learning** — overview, linear regression example
3. **Shallow Neural Networks** — universal approximation, multivariate I/O, terminology
4. **Deep Neural Networks** — composition, depth, matrix notation, [[../decisions/depth-vs-width]]
5. **Loss Functions** — maximum likelihood derivation, regression, binary/multiclass classification, [[../concepts/cross-entropy-loss]]
6. **Fitting Models** — [[../components/gradient-descent]], [[../components/sgd]], [[../components/momentum]], [[../components/adam]], hyperparameters
7. **Gradients & Initialization** — [[../components/backpropagation]], parameter initialization, vanishing/exploding gradients
8. **Measuring Performance** — bias/variance, [[../concepts/double-descent]], hyperparameter selection
9. **Regularization** — explicit ([[../components/l2-regularization]], [[../components/dropout]]), implicit, [[../components/early-stopping]], [[../components/batch-normalization]]
10. **Convolutional Networks** — [[../components/cnn]], pooling, AlexNet/VGG/ResNet lineage
11. **Residual Networks** — [[../components/residual-connections]], ResNet, U-Net
12. **Transformers** — self-attention, [[../components/multi-head-attention]], [[../components/transformer-encoder-decoder]], BERT/GPT
13. **Graph Neural Networks** — [[../components/gnn]], message passing, attention on graphs
14. **Unsupervised Learning** — taxonomy of generative models
15. **Generative Adversarial Networks** ([[../components/gan]])
16. **Normalizing Flows** ([[../components/normalizing-flows]])
17. **Variational Autoencoders** ([[../components/variational-autoencoder]])
18. **Diffusion Models** ([[../components/diffusion-models]])
19. **Reinforcement Learning** with deep nets — DQN, policy gradient, AlphaGo
20. **Why Does Deep Learning Work?** — overparametrization, neural tangent kernel, lottery ticket
21. **Deep Learning and Ethics** (with Travis LaCroix) — dual-use, bias, environmental, autonomy

## Why It Matters
- Most accessible modern DL textbook (2026 update reflects latest research)
- Companion to [[probabilistic-ml-introduction]] (more probabilistic) and [[probabilistic-ml-advanced]] (more Bayesian)
- DL part of [[machine-learning-systems]] is engineering-focused; this book is the algorithm/theory side
- Pairs naturally with [[reinforcement-learning-introduction]] (Ch. 19 is a deep-net re-take of S&B)

## Tags
#deep-learning #neural-networks #transformers #cnn #generative-models #diffusion #prince #textbook

## Source
- Raw: `raw/UnderstandingDeepLearning_02_09_26_C.pdf` (md5: b7acf3962cc4038a91fecbaf08d127e0)
- Online: udlbook.com
