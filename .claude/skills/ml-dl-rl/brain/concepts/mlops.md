# MLOps

DevOps for ML — the practices, tools, and pipelines that turn experimental models into reliable production systems.

## Lifecycle
1. **Data ingestion + validation** — schema checks, drift detection
2. **Training pipeline** — reproducible, versioned data + code
3. **Model registry** — versioned artifacts with metadata
4. **CI/CD for ML** — test data, train, evaluate gates, deploy
5. **Serving** — low-latency, scalable inference (batch or streaming)
6. **Monitoring** — performance, data drift, model drift, fairness, latency
7. **Continuous training / retraining triggers**
8. **Incident response** — rollback to previous model version

## Distinctive Challenges
- "It's not just code" — data and model artifacts are also versioned
- Training-serving skew — feature pipelines must match
- Concept drift breaks "deploy and forget"
- Reproducibility: random seeds, library versions, data snapshots

## See Also
- [[../components/feature-store]] — solves training-serving skew at the feature layer
- [[data-labeling]] — upstream data quality is part of MLOps
- [[../decisions/deployment-paradigm]] — Cloud / Edge / Mobile / TinyML targets shape the pipeline

## Where It's Covered
- [[../summaries/machine-learning-systems]] Ch. 13 (full chapter on ML Operations)

## Tags
#mlops #ml-systems #deployment #monitoring
