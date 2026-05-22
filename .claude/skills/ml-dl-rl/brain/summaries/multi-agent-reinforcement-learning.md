# Multi-Agent Reinforcement Learning: Foundations and Modern Approaches (Albrecht, Christianos, Schäfer 2024)

The first complete textbook on MARL — combines game theory with deep RL to handle multiple agents learning simultaneously.

## Identification
- **Authors:** Stefano V. Albrecht, Filippos Christianos, Lukas Schäfer (University of Edinburgh)
- **Publisher:** MIT Press, 2024
- **License:** CC-BY-NC-ND
- **Source:** [[../entities/book-marl]]

## Structure (12 chapters)

### Part I — Foundations
1. **Introduction** — multi-agent systems, MARL motivation, applications (warehouse robotics, board games, autonomous driving, trading), challenges, agendas
2. **Reinforcement Learning** — MDPs, [[../concepts/bellman-equation]], dynamic programming, [[../components/temporal-difference-learning]]
3. **Games: Models of Multi-Agent Interaction** — normal-form, repeated, [[../concepts/stochastic-games]], partial observability, agent communication
4. **Solution Concepts for Games** — [[../concepts/nash-equilibrium]], correlated equilibrium, minimax, Pareto optimality, social welfare
5. **MARL First Steps** — convergence types, equilibrium selection, non-stationarity, scalability challenges
6. **Foundational MARL Algorithms** — joint-action learning ([[../components/minimax-q-learning]], Nash-Q, [[../components/joint-action-learning]]), [[../concepts/agent-modeling]], [[../components/no-regret-learning]]

### Part II — Multi-Agent Deep RL
7. **Deep Learning** — function approximation, feedforward / convolutional / recurrent networks for RL
8. **Deep RL** — DQN, double DQN, prioritized replay, dueling, [[../components/policy-gradient]], A2C, PPO
9. **Multi-Agent Deep RL** — independent learning, [[../components/centralized-training-decentralized-execution]] (CTDE), centralized critics, [[../components/value-decomposition]] (VDN, QMIX), [[../components/multi-agent-policy-gradient]] (MADDPG, COMA), [[../components/parameter-sharing]], [[../components/policy-self-play]] ([[../components/alpha-zero]], [[../components/alpha-star]]), policy-space response oracles
10. **MARL in Practice** — agent-environment interface, PyTorch implementation, hyperparameter search, learning curves
11. **Multi-Agent Environments** — gridworld, SMAC, MPE, Hanabi, OpenSpiel
12. Conclusions

## Why It Matters
- The defining textbook for MARL — endorsed by Sutton/Barto/Littman/Stone/Kochenderfer/Tuyls
- Builds *on* [[reinforcement-learning-introduction]] (single-agent) — not a replacement
- Multi-agent material in [[algorithms-for-decision-making]] (Ch. 24–27, Dec-POMDP) is more decision-theoretic; this is the deep-RL flavor

## Tags
#marl #multi-agent #reinforcement-learning #game-theory #nash-equilibrium #self-play #ctde #albrecht #textbook

## Source
- Raw: `raw/marl-book.pdf` (md5: 5251ffa28cb5d5e8721882ffb891da92)
- Online: marl-book.com
