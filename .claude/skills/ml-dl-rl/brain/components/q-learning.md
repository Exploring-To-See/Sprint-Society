# Q-Learning

Off-policy [[temporal-difference-learning]] for control:

Q(s,a) ← Q(s,a) + α [r + γ max_{a'} Q(s',a') - Q(s,a)]

The max in the target makes it *off-policy* — learns Q* regardless of the behavior policy used to gather data (as long as it explores).

## Convergence
Tabular Q-learning converges to Q* with probability 1 under appropriate step-size and exploration conditions.

## Extensions
- [[double-q-learning]] — corrects max-bias
- [[dqn]] — neural Q-function with experience replay + target network
- **Rainbow** — combines DQN improvements

## See Also
- [[temporal-difference-learning]] — TD(0) underlying update mechanism
- [[sarsa]] — on-policy sibling (uses next-action sample, not max)
- [[dqn]] — deep Q-learning realization
- [[double-q-learning]] — overestimation fix
- [[experience-replay]] — what makes deep Q-learning tractable
- [[../concepts/value-function]], [[../concepts/bellman-optimality]] — what Q-learning approximates
- [[../concepts/model-free-rl]] — RL family Q-learning belongs to
- [[../decisions/on-policy-vs-off-policy]] — Q-learning is canonically off-policy

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 6.5
- [[../summaries/algorithms-for-decision-making]] Ch. 17

## Tags
#q-learning #td-learning #off-policy #reinforcement-learning #foundation
