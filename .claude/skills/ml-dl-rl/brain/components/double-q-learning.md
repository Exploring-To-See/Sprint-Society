# Double Q-Learning

Maintain two Q estimates Q₁ and Q₂; in each update use one to *select* the next action and the other to *evaluate* its value. Cuts the systematic max-bias of standard [[q-learning]].

In deep RL: Double DQN uses online net to select, target net to evaluate.

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 6.7

## Tags
#double-q-learning #td-learning #bias-correction
