# Decision: Choosing a Fairness Criterion

The three statistical fairness criteria — [[../concepts/independence-criterion]], [[../concepts/separation-criterion]], [[../concepts/sufficiency-criterion]] — **cannot all hold simultaneously** except in degenerate cases (Chouldechova 2017; Kleinberg-Mullainathan-Raghavan 2016 impossibility theorems).

## The Trilemma
You must pick at most two:
- **Independence** (group selection rates equal) — *preferred when:* selection should reflect demographic representation, no reliable ground truth
- **Separation** (error rates equal across groups) — *preferred when:* ground truth is reliable AND errors carry equal moral weight
- **Sufficiency** (calibration within groups) — *preferred when:* a score must mean the same thing for any group

## Famous Application: ProPublica vs Northpointe (COMPAS)
- ProPublica argued: separation violated → racially disparate FPR
- Northpointe argued: sufficiency satisfied → calibrated within race
- Both correct; the disagreement was about which criterion mattered

## What This Means for Practice
- "Fair" is *not* a unique technical property — it's a value judgment about which criterion fits the harm being prevented
- Combine with [[../concepts/causality]] for causal/counterfactual fairness, which sidesteps some of the impossibility
- Domain matters: medical screening, loan approval, criminal justice each weight criteria differently

## Where It's Covered
- [[../summaries/fairness-and-machine-learning]] Ch. 3 (the impossibility theorems)

## Tags
#decisions #fairness #ethics #impossibility-theorem
