# Nash Equilibrium

A strategy profile where no agent can unilaterally improve their utility by deviating.

## Forms
- **Pure strategy NE** — each agent plays a deterministic action
- **Mixed strategy NE** — randomized; always exists in finite games (Nash 1950)
- **Subgame-perfect NE** — credible at every subgame (extensive-form)
- **Trembling-hand perfect** — robust to small mistakes
- **Correlated equilibrium** (Aumann) — generalization with a coordinator

## Computational Difficulty
- Computing a NE is PPAD-complete in general
- 2-player zero-sum NE = minimax = LP (poly time)
- Approximate NE via no-regret learning, fictitious play, PSRO

## Limitations
- May be multiple NEs (equilibrium selection problem)
- May be Pareto-suboptimal (Prisoner's Dilemma)
- Doesn't predict learning dynamics

## See Also
- [[stochastic-games]] — multi-agent extension of MDPs where NE applies per stage
- [[../components/no-regret-learning]] — converges to coarse correlated equilibria
- [[../components/minimax-q-learning]] — finds NE for 2-player zero-sum
- [[../components/policy-self-play]] — empirical NE-finding via population play
- [[agent-modeling]] — opponent modeling vs equilibrium reasoning

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 4 (full chapter on solution concepts)
- [[../summaries/decision-making-under-uncertainty]] Ch. 3.3
- [[../summaries/algorithms-for-decision-making]] (game theory in Ch. 24)

## Tags
#nash-equilibrium #game-theory #marl
