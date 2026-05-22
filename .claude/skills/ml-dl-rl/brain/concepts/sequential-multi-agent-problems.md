# Sequential Multi-Agent Problems

Multi-stage decision problems with multiple agents — typically modeled as Dec-POMDPs (decentralized POMDPs).

## Dec-POMDP
⟨N, S, {A_i}, p, {O_i}, {Z_i}, r, γ⟩
- Each agent gets *partial* observations o_i
- Agents share a single team reward (cooperative)
- Each agent must act based on its local observation history
- NEXP-complete in general — much harder than POMDP

## Approximate Methods
- Centralized training, decentralized execution ([[../components/centralized-training-decentralized-execution]])
- [[../components/value-decomposition]] (VDN, QMIX)
- Memory-bounded dynamic programming
- Communication policies — when/what to share

## Where It's Covered
- [[../summaries/algorithms-for-decision-making]] Ch. 25–27
- [[../summaries/decision-making-under-uncertainty]] Ch. 6 + Ch. 11 (multi-UAS application)
- [[../summaries/multi-agent-reinforcement-learning]] (deep-RL approaches)

## Tags
#dec-pomdp #marl #cooperative #decision-making
