# Bellman Equation

The recursion that makes value functions computable: today's value = immediate reward + discounted future value.

## Forms
- **Bellman expectation (for π):** V^π(s) = E_π[r + γ V^π(s')]
- **[[bellman-optimality]]:** V*(s) = max_a E[r + γ V*(s')]

## Why It Matters
- Foundation for [[../components/value-iteration]] (iterates the optimality op until convergence)
- Foundation for [[../components/policy-iteration]] (alternates evaluation + improvement)
- TD updates ([[../components/temporal-difference-learning]], [[../components/q-learning]]) are sample-based Bellman backups
- Bellman residual ‖V - TV‖ measures how far from solution

## Properties
- The Bellman operator is a γ-contraction in sup-norm → unique fixed point
- Approximation introduces "deadly triad" (off-policy + bootstrapping + function approximation can diverge)

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 3.5–3.6, Ch. 4
- [[../summaries/algorithms-for-decision-making]] Ch. 7
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 2.4

## Tags
#bellman-equation #reinforcement-learning #dynamic-programming #foundation
