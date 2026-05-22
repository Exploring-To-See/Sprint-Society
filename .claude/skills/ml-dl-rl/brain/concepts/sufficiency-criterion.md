# Sufficiency (Calibration / Predictive Parity)

Statistical fairness criterion: outcome Y is independent of protected attribute A *given* predictor R.

P(Y = 1 | R = r, A = a) = P(Y = 1 | R = r, A = b)  for all scores r and groups a, b.

## Equivalent / Related
- **Calibration within groups** — predicted probabilities match empirical rates per group
- **Predictive parity** — at the binary decision level
- This is what Northpointe argued COMPAS satisfied

## Strengths
- "A score of 0.7 means the same thing for any group" — predictions are interpretable across groups
- Naturally satisfied by Bayes-optimal predictors trained on representative data

## Limitations
- Cannot generally hold simultaneously with [[independence-criterion]] or [[separation-criterion]] — see [[../decisions/fairness-criteria-tradeoff]]
- The famous Chouldechova (2017) / Kleinberg–Mullainathan–Raghavan (2016) impossibility theorems formalize this

## Where It's Covered
- [[../summaries/fairness-and-machine-learning]] Ch. 3

## Tags
#fairness #calibration #sufficiency #ethics
