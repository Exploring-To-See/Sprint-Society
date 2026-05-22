# Atari DQN Benchmark

The Atari 2600 games from the Arcade Learning Environment (ALE) — a foundational deep RL benchmark.

## Snapshot
- **Origin:** ALE (Bellemare et al. 2013); Mnih et al. (DeepMind) Nature 2015 paper showing human-level Atari play with a single architecture
- **Architecture:** [[../components/cnn]] processing 4 stacked frames → [[../components/q-learning]] target → discrete action output
- **Innovation:** Experience replay + target network = stable deep Q-learning

## See Also
- [[../components/dqn]] — the algorithm this benchmark popularized
- [[../components/experience-replay]] — replay buffer that made DQN tractable
- [[../components/q-learning]] — base algorithm DQN extends
- [[../components/double-q-learning]] — overestimation fix used in Double DQN

## Brain Refs
- [[../summaries/reinforcement-learning-introduction]] Ch. 16.5 (Human-level Video Game Play)
- [[../summaries/understanding-deep-learning]] Ch. 19 covers DQN
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 8 covers DQN as a building block

## Tags
#benchmark #atari #dqn #deepmind #reinforcement-learning
