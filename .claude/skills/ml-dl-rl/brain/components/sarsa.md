# SARSA

On-policy [[temporal-difference-learning]] for control. Update uses the *actually taken* next action a':

Q(s,a) ← Q(s,a) + α [r + γ Q(s',a') - Q(s,a)]

(s, a, r, s', a') gives the name. With ε-greedy improvement → ε-soft optimal policy.

Differs from [[q-learning]] (off-policy) in safety: SARSA accounts for the exploration the actual policy uses (e.g., cliff walking).

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 6.4

## Tags
#sarsa #td-learning #on-policy #reinforcement-learning
