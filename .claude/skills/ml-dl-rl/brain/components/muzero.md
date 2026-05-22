# MuZero

DeepMind 2019: model-based deep RL that learns the dynamics in a *learned latent space* — no rules, no simulator, no environment model given. Reaches superhuman performance on Go, chess, shogi (matching [[alpha-zero]]) AND the [[../entities/atari-dqn]] benchmark with a single algorithm.

## Three Learned Networks
1. **Representation function** h(o) = s — encode observations to latent state
2. **Dynamics function** g(s, a) = (r, s') — predict reward + next latent state
3. **Prediction function** f(s) = (π, v) — policy prior and value

Training jointly minimizes prediction errors on policy, value, and reward, all bootstrapped from real trajectories. The model is *not* asked to reconstruct observations — it is only judged on the quantities that matter for [[mcts]].

## Why It's Important
- **No environment model required** — generalizes [[alpha-zero]] (which needed game rules) to Atari (where rules are pixels)
- **Plans in latent space** — sidesteps the curse of pixel-level world models
- **Same algorithm** for board games and Atari — major step toward generality
- Successors: **Sampled MuZero** (continuous actions), **Stochastic MuZero**, **EfficientZero** (data-efficient Atari), **MuZero Unplugged** (offline RL)

## Limitations
- Compute-hungry; reproductions in academia are rare
- Latent-model errors compound for long planning horizons in stochastic environments
- Less helpful than expected on real-world robotics where dynamics are messier than tree search expects

## See Also
- [[alpha-zero]] — predecessor with given dynamics; MuZero learns them
- [[alpha-go]], [[alpha-go-zero]] — earlier in the lineage
- [[mcts]] — same search backbone, now over a learned model
- [[../concepts/model-based-rl]] — paradigm MuZero exemplifies
- [[../entities/atari-dqn]] — benchmark MuZero subsumed
- [[dqn]] — model-free baseline on the same benchmark

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 16.6 (AlphaGo / MuZero lineage)
- [[../summaries/multi-agent-reinforcement-learning]] Ch. 9.8 (model-based deep RL)

## Tags
#muzero #model-based-rl #deepmind #mcts #deep-rl
