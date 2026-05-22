# Policy Self-Play

Train a policy by having it play against (current or past versions of) itself. Foundational for [[alpha-go]], [[alpha-zero]], [[alpha-star]].

## Variants
- **Naive self-play** — policy plays current policy
- **Fictitious self-play** — best response to opponent's *empirical* historical mixed strategy
- **PSRO** (Policy-Space Response Oracles) — generalization for general-sum games
- **League training** (AlphaStar) — main agents + exploiters + league exploiters

Risk: cycling / Nash gap when objective is general-sum.

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.8

## Tags
#self-play #marl #game-theory
