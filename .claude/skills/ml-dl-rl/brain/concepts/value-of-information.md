# Value of Information (VOI)

How much would you pay (in expected utility) to observe a hidden variable before deciding?

## Definition
VOI = E[max_a U(a, X)] - max_a E[U(a, X)]

i.e., the expected gain from acting *after* observing X versus deciding without it. Always ≥ 0.

## Uses
- Active learning — select samples that maximize VOI
- Sensor placement / surveillance — see [[../summaries/decision-making-under-uncertainty]] aviation cases
- Bayesian experimental design
- Clinical decision support — "is this test worth running?"

## See Also
- [[decision-theory]], [[utility-theory]] — VOI is a decision-theoretic quantity
- [[../components/decision-networks]] — VOI is computed naturally on influence diagrams
- [[../components/bayesian-optimization]] — entropy/MES acquisitions are VOI-style
- [[../components/pomdp-planning]] — VOI motivates information-gathering actions in POMDPs

## Where It's Covered
- [[../summaries/algorithms-for-decision-making]] Ch. 6.6
- [[../summaries/decision-making-under-uncertainty]] Ch. 3.2.2

## Tags
#voi #decision-theory #active-learning
