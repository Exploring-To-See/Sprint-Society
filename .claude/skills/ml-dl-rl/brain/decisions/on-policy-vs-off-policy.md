# Decision: On-Policy vs Off-Policy

## On-Policy ([[../components/sarsa]], REINFORCE, A2C, PPO)
- Learn about the policy you're using to act
- Cleaner theory; safer for catastrophic exploration (e.g., cliff walking)
- *Each rollout is consumed once* — sample inefficient

## Off-Policy ([[../components/q-learning]], DQN, SAC, DDPG, TD3)
- Learn about a *target* policy from data collected with a different *behavior* policy
- Reuse data via [[../components/actor-critic|experience replay]] → much more sample efficient
- The "deadly triad" (off-policy + bootstrapping + function approximation) can diverge — needs care
- [[../concepts/importance-sampling]] gets unstable for long horizons

## When to Pick Which
- **Robotics / expensive data** → off-policy (reuse data)
- **Stable training matters** → on-policy (PPO is the workhorse)
- **Safety-critical exploration** → on-policy (SARSA accounts for actual exploration)
- **Tabular / clean MDPs** → either

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 5–7 throughout

## Tags
#decisions #reinforcement-learning #on-policy #off-policy
