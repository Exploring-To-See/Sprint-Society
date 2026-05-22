# AlphaStar

DeepMind 2019: grandmaster-level StarCraft II from raw screen, using [[../concepts/imitation-learning]] + multi-agent [[policy-self-play]] with **Population-Based Training** and the league concept (main agents + exploiters + league exploiters).

Demonstrated MARL at scale on a real-time strategy game with imperfect information and huge action spaces.

## Pipeline
- Bootstrap from human replays via supervised imitation
- Self-play in a league: main agents try to win; exploiters search for weaknesses; league exploiters maintain diversity
- Population-Based Training (PBT) tunes hyperparameters online
- Architecture: Transformer + LSTM + pointer net for huge structured action space

## See Also
- [[policy-self-play]] — core MARL training paradigm
- [[../concepts/imitation-learning]] — bootstrapping from human play
- [[alpha-go]], [[alpha-zero]] — predecessor lineage
- [[transformer]] — architecture used for the structured action space
- [[rnn-sequences]] — LSTM in the AlphaStar stack handles temporal state
- [[multi-agent-policy-gradient]] — underlying RL family
- [[../concepts/hyperparameter-tuning]] — Population-Based Training is the AlphaStar tuner

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.9.3

## Tags
#alpha-star #marl #self-play #starcraft #deepmind #reinforcement-learning #deep-rl
