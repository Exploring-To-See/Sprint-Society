# Independence (Demographic Parity)

Statistical fairness criterion: predictor R is *independent* of protected attribute A.

P(R = 1 | A = a) = P(R = 1 | A = b)  for all groups a, b.

## Equivalent Names
- Demographic parity, statistical parity, group fairness, disparate impact (≈ 80% rule)

## Strengths
- Easy to specify and audit
- Captures "no group is over- or under-selected"

## Limitations
- Ignores ground truth — a perfectly accurate predictor that mirrors real disparities will violate it
- Tension with [[separation-criterion]] and [[sufficiency-criterion]] — see [[../decisions/fairness-criteria-tradeoff]]
- Can satisfy by trivial random selection within groups

## Where It's Covered
- [[../summaries/fairness-and-machine-learning]] Ch. 3

## Tags
#fairness #demographic-parity #statistical-parity #ethics
