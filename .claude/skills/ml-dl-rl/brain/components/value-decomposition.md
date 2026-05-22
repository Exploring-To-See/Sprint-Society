# Value Decomposition (MARL)

Decompose the joint action-value Q_tot(s, a₁,…,a_n) into per-agent terms Q_i(s, a_i). At execution, each agent picks argmax over its own Q_i.

## Algorithms
- **VDN** — sum: Q_tot = Σ Q_i (linear)
- **QMIX** — monotonic mixing network with non-negative weights
- **QTRAN, QPLEX, MAVEN** — relax monotonicity for richer joint Q
- **Weighted QMIX** — handle non-monotonic games

## Why Useful
- Satisfies the **Individual-Global-Max (IGM) property**: per-agent argmax = joint argmax
- Decentralized execution from a centralized-trained critic
- Standard for cooperative MARL (StarCraft Multi-Agent Challenge)

## See Also
- [[centralized-training-decentralized-execution]] — paradigm value-decomposition lives inside
- [[joint-action-learning]] — the alternative this avoids the |A|^N blowup of
- [[q-learning]] — single-agent base algorithm
- [[parameter-sharing]] — frequently combined trick for homogeneous agents
- [[../concepts/sequential-multi-agent-problems]] — the Dec-POMDP setting

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.5

## Tags
#value-decomposition #marl #cooperative #vdn #qmix
