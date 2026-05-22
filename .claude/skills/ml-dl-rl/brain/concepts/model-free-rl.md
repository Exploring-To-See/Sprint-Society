# Model-Free Reinforcement Learning

RL where the agent learns a policy or value function directly from interaction without explicitly modeling environment dynamics.

## Two Subfamilies
- **Value-based:** estimate Q*(s,a), act greedily; e.g., [[../components/q-learning]], [[../components/sarsa]], DQN, [[../components/experience-replay]] for stability
- **Policy-based:** parametrize π_θ, optimize with [[../components/policy-gradient]]; e.g., REINFORCE, [[../components/ppo]], TRPO
- **[[../components/actor-critic]]:** combines both — critic estimates value, actor updates policy

See [[../decisions/model-based-vs-model-free-rl]] and [[../decisions/on-policy-vs-off-policy]].

## See Also
- [[reinforcement-learning]], [[markov-decision-process]] — broader RL framing
- [[model-based-rl]] — the alternative
- [[exploration-exploitation]] — central trade-off in any model-free method

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] (the bulk of the book is model-free)
- [[../summaries/algorithms-for-decision-making]] Ch. 17
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 8

## Tags
#model-free-rl #reinforcement-learning
