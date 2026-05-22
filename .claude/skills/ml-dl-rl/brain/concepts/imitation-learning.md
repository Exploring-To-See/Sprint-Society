# Imitation Learning

Learning a policy from expert demonstrations rather than reward.

## Methods
- **Behavioral cloning** — supervised learning from (state, action) pairs; suffers from covariate shift
- **DAgger** (Dataset Aggregation) — iteratively query expert on policy-induced states to fix BC's compounding error
- **Inverse reinforcement learning (IRL)** — recover the reward function the expert is implicitly optimizing, then run RL on it
- **Generative adversarial imitation (GAIL)** — discriminator-based matching of state-action distributions

## When to Use
- Reward is hard to specify but demonstrations are easy (driving, surgery)
- Bootstrapping RL with expert data
- Foundation of RLHF (preference-based + supervised fine-tuning)

## See Also
- [[reinforcement-learning]] — broader paradigm; IL bootstraps or replaces RL
- [[../components/alpha-star]], [[../components/alpha-go]] — both began with imitation from human play
- [[../components/policy-self-play]] — common pairing (imitation → self-play)
- [[../components/ppo]] — RLHF's RL stage uses PPO
- [[../components/decision-transformer]] — sequence-modeling alternative; closely related to BC
- [[../components/large-language-models]] — SFT stage is behavioral cloning on instruction data

## Where It's Covered
- [[../summaries/algorithms-for-decision-making]] Ch. 18
- [[../summaries/reinforcement-learning-introduction]] Ch. 17 mentions
- [[../summaries/multi-agent-reinforcement-learning]] briefly

## Tags
#imitation-learning #irl #behavioral-cloning #reinforcement-learning
