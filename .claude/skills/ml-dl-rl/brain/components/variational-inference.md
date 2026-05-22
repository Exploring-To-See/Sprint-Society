# Variational Inference (VI)

Approximate the intractable posterior p(θ|D) by the closest tractable distribution q_φ(θ) — closest in KL.

Equivalent to maximizing the Evidence Lower Bound (ELBO):
log p(D) ≥ E_q[log p(D, θ)] - E_q[log q(θ)]

## Variants
- **Mean-field VI** — q factorizes across parameters (most restrictive)
- **Stochastic VI** (SVI) — minibatch ELBO updates, scales to large data
- **Black-box VI** — REINFORCE-style estimators
- **Reparametrization** — pathwise gradient (used in [[variational-autoencoder]])
- **Normalizing-flow VI** — q is a flow, much more expressive

## Trade-offs vs MCMC
- VI is faster but biased (under-estimates variance, mode-seeking)
- MCMC is asymptotically exact but slow

## See Also
- [[../concepts/bayesian-inference]] — underlying paradigm
- [[mcmc]] — sampling-based alternative; see [[../decisions/inference-method-choice]] for trade-offs
- [[laplace-approximation]] — simpler Gaussian-around-MAP approximation
- [[variational-autoencoder]] — amortized VI with a neural encoder
- [[normalizing-flows]] — flexible q-family for VI
- [[bayesian-neural-networks]] — VI is a primary BNN inference method
- [[../concepts/information-theory]] — KL divergence and ELBO are information-theoretic
- [[../decisions/inference-method-choice]] — VI vs MCMC vs Laplace decision

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 10

## Tags
#variational-inference #bayesian #elbo
