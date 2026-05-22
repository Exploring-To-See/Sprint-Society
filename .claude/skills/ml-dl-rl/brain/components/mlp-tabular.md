# MLP for Tabular Data

Multi-layer perceptron — fully connected feedforward network. Still strong baseline for tabular data, often competitive with gradient-boosted trees.

## Tips for Tabular
- Embed categorical features (instead of one-hot)
- Normalize / standardize numeric features
- Often a small net (2–4 layers, hundreds to thousands of units) suffices
- Modern alternatives: TabNet, NODE, FT-Transformer, but XGBoost/LightGBM remain dominant

## See Also
- [[backpropagation]], [[sgd]], [[adam]] — training stack
- [[dropout]], [[l2-regularization]], [[batch-normalization]] — typical regularizers
- [[cnn]], [[transformer]] — sister architectures for spatial / sequential data

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 13
- [[../summaries/machine-learning-systems]] Ch. 4.2 (engineering MLPs)

## Tags
#mlp #tabular #deep-learning
