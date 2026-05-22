# Temporal-Difference (TD) Learning

Learn value functions from samples *without* a model, using the bootstrap target r + γ V(s'):

V(s) ← V(s) + α [r + γ V(s') - V(s)]

The square bracket is the **TD error** δ.

## Algorithm Family
- **TD(0)** — simplest, V update with 1-step return
- **TD(λ)** — eligibility traces blend 1-step through MC
- **[[sarsa]]** — on-policy TD control on Q
- **[[q-learning]]** — off-policy TD control on Q
- **Expected SARSA** — exploits expectation over next action
- **n-step TD** — bridges TD(0) and Monte Carlo

## Why It Works
TD(0) is a stochastic approximation to the [[../concepts/bellman-equation]]. Combining bootstrapping (r + γ V(s')) with sampling (s' draw) makes it both online and model-free.

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 6 (the foundational chapter)
- [[../summaries/algorithms-for-decision-making]] Ch. 17

## Tags
#td-learning #reinforcement-learning #foundation
