# Knowledge Distillation

Train a small "student" model to mimic a large "teacher" model's outputs (often soft probabilities). Yields compact models that recover most of the teacher's accuracy.

## Variants
- Logit-matching (Hinton 2015)
- Feature-matching (intermediate activations)
- Self-distillation
- Born-again networks

Now standard in LLM workflows: distill a 70B teacher into a 7B student for deployment.

## See Also
- [[quantization]], [[pruning]] — orthogonal compression techniques (often combined)
- [[../decisions/deployment-paradigm]] — distillation is decisive for Edge / Mobile / TinyML targets
- [[../concepts/representation-learning]] — distilled representations underpin many transfer pipelines

## Where It's Covered
- [[../summaries/machine-learning-systems]] Ch. 10

## Tags
#knowledge-distillation #compression #ml-systems
