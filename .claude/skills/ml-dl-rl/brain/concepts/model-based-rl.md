# Model-Based Reinforcement Learning

RL where the agent learns or uses an explicit model of the environment dynamics p(s'|s,a) and reward r(s,a).

## How It Works
1. Collect interaction data
2. Fit / improve the model
3. Plan or learn from simulated rollouts of the model
4. Act, repeat

Typical planners: [[../components/value-iteration]], [[../components/mcts]], dynamic programming, trajectory optimization.

## Trade-offs vs [[model-free-rl]]
**Pros:** sample efficient, can re-plan when reward changes, useful for safety (validate plans)
**Cons:** model errors compound; planning compute can be expensive; learning a good model is hard

See [[../decisions/model-based-vs-model-free-rl]].

## Algorithms
- Dyna (Sutton) — interleave planning + learning
- [[../components/muzero]], World Models, DreamerV3 — modern deep model-based
- PILCO — Gaussian process dynamics

## See Also
- [[model-free-rl]] — counterpart paradigm
- [[../decisions/model-based-vs-model-free-rl]] — when to choose which
- [[../components/mcts]] — canonical model-based planner
- [[../components/value-iteration]], [[../components/policy-iteration]] — classical planners
- [[../components/muzero]] — frontier latent-model agent
- [[reinforcement-learning]] — broader RL framework

## Where It's Covered
- [[../summaries/algorithms-for-decision-making]] Ch. 16
- [[../summaries/reinforcement-learning-introduction]] Ch. 8 (Dyna, planning + learning)

## Tags
#model-based-rl #reinforcement-learning #planning
