# Federated Learning

Train a global model without centralizing raw data. Clients compute updates on their local data; a coordinator aggregates updates into a global model.

## Algorithms
- **FedAvg** — average client weights
- **FedProx** — penalize drift from global
- **SCAFFOLD** — variance reduction across clients
- **FedSGD** — synchronous gradient averaging

Often paired with [[differential-privacy]] and secure aggregation for stronger privacy.

## Where It's Covered
- [[../summaries/machine-learning-systems]] Ch. 15

## Tags
#federated-learning #privacy #ml-systems #distributed
