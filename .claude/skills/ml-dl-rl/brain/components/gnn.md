# Graph Neural Networks (GNNs)

Neural networks that operate on graph-structured input. Each layer aggregates neighbor features (message passing), then transforms.

## Architectures
- **GCN** (Kipf & Welling) — symmetric normalization
- **GraphSAGE** — sampling neighbors at scale
- **GAT** — attention over neighbors
- **MPNN** (general message-passing)
- **Graph transformers** — attention over the whole graph (with positional encodings from spectra or structure)

## Use Cases
- Molecule property prediction
- Recommender systems (user/item graph)
- Traffic / route prediction
- Code analysis (AST + flow)

## See Also
- [[message-passing]] — the underlying inference primitive GNNs reuse
- [[multi-head-attention]] — GAT and graph transformers extend it
- [[../concepts/graphical-models]] — classical analog
- [[cnn]] — both share spatial weight-sharing intuition (CNN is a regular-grid GNN)

## Where It's Covered
- [[../summaries/understanding-deep-learning]] Ch. 13 (full chapter)
- [[../summaries/probabilistic-ml-advanced]] Ch. 30 (graph learning)

## Tags
#gnn #graphs #deep-learning
