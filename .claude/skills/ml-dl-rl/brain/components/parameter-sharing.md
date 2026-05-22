# Parameter Sharing (MARL)

When agents are homogeneous, share network parameters across them — train one network, use it for all agents (with optional agent ID input). Massively improves sample efficiency in cooperative settings; standard for SMAC and similar benchmarks.

See [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.7.1.

## See Also
- [[centralized-training-decentralized-execution]] — frequently combined paradigm
- [[multi-agent-policy-gradient]] — typical consumer (MAPPO, MADDPG)
- [[value-decomposition]] — alternative cooperative MARL approach
- [[../concepts/sequential-multi-agent-problems]] — Dec-POMDP setting where it's most useful

## Tags
#parameter-sharing #marl #cooperative
