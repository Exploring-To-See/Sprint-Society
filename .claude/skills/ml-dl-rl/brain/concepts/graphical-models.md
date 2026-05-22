# Graphical Models

Probabilistic models whose conditional independence structure is captured by a graph.

## Two Main Families
- **Directed (Bayes nets)** — DAGs; arrows encode generative dependence; see [[bayesian-networks]]
- **Undirected (Markov random fields, factor graphs)** — energy-based factorization, no causal direction

## Why Useful
- Compact representation of high-dimensional distributions
- Explicit dependence structure → efficient inference algorithms
- Modular: can compose models and read off conditional independencies graphically (d-separation, Markov blanket)

## Inference Toolkit
- Exact: variable elimination, [[../components/message-passing]], junction tree
- Approximate: [[../components/variational-inference]], [[../components/mcmc]], [[../components/gibbs-sampling]], loopy BP

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 4 (canonical treatment)
- [[../summaries/algorithms-for-decision-making]] Ch. 2–5
- [[../summaries/decision-making-under-uncertainty]] Ch. 2

## Tags
#graphical-models #probability #inference #foundation
