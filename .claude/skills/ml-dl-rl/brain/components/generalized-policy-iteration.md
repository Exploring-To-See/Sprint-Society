# Generalized Policy Iteration (GPI)

The Sutton/Barto framing: alternate (or interleave) [[policy-iteration|policy evaluation]] and policy improvement, where each step may be partial. Most RL algorithms are GPI flavors:

- [[policy-iteration]] — fully evaluate, then fully improve
- [[value-iteration]] — one Bellman backup is both eval + improvement
- [[temporal-difference-learning]] — incremental eval + ε-greedy improvement
- [[actor-critic]] — gradient eval (critic) + gradient improvement (actor)

## See Also
- [[policy-iteration]], [[value-iteration]] — the two corners GPI unifies
- [[../concepts/bellman-equation]], [[../concepts/bellman-optimality]] — what eval and improvement are solving
- [[temporal-difference-learning]], [[q-learning]], [[sarsa]] — incremental GPI instances
- [[actor-critic]] — function-approximation GPI

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 4.6

## Tags
#gpi #reinforcement-learning #framework
