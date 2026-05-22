# Separation (Equalized Odds / Error Rate Parity)

Statistical fairness criterion: predictor R is independent of protected attribute A *given* outcome Y.

P(R = 1 | Y = y, A = a) = P(R = 1 | Y = y, A = b)  for all y and groups a, b.

## Equivalent / Related
- **Equalized odds** — TPR and FPR equal across groups
- **Equal opportunity** — only TPR equal across groups (weaker)

## Strengths
- Conditions on the truth — doesn't penalize accurate predictions of real differences
- Aligned with intuition that errors should be borne equally across groups

## Limitations
- Cannot generally hold simultaneously with [[independence-criterion]] or [[sufficiency-criterion]] — see [[../decisions/fairness-criteria-tradeoff]]
- Requires reliable ground-truth labels Y (often racially biased themselves — measurement problem)
- ProPublica vs Northpointe debate over COMPAS centered on separation vs sufficiency

## Where It's Covered
- [[../summaries/fairness-and-machine-learning]] Ch. 3

## Tags
#fairness #equalized-odds #separation #ethics
