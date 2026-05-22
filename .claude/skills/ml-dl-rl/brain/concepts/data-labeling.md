# Data Labeling

Producing the supervised training labels that ML models learn from.

## Considerations
- **Label types** — class, bounding box, mask, structured (parse, dialogue), preference (RLHF)
- **Inter-annotator agreement** (Cohen's kappa, Krippendorff's alpha)
- **Active learning** — query labels for uncertain points
- **Weak / programmatic supervision** (Snorkel)
- **Crowdsourcing** vs **expert annotation**
- **AI-assisted labeling** — use a current model to pre-label, humans correct

## Pitfalls
- Selection bias in what gets labeled
- Subjective tasks (toxicity, fairness) where ground truth is contested
- Privacy and consent for sensitive labels
- Labeling pipelines drift from training pipelines (training-serving skew)

## See Also
- [[mlops]] — labeling is the upstream of every ML pipeline
- [[../components/feature-store]] — labels share lineage with features
- [[../concepts/imitation-learning]] — RLHF-style preference labeling

## Where It's Covered
- [[../summaries/machine-learning-systems]] Ch. 6.8 (full labeling treatment)
- [[../summaries/fairness-and-machine-learning]] Ch. 9 (datasets and harms)

## Tags
#data-labeling #annotation #ml-systems #data
