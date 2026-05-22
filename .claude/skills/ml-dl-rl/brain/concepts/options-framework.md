# Options Framework

Hierarchical RL extension where actions can be *temporally extended* — an option is a (policy, termination, initiation) triple.

## Definition
Option ω = ⟨I_ω, π_ω, β_ω⟩
- I_ω ⊆ S — initiation set
- π_ω — internal policy
- β_ω(s) — termination probability

The agent chooses options as macro-actions, each option runs to completion, then a higher-level policy chooses the next option.

## Why Useful
- Faster planning: search at the option level skips the primitive horizon
- Transfer: options learned in one task carry to another
- Exploration: options bias toward sustained behaviors (e.g., "go to the door")
- Cleaner credit assignment over long horizons

## See Also
- [[reinforcement-learning]] — base RL framework being extended
- [[markov-decision-process]] — options generalize the action space of an MDP into an SMDP
- [[policy]] — each option contains a policy
- [[../components/q-learning]] — option-level Q-learning is the standard control algorithm
- [[imitation-learning]] — common way to bootstrap option policies

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 17.2 (frontier chapter)

## Tags
#hierarchical-rl #options #reinforcement-learning
