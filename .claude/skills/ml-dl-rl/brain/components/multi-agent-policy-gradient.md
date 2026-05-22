# Multi-Agent Policy Gradient

Policy gradient extended to multi-agent settings. Each agent updates its own policy, often with a centralized critic (CTDE) to reduce variance from non-stationarity.

## Algorithms
- **MADDPG** — multi-agent DDPG with centralized critic per agent
- **COMA** — counterfactual baseline using a centralized critic
- **MAPPO** — PPO with centralized critic
- **HATRPO / HAPPO** — heterogeneous-agent PG with sequential updates

## See Also
- [[policy-gradient]] — single-agent base algorithm
- [[ppo]] — single-agent algorithm MAPPO extends
- [[actor-critic]] — single-agent foundation for MADDPG
- [[centralized-training-decentralized-execution]] — paradigm these algorithms instantiate
- [[parameter-sharing]] — common technique paired with these methods
- [[../concepts/sequential-multi-agent-problems]] — Dec-POMDP setting

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.4

## Tags
#multi-agent-policy-gradient #marl #ctde
