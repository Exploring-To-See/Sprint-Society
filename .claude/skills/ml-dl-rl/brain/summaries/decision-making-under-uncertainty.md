# Decision Making Under Uncertainty: Theory and Application (Kochenderfer 2015)

The 2015 MIT Lincoln Lab predecessor to [[algorithms-for-decision-making]] — theory + ten domain case studies (collision avoidance, surveillance, speech).

## Identification
- **Lead Author:** Mykel J. Kochenderfer (with contributions from Amato, Chowdhary, How, Reynolds, Thornton, Torres-Carrasquillo, Üre, Vian)
- **Publisher:** MIT Press, 2015 (Lincoln Laboratory Series)
- **License:** CC-BY-NC-ND
- **Source:** [[../entities/book-dmu]]

## Structure

### Part I — Theory
- Probabilistic models: [[../concepts/bayesian-networks]], inference, parameter/structure learning
- Decision problems: [[../concepts/utility-theory]], [[../components/decision-networks]], game-theoretic equilibria (dominant, Nash)
- Sequential problems: MDPs, dynamic programming, [[../components/policy-iteration]], [[../components/value-iteration]], structured rep
- Model uncertainty: bandits, [[../concepts/exploration-exploitation]], Bayesian RL, [[../concepts/model-free-rl]]
- State uncertainty: POMDPs, alpha-vector reps, [[../components/pomdp-planning]], offline + online methods
- Cooperative decisions: Dec-POMDPs, communication

### Part II — Applications (Domain Case Studies)
- Aircraft collision avoidance (TCAS, ACAS X)
- Unmanned aircraft surveillance & sense-and-avoid
- Probabilistic surveillance video search
- Speech: HMMs, GMMs, EM, recognition, language ID, speaker ID, machine translation
- Multi-UAS persistent surveillance
- Considering the human in design

## Why It Matters
- Predecessor to the algorithms-first [[algorithms-for-decision-making]] (2022) — same author, 7 years apart, MUCH more applied detail
- Use this for *application* depth (real-world POMDP design), the newer book for *algorithm* breadth
- Aviation/safety-critical decision applications are the unique value

## Tags
#decision-making #pomdp #applications #aviation #aerospace #kochenderfer #lincoln-lab #safety-critical #textbook

## Source
- Raw: `raw/dmu.pdf` (md5: bd7fcd02ca1584d244b074e244088d58)
- Online: web.stanford.edu/group/sisl/public/dmu.pdf
