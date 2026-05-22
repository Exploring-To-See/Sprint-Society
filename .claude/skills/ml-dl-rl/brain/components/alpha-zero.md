# AlphaZero

DeepMind 2018: generalization of [[alpha-go-zero]] to chess and shogi. Starts from random weights, learns purely from [[policy-self-play|self-play]]. Single neural net (policy + value heads) + [[mcts]]. Mastered Go, chess, and shogi from scratch with the same algorithm.

Trains via: MCTS-improved policy as the supervised target, game outcome as the value target. Loop: net → MCTS → improved net.

## Why It Matters
- **One algorithm, three games** — same code, different game rules. The strongest evidence to date that deep RL + search is a *general* recipe for perfect-information turn-taking games
- **Beat Stockfish (chess) and Elmo (shogi)** with no domain knowledge beyond rules and basic input encoding
- **Cleaner, simpler than [[alpha-go]]** — no SL pre-training, no rollout policy, no domain-specific features

## Algorithm Sketch
1. Self-play games using the current net to guide [[mcts]] (policy net biases selection; value net evaluates leaves; visit counts pick moves)
2. Store (state, MCTS visit distribution, game outcome) tuples
3. Train net to (a) match the MCTS visit distribution and (b) predict the game outcome
4. Replace old net with new net; repeat

## Limitations
- Requires a perfect simulator of game dynamics (the rules) — [[muzero]] removes this assumption
- Discrete, deterministic, perfect-information games — does not directly apply to imperfect-information games like StarCraft (see [[alpha-star]])

## Lineage
- [[alpha-go]] → [[alpha-go-zero]] → AlphaZero → [[muzero]] → [[alpha-star]] (different game class)

## See Also
- [[alpha-go-zero]] — Go-specific predecessor
- [[alpha-go]] — original, human-bootstrapped
- [[muzero]] — extension that *learns* the dynamics model
- [[mcts]] — search component
- [[policy-self-play]] — training paradigm
- [[../concepts/model-based-rl]] — uses a known game model

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.8.3
- [[../summaries/reinforcement-learning-introduction]] Ch. 16.6.2

## Tags
#alpha-zero #self-play #mcts #deepmind #deep-rl
