# Joint-Action Learning

MARL approach where the learner directly considers the joint action space. Includes minimax-Q (zero-sum), Nash-Q (general-sum), Friend-or-Foe Q. Scales poorly: |A|^N joint actions. Practical only for small N or with structured factorization.

See [[../summaries/multi-agent-reinforcement-learning]] Ch. 6.

## See Also
- [[minimax-q-learning]] — concrete instantiation for zero-sum two-player games
- [[value-decomposition]] — factorization that sidesteps the |A|^N blowup
- [[centralized-training-decentralized-execution]] — alternative MARL paradigm
- [[../concepts/stochastic-games]] — game-theoretic substrate
- [[../concepts/nash-equilibrium]] — solution concept for general-sum joint-action methods

## Tags
#joint-action #marl
