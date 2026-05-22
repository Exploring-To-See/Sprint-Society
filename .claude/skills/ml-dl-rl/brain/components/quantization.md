# Quantization

Reduce model precision (FP32 → FP16 / INT8 / INT4 / sub-byte) to shrink memory footprint and speed inference.

## Approaches
- **Post-training quantization (PTQ)** — calibrate on a small dataset
- **Quantization-aware training (QAT)** — simulate quantization during training
- **GPTQ, AWQ** — LLM-specific weight-only quantization
- **Mixed precision** training (BF16/FP16) for training itself

## Trade-offs
- INT8 typically loses <1% accuracy; INT4 needs careful calibration
- Speedup depends on hardware support (Tensor Cores, NPUs)

## See Also
- [[pruning]] — orthogonal compression axis (can be combined)
- [[knowledge-distillation]] — teacher-student compression alternative
- [[../decisions/deployment-paradigm]] — quantization choice depends on target (Cloud/Edge/Mobile/TinyML)

## Where It's Covered
- [[../summaries/machine-learning-systems]] Ch. 10

## Tags
#quantization #efficiency #ml-systems #deployment
