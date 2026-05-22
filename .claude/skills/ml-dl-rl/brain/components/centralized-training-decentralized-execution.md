# Centralized Training, Decentralized Execution (CTDE)

MARL paradigm: during training, agents have access to global information (other agents' observations, joint state, joint actions); at execution, each agent acts on its local observation only.

This sidesteps non-stationarity in MARL while remaining deployable to decentralized agents.

## Examples
- **MADDPG** — centralized critic, decentralized actor
- **COMA** — counterfactual baseline using a centralized critic
- **VDN, QMIX** — value decomposition (see [[value-decomposition]])
- **MAPPO** — PPO with centralized critic

## Where It's Covered
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9 (full chapter)

## Tags
#ctde #marl #cooperative
