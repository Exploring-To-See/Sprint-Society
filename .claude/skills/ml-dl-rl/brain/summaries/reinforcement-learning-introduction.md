# Reinforcement Learning: An Introduction (Sutton & Barto, 2nd ed., 2018/2020)

The foundational RL textbook — the field's defining reference, written by its founders.

## Identification
- **Authors:** Richard S. Sutton, Andrew G. Barto
- **Publisher:** MIT Press, 2nd edition 2018, revised 2020
- **License:** CC-BY-NC-ND
- **Source:** [[../entities/book-rl-suttonbarto]]

## Structure (17 chapters in 3 parts)

### Part I — Tabular Solution Methods
1. Introduction — RL definition, elements (agent, environment, [[../concepts/policy]], reward, [[../concepts/value-function]], model), Tic-Tac-Toe, history
2. **Multi-armed Bandits** — k-armed problem, action-value methods, ε-greedy, optimistic init, [[../components/ucb]], gradient bandits, contextual bandits
3. **Finite [[../concepts/markov-decision-process]]** — agent-environment interface, returns, episodic vs continuing, value functions, [[../concepts/bellman-optimality]]
4. **Dynamic Programming** — [[../components/policy-iteration]], [[../components/value-iteration]], [[../components/generalized-policy-iteration]], async DP
5. **Monte Carlo Methods** — prediction, control, [[../concepts/exploring-starts]], on-policy / off-policy via [[../concepts/importance-sampling]]
6. **[[../components/temporal-difference-learning]]** — TD(0), [[../components/sarsa]] (on-policy), [[../components/q-learning]] (off-policy), expected SARSA, [[../components/double-q-learning]]
7. **n-step Bootstrapping** — n-step SARSA, off-policy n-step, tree backup, n-step Q(σ)
8. **Planning and Learning** — Dyna integration, prioritized sweeping, expected vs sample updates, [[../components/mcts]]

### Part II — Approximate Solution Methods
9. **On-policy Prediction with Approximation** — value function approximation, [[../concepts/stochastic-gradient-descent]], linear methods, tile coding, Fourier basis, RBFs, neural networks
10. **On-policy Control with Approximation** — episodic semi-gradient, average-reward methods
11. **Off-policy Methods with Approximation** — deadly triad, [[../components/gradient-td]], emphatic-TD
12. **Eligibility Traces** — λ-return, TD(λ), accumulating/dutch/replacing traces
13. **[[../components/policy-gradient]] Methods** — REINFORCE, [[../components/actor-critic]], policy parametrization for continuous actions

### Part III — Looking Deeper
14. Psychology — classical conditioning, instrumental, cognitive maps, habits/goals
15. Neuroscience — neural correlates of reward, dopamine signaling, basal ganglia
16. **Applications & Case Studies** — TD-Gammon, Samuel checkers, Watson, [[../entities/atari-dqn]], [[../components/alpha-go]] / [[../components/alpha-go-zero]], thermal soaring
17. Frontiers — general value functions, [[../concepts/options-framework]], reward design, future of RL+AI

## Key Idea
RL = learning what to do — mapping situations to actions — to maximize a numerical reward signal. The agent learns from interaction, not labeled examples.

## Why It Matters
- *The* RL textbook. Every other RL book builds on it.
- Tabular treatment in Part I is the cleanest pedagogical introduction
- Predecessor / single-agent counterpart to [[multi-agent-reinforcement-learning]]
- [[probabilistic-ml-advanced]] Ch. 35 is a Bayesian-flavored re-presentation of the same material

## Tags
#reinforcement-learning #mdp #q-learning #policy-gradient #temporal-difference #sutton #barto #textbook #foundational

## Source
- Raw: `raw/RLbook2020.pdf` (md5: ac2fe93a51c6daa7355425d9f269decb)
- Online: incompleteideas.net/book/the-book-2nd.html
