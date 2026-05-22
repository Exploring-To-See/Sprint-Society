# Information Theory

Quantitative measures of information, uncertainty, and divergence between distributions.

## Core Quantities
- **Entropy** H(X) = -Σ p(x) log p(x) — average uncertainty
- **Cross-entropy** H(p, q) = -Σ p(x) log q(x)
- **KL divergence** KL(p‖q) = H(p,q) - H(p) ≥ 0; asymmetric; the "cost" of using q to encode p
- **Mutual information** I(X;Y) = H(X) - H(X|Y) — how much knowing Y reduces uncertainty about X
- **Jensen-Shannon divergence** — symmetric, bounded
- **f-divergences**, **Wasserstein** distance — alternative families

## Why It Matters
- [[cross-entropy-loss]] is the standard classification loss
- KL is the variational objective in [[../components/variational-inference]] and [[../components/variational-autoencoder]]
- Mutual information drives feature selection, [[representation-learning]], and the InfoMax principle
- Source/channel coding: Shannon's noisy channel theorem bounds learnability

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 6
- [[../summaries/probabilistic-ml-advanced]] Ch. 5 (full treatment + divergences in Ch. 2.7)

## Tags
#information-theory #entropy #kl-divergence #foundation
