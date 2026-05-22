# Genetic Algorithms

Population-based stochastic optimization inspired by biological evolution: selection, crossover, mutation.

## Cycle
1. Evaluate fitness of each individual
2. **Selection** (tournament, roulette, rank-based)
3. **Crossover** — combine two parents
4. **Mutation** — random perturbation
5. Repeat

Good for combinatorial / non-differentiable objectives. Modern relatives: CMA-ES, NEAT, evolution strategies (used by OpenAI for RL).

## See Also
- [[ant-colony-optimization]] — sibling population-based metaheuristic
- [[particle-swarm]] — sibling population-based metaheuristic
- [[simulated-annealing]] — single-particle stochastic alternative
- [[genetic-programming]] — genetic algorithms applied to program trees
- [[cross-entropy-method]] — population-based gradient-free optimization

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 9 (population methods chapter)

## Tags
#genetic-algorithms #evolution #optimization #population
