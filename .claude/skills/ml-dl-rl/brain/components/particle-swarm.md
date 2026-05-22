# Particle Swarm Optimization

Population of "particles" each with position + velocity, attracted toward personal best and global best.

v_i ← w·v_i + c₁·r₁·(p_best - x_i) + c₂·r₂·(g_best - x_i)
x_i ← x_i + v_i

Simple, fast, often competitive with [[genetic-algorithms]] for low-dim continuous problems.

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 9 (population methods)

## Tags
#particle-swarm #pso #optimization #population
