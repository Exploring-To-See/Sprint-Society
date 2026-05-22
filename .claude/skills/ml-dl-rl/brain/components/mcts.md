# Monte Carlo Tree Search (MCTS)

Online planning algorithm that builds a search tree from the current state by repeated simulations:

1. **Selection** — descend the tree using UCT (UCB applied to trees)
2. **Expansion** — add a child node
3. **Simulation** — rollout to the end with a default policy
4. **Backup** — propagate value back up the tree

## Power
- The basis of [[alpha-go]], [[alpha-zero]], MuZero, AlphaStar
- Anytime: returns best action found so far at any time
- Doesn't need a value function (can use rollouts) but greatly improved by one

## See Also
- [[alpha-go]], [[alpha-go-zero]], [[alpha-zero]] — MCTS + deep nets case studies
- [[ucb]] — UCT uses UCB at every tree node
- [[../concepts/exploration-exploitation]] — UCT exemplifies the trade-off
- [[../concepts/model-based-rl]] — MCTS is the canonical model-based planner

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 8.11
- [[../summaries/algorithms-for-decision-making]] Ch. 9.6
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.8
- [[../summaries/algorithms-for-validation]] Ch. 5.4 (MCTS for falsification)

## Tags
#mcts #planning #tree-search #reinforcement-learning #deep-rl
