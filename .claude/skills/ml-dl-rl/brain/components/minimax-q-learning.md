# Minimax-Q Learning

MARL Q-learning for two-player zero-sum games: at each update, the value of (s,a) is the minimax over the opponent's response.

Q(s,a) ← (1-α) Q(s,a) + α [r + γ minimax_a' Q(s', a')]

Converges to the Nash value of the underlying game. Foundation for [[../summaries/multi-agent-reinforcement-learning]] Ch. 6.

## See Also
- [[q-learning]] — single-agent base algorithm
- [[joint-action-learning]] — broader family minimax-Q sits inside
- [[../concepts/nash-equilibrium]] — equilibrium concept it converges toward
- [[../concepts/stochastic-games]] — the game-theoretic setting
- [[../concepts/agent-modeling]] — alternative way to handle opponents

## Tags
#minimax-q #marl #zero-sum
