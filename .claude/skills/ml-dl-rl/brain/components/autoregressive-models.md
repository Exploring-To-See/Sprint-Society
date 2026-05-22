# Autoregressive Generative Models

Factorize the joint over a sequence by chain rule and learn each conditional:
p(x_1, …, x_n) = ∏ p(x_i | x_{<i}).

## Examples
- PixelRNN / PixelCNN — image pixels in raster order
- WaveNet — raw audio
- GPT family — language tokens
- Decision Transformer — actions in trajectories

## Strengths
- Exact likelihood
- High-quality samples
- LLM dominance: GPT-4, Claude, Gemini are autoregressive transformers

## Weaknesses
- Sequential generation is fundamentally serial (one token at a time), though acceleration techniques have closed much of the gap with parallel models:
  - **Speculative decoding** (2022+) — small draft model proposes, large model verifies in parallel
  - **Medusa**, **EAGLE** — multi-head speculative variants
  - **KV-cache reuse** — reuse attention state across tokens
- Local mistakes compound

## Emerging Alternatives
- **State-space models (SSMs) / Mamba, Mamba-2** — sub-quadratic alternatives that retain autoregressive likelihood but use selective state updates instead of attention; competitive on language at smaller scales
- **Diffusion / consistency models for discrete sequences** — non-autoregressive parallel sampling
- **Block-parallel decoding** — generate spans rather than tokens

## See Also
- [[transformer]], [[transformer-encoder-decoder]] — modern autoregressive backbone (decoder-only)
- [[large-language-models]] — dominant autoregressive application today
- [[rnn-sequences]] — pre-transformer autoregressive backbone (LSTMs, GRUs)
- [[decision-transformer]] — autoregressive sequence model for RL trajectories
- [[../decisions/generative-model-choice]] — how autoregressive compares to VAE / GAN / diffusion / flows
- [[diffusion-models]], [[gan]], [[variational-autoencoder]], [[normalizing-flows]] — non-autoregressive alternatives

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 22

## Tags
#autoregressive #generative-models #language-models
