# Interpretability

Methods for understanding what a learned model is doing — for trust, debugging, fairness, and regulation.

## Approaches
- **Intrinsically interpretable models** — linear, decision trees, rules
- **Post-hoc explanation** — SHAP, LIME, integrated gradients, attention visualization
- **Counterfactual explanations** — "if X were different, prediction would flip"
- **Mechanistic interpretability** — circuits, sparse autoencoders for LLM internals
- **Concept bottleneck models** — force the network to predict human-named concepts

## Tensions
- Faithfulness vs simplicity
- Local vs global
- Plausibility vs accuracy
- Dual-use: same explanations help both auditors *and* attackers gaming the model

## See Also
- [[causality]] — counterfactual interpretability borrows from causal modeling
- [[../decisions/fairness-criteria-tradeoff]] — interpretability is a key audit handle for fairness
- [[representation-learning]] — what concept-bottleneck and SAE methods probe
- [[agent-models]] — interpretability inputs into safety validation

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 33 (Interpretability)
- [[../summaries/algorithms-for-validation]] Ch. 11 (Explainability for safety-critical AI)
- [[../summaries/machine-learning-systems]] Ch. 17 (Responsible AI)

## Tags
#interpretability #explainability #responsible-ai
