# Active Learning

The learner picks which examples to label, instead of accepting random labels. Useful when unlabeled data is cheap but labeling is expensive (medical imaging, expert annotation, RLHF preferences).

## The Loop
1. Train on currently-labeled set L
2. Score every unlabeled point by an **acquisition function** that estimates "how much would I learn from labeling this?"
3. Query the top-scoring points, get labels, add to L
4. Repeat

## Acquisition Functions
- **Uncertainty sampling** — pick points where the current model is least confident (e.g. high entropy, small margin)
- **Bayesian Active Learning by Disagreement (BALD)** — mutual information between prediction and parameters; needs a [[../components/bayesian-neural-networks|Bayesian]] uncertainty estimate
- **Expected model change** — pick points that would shift the parameters most
- **Diverse / batch acquisition** — for large batches, encourage diversity (BatchBALD, Coreset)
- **Query-by-committee** — train an ensemble; pick points the committee disagrees on

## Connection to Other Frameworks
- Special case of [[value-of-information]]: VOI of a label is its expected reduction in posterior loss
- Cousin of [[../components/bayesian-optimization]] (active *function* evaluation rather than active *labeling*)
- Drives modern data-efficient labeling for foundation models, including preference data for RLHF

## Common Pitfalls
- **Sampling bias** — actively-selected points are *not* iid; the held-out test set must reflect the deployment distribution, not the queried distribution
- **Cold start** — uncertainty sampling on a randomly initialized model picks noise
- **Querying the same outliers repeatedly** — needs diversity/batch acquisition

## See Also
- [[value-of-information]] — formal underpinning of "what's worth labeling"
- [[../components/bayesian-neural-networks]] — needed for principled uncertainty
- [[../components/bayesian-optimization]] — same acquisition idea, applied to function evaluation
- [[exploration-exploitation]] — central tension acquisition functions encode
- [[data-labeling]] — broader context of label production
- [[../components/gaussian-processes]] — common surrogate when the input space is small

## Where It's Covered
- [[../summaries/probabilistic-ml-introduction]] Ch. 19 (semi-supervised, active learning)
- [[../summaries/probabilistic-ml-advanced]] Ch. 5 mentions
- [[../summaries/decision-making-under-uncertainty]] Ch. 4 (information gathering)
- [[../summaries/algorithms-for-decision-making]] Ch. 12 (info-gathering policies)

## Tags
#active-learning #uncertainty #data-efficiency #bayesian #foundation
