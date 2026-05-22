# AlphaGo

DeepMind 2016: combined deep [[cnn]] policy + value networks (trained via supervised learning + RL self-play) with [[mcts]] to defeat top human Go players.

## Pipeline
1. SL policy network from human games
2. Fast rollout policy
3. RL policy network via self-play (REINFORCE)
4. Value network predicting game outcome
5. MCTS combines policy net (for selection) + value net (for evaluation) + rollouts

## Significance
- Reached superhuman Go play roughly a decade ahead of many expert predictions (informal expert sentiment around 2014–2015 — see commentary on Müller & Bostrom's 2014 AI-progress survey and the Grace et al. 2018 follow-up; precise pre-AlphaGo Go-specific estimates are anecdotal, treat the "decade" framing as approximate)
- First convincing demonstration that deep RL + search beats expert humans at long-horizon strategic games
- Inspired [[alpha-zero]], MuZero (model-based extension), and [[alpha-star]] lineage

## See Also
- [[mcts]] — search component
- [[cnn]] — policy/value network architecture
- [[policy-self-play]] — self-play training paradigm
- [[alpha-go-zero]], [[alpha-zero]] — successor without human data
- [[muzero]] — model-based extension that learns dynamics
- [[reinforce]] — policy-gradient method used for the RL self-play stage
- [[policy-gradient]] — broader family
- [[../concepts/imitation-learning]] — supervised bootstrapping from human games

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 16.6
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.8

## Tags
#alpha-go #deepmind #self-play #mcts #deep-rl
