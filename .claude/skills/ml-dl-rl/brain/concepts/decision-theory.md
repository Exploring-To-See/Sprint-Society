# Decision Theory

The framework for choosing actions to minimize loss / maximize utility under uncertainty.

## Core
Given a model p(state) and a loss function L(action, state), the optimal action minimizes the expected loss:
a* = argmin_a E[L(a, state)] = argmin_a ∫ L(a, s) p(s) ds.

## Key Ideas
- **Bayes risk** — minimum achievable expected loss
- **Loss functions** — 0-1 (classification accuracy), squared, absolute, log-loss, hinge, asymmetric
- **ROC / AUC** — trade off true positive vs false positive rate
- **Calibration** — predicted probabilities match empirical frequencies
- **Cost-sensitive** classification
- **A/B testing** as decision under uncertainty
- **[[utility-theory]]** — von Neumann–Morgenstern axioms

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 5 (Bayesian decision theory, frequentist, [[../components/multi-armed-bandits]])
- [[../summaries/probabilistic-ml-advanced]] Ch. 34 (decision making under uncertainty)
- [[../summaries/algorithms-for-decision-making]] Ch. 6 (simple decisions)
- [[../summaries/decision-making-under-uncertainty]] Ch. 3
- [[../summaries/fairness-and-machine-learning]] Ch. 3 (statistical fairness *is* group-conditional decision theory)

## Tags
#decision-theory #bayesian #loss-functions #foundation
