# AlphaGo Zero

DeepMind 2017: the Go-specific predecessor to [[alpha-zero]]. Same self-play framework, Go-only, dropped *all* human data — defeated the original [[alpha-go]] 100-0 starting from random weights.

## What It Established
- **Tabula rasa is enough** — no human games, no handcrafted features, no rollouts. Pure self-play [[mcts]] + a single residual net (policy + value heads)
- **MCTS as policy improvement** — the search produces an "improved policy" π̂ (visit counts) and an outcome z; the net is trained to match both
- **Single-network unification** — earlier [[alpha-go]] had separate SL policy, RL policy, value, and rollout networks; AlphaGo Zero collapses these into one

## Significance
- Decisive evidence that the human-game bootstrap in [[alpha-go]] was a crutch, not a requirement
- Set up the generalization to chess and shogi in [[alpha-zero]] (same algorithm, different game)
- Key step in the lineage: [[alpha-go]] → AlphaGo Zero → [[alpha-zero]] → [[muzero]]

## See Also
- [[alpha-zero]] — generalization to chess and shogi
- [[alpha-go]] — the human-bootstrapped predecessor
- [[muzero]] — successor that *also* learns the dynamics
- [[mcts]] — the planner in the loop
- [[policy-self-play]] — training paradigm
- [[../concepts/model-based-rl]] — AGZ uses a known game model; learning it is what MuZero adds

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 16.6.2

## Tags
#alpha-go-zero #self-play #mcts #deepmind #deep-rl
