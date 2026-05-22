# Gaussian Filtering / Smoothing (Kalman Filter)

Closed-form Bayesian inference for *linear Gaussian* state-space models.

x_t = A x_{t-1} + w_t,  w ~ N(0, Q)
y_t = C x_t + v_t,       v ~ N(0, R)

## Algorithms
- **Kalman filter** — forward, real-time
- **RTS smoother** — backward pass over the filter
- **Extended KF (EKF)** — linearize nonlinear dynamics around the mean
- **Unscented KF (UKF)** — sigma-point approximation, often better than EKF
- For non-Gaussian / nonlinear: switch to [[sequential-monte-carlo]]

## See Also
- [[sequential-monte-carlo]] — particle-based generalization for nonlinear / non-Gaussian models
- [[../concepts/bayesian-inference]] — closed-form Bayesian inference is the principle
- [[../concepts/importance-sampling]] — alternative inference primitive when Gaussian assumptions break
- [[../concepts/graphical-models]] — state-space models are linear-Gaussian dynamic Bayes nets

## Where It's Covered
- [[../summaries/probabilistic-ml-advanced]] Ch. 8

## Tags
#kalman-filter #state-space #bayesian #linear-gaussian
