# Structure Learning

Learning the *graph* of a probabilistic model — which variables depend on which — from data.

## Approaches
- **Score-based search** — define a Bayesian score (BIC, BDeu, MDL); search over DAGs (greedy, K2, hill climbing)
- **Constraint-based** — test conditional independencies (PC, FCI algorithms)
- **Markov equivalence classes** — multiple DAGs encode the same independencies; identify the equivalence class instead
- **Hybrid** approaches combine both

## Difficulties
- Number of DAGs is super-exponential in #variables
- With hidden / unmeasured variables, only Markov equivalence classes are identifiable
- Causal vs probabilistic structure are different — see [[causality]]

## Where It's Covered
- [[../summaries/algorithms-for-decision-making]] Ch. 5
- [[../summaries/decision-making-under-uncertainty]] Ch. 2.4

## Tags
#structure-learning #graphical-models #bayesian-networks
