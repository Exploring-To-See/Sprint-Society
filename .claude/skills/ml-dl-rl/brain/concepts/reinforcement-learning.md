# Reinforcement Learning

Learning to act — an agent maps situations to actions to maximize a numerical reward signal received from interaction.

## Setting
- **Agent + environment** modeled as an [[markov-decision-process]] (MDP) — states S, actions A, transition p(s'|s,a), reward r(s,a)
- **[[policy]]** π(a|s) — what the agent does
- **[[value-function]]** V^π(s), Q^π(s,a) — expected return from a state/action
- **Goal:** find π* maximizing E[Σ γ^t r_t]

## Core Algorithm Families
- **Dynamic programming** ([[../components/policy-iteration]], [[../components/value-iteration]]) — when model is known
- **Monte Carlo methods** — learn from complete episodes
- **[[../components/temporal-difference-learning]]** — bootstrapping; [[../components/sarsa]] (on-policy), [[../components/q-learning]] (off-policy)
- **Function approximation** — [[../components/cnn]] for state, deep Q-learning, deep policy networks
- **[[../components/policy-gradient]]** / [[../components/actor-critic]] — directly optimize policy
- **[[model-based-rl]] vs [[model-free-rl]]**

## Key Trade-offs
- **[[exploration-exploitation]]** — try new actions vs use what you know
- **On-policy vs off-policy** — see [[../decisions/on-policy-vs-off-policy]]
- **Model-based vs model-free** — see [[../decisions/model-based-vs-model-free-rl]]

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] — Sutton & Barto, the foundational text
- [[../summaries/probabilistic-ml-advanced]] Ch. 35 — Bayesian / probabilistic reframing
- [[../summaries/multi-agent-reinforcement-learning]] — generalizes single-agent RL to multi-agent
- [[../summaries/algorithms-for-decision-making]] Ch. 10–18 — RL within decision-theoretic context
- [[../summaries/understanding-deep-learning]] Ch. 19 — deep RL (DQN, policy gradient, AlphaGo)
- [[../summaries/algorithms-for-validation]] Ch. 5.5 — RL for falsification

## Tags
#reinforcement-learning #foundation #mdp
