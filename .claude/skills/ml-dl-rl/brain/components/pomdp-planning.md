# POMDP Planning

Planning when the agent has only partial observations. Maintain a *belief* b(s) — distribution over states — and plan over the (continuous) belief MDP.

## Methods
- **Exact**: alpha-vector representations, point-based value iteration over the value function
- **Offline approximate**: SARSOP, PERSEUS
- **Online**: POMCP (MCTS over beliefs), DESPOT, AEMS, branch-and-bound
- **Approximate function approximation**: deep RL on observation history (DRQN, R2D2)

## Why Hard
- Belief space is continuous even with finite states (a simplex)
- Curse of history (action-observation tree explodes)
- PSPACE-complete in general

## See Also
- [[../concepts/markov-decision-process]] — fully observed predecessor
- [[mcts]] — POMCP is MCTS in belief space
- [[../concepts/value-of-information]] — VOI motivates information-gathering actions
- [[sequential-monte-carlo]] — particle filters approximate the belief state
- [[gaussian-filtering]] — linear-Gaussian belief tracking
- [[../concepts/sequential-multi-agent-problems]] — Dec-POMDP is the multi-agent generalization
- [[../concepts/model-based-rl]] — POMDP planning is model-based

## Where It's Covered
- [[../summaries/algorithms-for-decision-making]] Ch. 19–22
- [[../summaries/decision-making-under-uncertainty]] Ch. 6
- [[../summaries/probabilistic-ml-advanced]] Ch. 34

## Tags
#pomdp #planning #partial-observability
