# Decision: Model-Based vs Model-Free RL

The classic RL trade-off: should the agent learn / use an explicit dynamics model, or learn the policy/value function directly?

## When Model-Based Wins
- **Sample efficiency matters** — robotics, healthcare, anything with expensive interaction
- **Reward changes** — model lets you re-plan; model-free has to relearn
- **Safety** — you can validate plans before executing
- **Multiple tasks** in the same environment — share the model

## When Model-Free Wins
- **Simulator is cheap** — Atari, board games, simulated control
- **Dynamics are very high-dim or hard to model** — pixels, raw text
- **Robust to model errors** — model-free has no model bias
- **Implementation simplicity** — DQN + experience replay is a few hundred lines

## Modern Compromise
- **Latent-space world models** (DreamerV3, [[../components/muzero]]) get sample efficiency without modeling raw pixels
- **Hybrid** algorithms (model-based rollouts as a critic) — see [[../components/actor-critic]]

## See Also
- [[../concepts/model-based-rl]] — model-based family details
- [[../concepts/model-free-rl]] — model-free family details
- [[../components/muzero]] — learned-dynamics model + MCTS, the modern model-based deep RL exemplar
- [[../components/dqn]], [[../components/ppo]], [[../components/sac]] — model-free representatives
- [[../components/mcts]] — canonical model-based planner

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 8 (Dyna)
- [[../summaries/algorithms-for-decision-making]] Ch. 16–17

## Tags
#decisions #reinforcement-learning #model-based #model-free
