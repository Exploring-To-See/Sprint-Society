# Trust Region Methods

Optimization that limits each step to a region in which a quadratic model of the objective is "trusted." Adjusts the region size based on actual vs predicted improvement.

Used in TRPO (RL), Levenberg-Marquardt (least squares), and many constrained optimizers.

## See Also
- [[newtons-method]] — quadratic model used inside the trust region
- [[bfgs]], [[lbfgs]] — quasi-Newton methods often paired with trust regions
- [[ppo]] — uses a trust-region-style KL penalty (descended from TRPO)
- [[gradient-descent]] — line-search alternative to step-size control

## Where It's Covered
- [[../summaries/algorithms-for-optimization]] Ch. 4.4

## Tags
#trust-region #optimization
