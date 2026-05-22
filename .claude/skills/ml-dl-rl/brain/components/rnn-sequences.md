# Recurrent Neural Networks (RNNs)

Networks that maintain a hidden state across time steps: h_t = f(h_{t-1}, x_t).

## Variants
- **Vanilla RNN** — vanishing/exploding gradient issues
- **LSTM** — gated cells; standard until ~2018
- **GRU** — simpler than LSTM, similar performance
- **Bidirectional** — combine forward + backward states (encoders)

## Status (2026)
Mostly displaced by [[transformer-encoder-decoder]] for NLP and time-series. Still relevant for:
- Streaming / online inference (constant memory)
- Very long sequences where attention's O(n²) is prohibitive
- State-space models (Mamba, S4) are a modern resurgence

## See Also
- [[transformer]] — what largely replaced RNNs for sequence modeling
- [[transformer-encoder-decoder]] — direct successor architecture
- [[backpropagation]] — backprop-through-time is the gradient mechanism
- [[gaussian-filtering]] — linear-Gaussian state-space cousin
- [[gnn]] — analogous "message passing over a structure" architecture

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 15 (Sequences)
- [[../summaries/understanding-deep-learning]] briefly (replaced by transformers)
- [[../summaries/machine-learning-systems]] Ch. 4.4 (engineering RNNs)

## Tags
#rnn #lstm #gru #sequences #deep-learning
