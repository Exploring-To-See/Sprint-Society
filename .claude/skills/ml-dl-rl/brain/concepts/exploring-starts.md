# Exploring Starts

A Monte Carlo RL trick: ensure every (state, action) pair has a nonzero chance of being the start of an episode, so estimates of Q*(s,a) cover the whole space.

## Why It's Needed
With a deterministic policy, on-policy MC will only ever visit states/actions the policy reaches — so Q-values for unvisited (s,a) never improve. Exploring starts forces coverage.

## Limitations
Often impractical (you can't usually start a real robot in arbitrary states). Workarounds:
- ε-soft policies (always small probability of any action)
- Off-policy MC with [[importance-sampling]]

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 5.3–5.4

## Tags
#monte-carlo #exploration #reinforcement-learning
