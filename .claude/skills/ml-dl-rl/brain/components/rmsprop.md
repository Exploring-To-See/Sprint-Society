# RMSProp

Like [[adagrad]] but uses an exponential moving average of squared gradients (so denominator doesn't grow forever).

v_t = β v_{t-1} + (1-β) g_t²
θ ← θ - η g_t / (√v_t + ε)

Fixes Adagrad's "learning rate eventually 0" issue. Predecessor to [[adam]] (Adam adds 1st moment too).

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 5.6
- [[../summaries/understanding-deep-learning]] Ch. 6

## Tags
#rmsprop #optimization
