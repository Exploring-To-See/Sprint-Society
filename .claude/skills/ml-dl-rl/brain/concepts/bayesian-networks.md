# Bayesian Networks

Directed acyclic graphs whose nodes are random variables and edges encode conditional dependence.

## Definition
Joint distribution factorizes as p(X) = ∏_i p(X_i | parents(X_i)). Reading off conditional independencies via d-separation.

## Tasks
- **Inference** — compute p(X_query | X_evidence): exact (variable elimination, junction tree, [[../components/message-passing]]) or approximate ([[../components/gibbs-sampling]], [[../components/variational-inference]], MCMC)
- **[[parameter-learning]]** — fit CPTs from data (MLE, Bayesian, EM if hidden)
- **[[structure-learning]]** — learn the graph itself (search + score, constraint-based)

## Variants
- **Naive Bayes** — single class parent, conditional features
- **Hidden Markov Model** — temporal Bayes net
- **Dynamic Bayesian Network** — Bayes net unrolled over time
- **Bayesian network for utility / decision** = [[../components/decision-networks]]
- **Markov Random Field** — undirected counterpart
- **[[graphical-models]]** is the umbrella term

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 4 (full chapter)
- [[../summaries/algorithms-for-decision-making]] Ch. 2–5
- [[../summaries/decision-making-under-uncertainty]] Ch. 2

## Tags
#bayesian-networks #graphical-models #probability #inference
