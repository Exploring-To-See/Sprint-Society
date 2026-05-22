# Decision Transformer

Chen et al. 2021: re-frame offline RL as conditional sequence modeling. Instead of fitting a value function, train a [[transformer]] (decoder-only, [[autoregressive-models|autoregressive]]) over trajectory tokens (return-to-go, state, action, …) and *condition* on a desired return at inference.

## Trajectory Representation
A trajectory is the token sequence:
(R̂_1, s_1, a_1, R̂_2, s_2, a_2, …)

where R̂_t is the **return-to-go** Σ_{k≥t} r_k. The model learns p(a_t | s_{≤t}, a_{<t}, R̂_{≤t}).

At inference, prompt with the desired return R̂_target and current state, then sample actions autoregressively.

## Why It's Interesting
- **No bellman backups** — pure supervised learning over trajectories; sidesteps off-policy / bootstrapping instability
- **Leverages transformer scaling** — same playbook that made LLMs work
- **Returns are conditioning, not optimization** — you ask for a return, the model imitates trajectories that achieved it
- **Multi-task learning** — one transformer, many tasks via different return prompts

## Limitations
- Requires diverse offline data covering the target return regime — extrapolation beyond seen returns is unreliable
- Can be brittle on stitching: combining sub-optimal pieces into an optimal path is harder than for value-based offline RL
- Trajectory Transformer (Janner et al. 2021) is a cousin that explicitly plans via beam search

## Lineage and Successors
- **Trajectory Transformer** — model state/action/reward as a sequence, then beam-search
- **Online Decision Transformer** — fine-tune on online rollouts
- **Multi-Game Decision Transformer** — single transformer plays many Atari games
- Generalist agents (Gato) extend the recipe across modalities

## See Also
- [[transformer]] — architecture this is built on
- [[autoregressive-models]] — the generative paradigm
- [[../concepts/imitation-learning]] — Decision Transformer is closer to BC than to TD-style RL
- [[../concepts/model-free-rl]] — falls under model-free offline RL
- [[experience-replay]] — offline RL more generally

## Where It's Covered
- [[../summaries/reinforcement-learning-introduction]] Ch. 17 (offline RL framing)
- [[../summaries/probabilistic-ml-advanced]] Ch. 22 (autoregressive sequence models)

## Tags
#decision-transformer #transformer #offline-rl #sequence-modeling #reinforcement-learning
