# Fairness and Machine Learning: Limitations and Opportunities (Barocas, Hardt, Narayanan 2023)

The standard reference for algorithmic fairness — how ML systems encode discrimination and what fairness can and cannot mean in math.

## Identification
- **Authors:** Solon Barocas (Microsoft Research / Cornell), Moritz Hardt (MPI Tübingen / UC Berkeley), Arvind Narayanan (Princeton)
- **Publisher:** MIT Press, 2023 (open online at fairmlbook.org)
- **Source:** [[../entities/book-fairml]]

## Structure (9 chapters)

1. **Introduction** — demographic disparities, the ML loop, measurement issues, feedback loops
2. **When is automated decision making legitimate?** — bureaucracy, automation forms, target/goal mismatch, limits of induction
3. **Classification and statistical fairness** — three core criteria: [[../concepts/independence-criterion]], [[../concepts/separation-criterion]], [[../concepts/sufficiency-criterion]]; relationships and case study (credit scoring); inherent limits of observational tests
4. **Relative notions of fairness** — six accounts of wrongfulness, equality of opportunity, merit/desert, the cost of fairness
5. **[[../concepts/causality]]** — causal models/graphs, interventions, confounding, counterfactual discrimination analysis
6. **U.S. anti-discrimination law** — disparate treatment vs disparate impact, protected attributes
7. **Testing discrimination in practice** — observational tests, NLP, computer vision, ad targeting, search/recommenders, marketplaces
8. **A broader view of discrimination** — three levels (individual/institutional/structural), structural interventions, organizational reform
9. **Datasets** — datasets across domains, harms, dataset documentation

## Key Result
The three fairness criteria (independence, separation, sufficiency) are **mutually exclusive in non-degenerate cases** — see [[../decisions/fairness-criteria-tradeoff]].

## Why It Matters
- The canonical reference for fairness in ML; cited by every recent work
- Pairs with the [[machine-learning-systems]] chapter on Responsible AI for the engineering side
- [[understanding-deep-learning]] and [[probabilistic-ml-introduction]] include short ethics chapters; this is the deep treatment
- For the model-explanation side of accountability see [[../concepts/interpretability]]

## Tags
#fairness #ethics #ml-ethics #discrimination #causality #policy #barocas #hardt #narayanan #textbook

## Source
- Raw: `raw/fairmlbook.pdf` (md5: f64b11a063f1fd53e5e2e73e65378389)
- Online: fairmlbook.org
