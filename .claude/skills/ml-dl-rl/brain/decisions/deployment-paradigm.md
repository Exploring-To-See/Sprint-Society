# Decision: ML Deployment Paradigm

[[../summaries/machine-learning-systems]] Ch. 2 frames a four-tier spectrum.

## Tiers
- **Cloud ML** — max compute, centralized, latency = network round-trip; data leaves device
- **Edge ML** — server / gateway near the user; reduces latency and bandwidth
- **Mobile ML** — on phone; offline capable, privacy-preserving
- **Tiny ML** — microcontrollers (KB of RAM); always-on sensing, ultra-low power
- **Hybrid** — split inference (cloud + edge), federated learning

## Selection Drivers
- **Latency budget** (real-time control vs minutes-okay batch)
- **Privacy / data residency** (GDPR, HIPAA, regulated data)
- **Connectivity** (always-on vs intermittent)
- **Energy / cost** (battery-powered devices, multi-billion inference per day)
- **Model size constraints** ([[../components/quantization]], [[../components/pruning]], [[../components/knowledge-distillation]] become required at lower tiers)

## Where It's Covered
- [[../summaries/machine-learning-systems]] Ch. 2 (full chapter), Ch. 9–11 (efficiency, optimization, acceleration)

## Tags
#decisions #ml-systems #deployment #cloud #edge #mobile #tinyml
