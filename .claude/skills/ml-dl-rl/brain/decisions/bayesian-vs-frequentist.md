# Decision: Bayesian vs Frequentist Inference

## Bayesian
- Parameters are random variables with priors
- Output: posterior distribution
- Pros: principled uncertainty, hierarchical modeling, calibrated predictions, natural [[../concepts/decision-theory]]
- Cons: prior choice can be subjective, often computationally expensive (MCMC)

## Frequentist
- Parameters are unknown but fixed; randomness is in the *data*
- Output: point estimate + confidence interval
- Pros: no prior to specify, asymptotically optimal procedures, well-understood guarantees
- Cons: harder to combine evidence; CIs are often misinterpreted as posterior intervals

## Practical Take
- For high-stakes prediction (medical, safety, sparse data) — Bayesian uncertainty matters
- For "fit a model on lots of data" — both give similar point predictions
- Modern ML is mostly *empirical Bayes / regularized MLE* — a hybrid

## See Also
- [[../concepts/bayesian-inference]] — the Bayesian side of the trade-off
- [[../concepts/maximum-likelihood-estimation]] — workhorse frequentist procedure
- [[../components/bayesian-neural-networks]] — Bayesian deep learning instantiation
- [[inference-method-choice]] — VI vs MCMC, the next decision down once Bayesian is chosen
- [[../concepts/decision-theory]] — Bayesian decisions integrate over the posterior

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 4 (full comparison)
- [[../summaries/probabilistic-ml-advanced]] Ch. 3

## Tags
#decisions #bayesian #frequentist #statistics
