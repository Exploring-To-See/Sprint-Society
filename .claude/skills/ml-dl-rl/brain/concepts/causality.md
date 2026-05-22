# Causality

Reasoning about *interventions* and counterfactuals, not just observed correlations.

## Pearl's Causal Hierarchy
1. **Association** — p(Y|X), the rung correlation lives on
2. **Intervention** — p(Y | do(X)), what happens if you set X
3. **Counterfactuals** — p(Y_x | X', Y'), what *would* have happened

## Tools
- **Causal graphs (DAGs)** with the do-operator
- **Confounding, mediators, colliders** — graphical structure reveals when adjustment is needed
- **Backdoor / frontdoor criteria** for valid adjustment sets
- **Instrumental variables** for unobserved confounding
- **Structural causal models** (SCMs) — full counterfactual machinery
- **Potential outcomes** (Rubin) framework — equivalent under assumptions

## Why It Matters in ML
- Distinguishes prediction from intervention (recommender system fairness)
- Required for fairness counterfactuals — see [[../summaries/fairness-and-machine-learning]] Ch. 5
- Domain shift / transfer can be reframed causally
- Treatment effect estimation, A/B test interpretation

## See Also
- [[bayesian-networks]] — causal DAGs are Bayesian networks with intervention semantics
- [[graphical-models]] — broader family of structured probability
- [[independence-criterion]], [[separation-criterion]], [[sufficiency-criterion]] — fairness criteria touched by causal reasoning
- [[interpretability]] — counterfactual explanations are causal
- [[../decisions/fairness-criteria-tradeoff]] — causal framing relevant to the impossibility result

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 36
- [[../summaries/fairness-and-machine-learning]] Ch. 5 (causal discrimination analysis)

## Tags
#causality #pearl #counterfactual #fairness
