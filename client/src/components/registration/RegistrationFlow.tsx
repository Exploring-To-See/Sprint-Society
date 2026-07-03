import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';
import { SSAura } from '../ss/SSAura';
import { ArrowLeft, Camera, Check } from '../ss/icons';
import api from '../../lib/api';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  profile_photo: File | null;
  profile_photo_preview: string;
}

const INITIAL: FormData = {
  name: '', email: '', phone: '', password: '', confirmPassword: '',
  profile_photo: null, profile_photo_preview: '',
};

// semantic strength ramp: amber = not there yet, accent = fair, green = good/strong
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--amber)' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'var(--accent-2)' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'var(--green)' };
  return { score: 4, label: 'Strong', color: 'var(--green)' };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15 } },
};

const inputBase: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 13,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13.5px var(--body)', color: 'var(--fg)', outline: 'none',
  transition: 'border-color .2s var(--ease)',
};

const errText: React.CSSProperties = { font: '500 10.5px var(--body)', color: 'var(--amber)', margin: '5px 0 0 3px' };

function EyeToggle({ shown, onToggle, size = 18 }: { shown: boolean; onToggle: () => void; size?: number }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      style={{ color: 'var(--muted-2)', background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}
    >
      {shown ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2M5 12s2.8-6 7-6c1.2 0 2.2.35 3.1.9M19 12s-1.4 3-3.6 4.5" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 6c-4.8 0-8 6-8 6s3.2 6 8 6 8-6 8-6-3.2-6-8-6Z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      )}
    </button>
  );
}

function ValidGlyph({ ok }: { ok: boolean }) {
  return ok
    ? <Check width={13} height={13} style={{ color: 'var(--green)' }} />
    : <span aria-hidden="true" style={{ font: '600 14px var(--body)', color: 'var(--amber)', lineHeight: 1 }}>&times;</span>;
}

export function RegistrationFlow() {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 2;
  const progress = ((step + 1) / totalSteps) * 100;

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const emailValid = form.email.length === 0 || isValidEmail(form.email);

  const update = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      update('profile_photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        update('profile_photo_preview', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.name.trim().length >= 2 && isValidEmail(form.email) && form.phone.length >= 10 && form.password.length >= 6 && form.password === form.confirmPassword;
      case 1: return true;
      default: return false;
    }
  };

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      // Upload the captured profile photo (non-fatal — it's collected here but
      // was previously never sent; the user can still add it later from Profile).
      if (form.profile_photo_preview) {
        try { await api.patch('/profile/photo', { photo: form.profile_photo_preview }); } catch {}
      }
      window.location.href = '/profiling';
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.error || 'Registration failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="ss-screen" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} aria-label="Join Sprint Society">
      <SSAura />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Brand header */}
        <div style={{ padding: '18px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/icons/logo.png" alt="Sprint Society" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
          <div>
            <h1 className="brand" style={{ font: '700 17px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)', lineHeight: 1 }}>
              <b>Sprint</b> Society
            </h1>
            <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', marginTop: 3 }}>World's 1st AI-powered running community</p>
          </div>
        </div>

        {/* Back + step dots + progress */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 12px var(--body)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <ArrowLeft width={14} height={14} />
                Back
              </button>
            ) : <div />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    height: 6, borderRadius: 3, transition: 'all .3s var(--ease)',
                    width: i === step ? 18 : 6,
                    background: i === step
                      ? 'linear-gradient(90deg,var(--accent),var(--accent-2))'
                      : i < step ? 'rgba(249,115,22,.4)' : 'rgba(255,255,255,.12)',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,var(--accent),var(--amber))' }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px 20px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stagger}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              {/* STEP 0: Account Details */}
              {step === 0 && (
                <>
                  <motion.div variants={fadeUp}>
                    <h2 style={{ font: '600 23px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: '0 0 5px' }}>Join the Sprint Society</h2>
                    <p style={{ font: '400 12.5px var(--body)', color: 'var(--muted)', margin: 0 }}>Quick setup — takes 30 seconds</p>
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <GoogleSignInButton
                      text="signup_with"
                      onSuccess={(isNew) => { window.location.href = isNew ? '/profiling' : '/dashboard'; }}
                      onError={(msg) => setError(msg)}
                    />
                  </motion.div>
                  <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
                    <span style={{ font: '500 11px var(--body)', color: 'var(--muted-2)' }}>or sign up with email</span>
                    <span style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
                  </motion.div>
                  <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      style={inputBase}
                      autoFocus
                    />

                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value.replace(/[^0-9+]/g, ''))}
                      maxLength={15}
                      style={inputBase}
                    />

                    <div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          inputMode="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="Email"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          style={{ ...inputBase, borderColor: form.email && !emailValid ? 'rgba(251,191,36,.5)' : 'var(--hair)', paddingRight: 38 }}
                        />
                        {form.email && (
                          <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', display: 'grid', placeItems: 'center' }}>
                            <ValidGlyph ok={emailValid} />
                          </span>
                        )}
                      </div>
                      {form.email && !emailValid && (
                        <p style={errText}>Enter a valid email address</p>
                      )}
                    </div>

                    <div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password (6+ characters)"
                          value={form.password}
                          onChange={(e) => update('password', e.target.value)}
                          style={{ ...inputBase, paddingRight: 44 }}
                        />
                        <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)' }}>
                          <EyeToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                        </span>
                      </div>
                      {form.password && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[1, 2, 3, 4].map(i => (
                              <span key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= passwordStrength.score ? passwordStrength.color : 'rgba(255,255,255,.1)', transition: 'background-color .2s var(--ease)' }} />
                            ))}
                          </div>
                          <p style={{ font: '500 10.5px var(--body)', color: passwordStrength.color, margin: 0 }}>
                            {passwordStrength.label}{form.password.length < 6 ? ' — needs 6+ characters' : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Confirm password"
                          value={form.confirmPassword}
                          onChange={(e) => update('confirmPassword', e.target.value)}
                          style={{
                            ...inputBase, paddingRight: 66,
                            borderColor: form.confirmPassword
                              ? (passwordsMatch ? 'rgba(52,211,153,.5)' : 'rgba(251,191,36,.5)')
                              : 'var(--hair)',
                          }}
                        />
                        <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {form.confirmPassword && <ValidGlyph ok={!!passwordsMatch} />}
                          <EyeToggle shown={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} size={16} />
                        </span>
                      </div>
                      {form.confirmPassword && !passwordsMatch && (
                        <p style={errText}>Passwords don't match</p>
                      )}
                    </div>
                  </motion.div>
                </>
              )}

              {/* STEP 1: Photo Upload */}
              {step === 1 && (
                <>
                  <motion.div variants={fadeUp}>
                    <h2 style={{ font: '600 23px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: '0 0 5px' }}>Add your photo</h2>
                    <p style={{ font: '400 12.5px var(--body)', color: 'var(--muted)', margin: 0 }}>So others can recognize you at events</p>
                  </motion.div>
                  <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, paddingTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label={form.profile_photo_preview ? 'Change photo' : 'Upload photo'}
                      style={{
                        position: 'relative', width: 124, height: 124, borderRadius: '50%', overflow: 'hidden',
                        border: '1px dashed rgba(255,255,255,.25)', background: 'var(--glass)', cursor: 'pointer', padding: 0,
                      }}
                    >
                      {form.profile_photo_preview ? (
                        <>
                          <img src={form.profile_photo_preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span className="opacity-0 hover:opacity-100 active:opacity-100 transition-opacity" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.45)' }}>
                            <span style={{ font: '600 11px var(--body)', color: '#fff' }}>Change</span>
                          </span>
                        </>
                      ) : (
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: '100%' }}>
                          <Camera width={26} height={26} style={{ color: 'var(--muted-2)' }} />
                          <span style={{ font: '500 10.5px var(--body)', color: 'var(--muted-2)' }}>Tap to upload</span>
                        </span>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    {!form.profile_photo_preview && (
                      <button
                        onClick={() => next()}
                        style={{ font: '600 12px var(--body)', color: 'var(--muted-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Skip for now — add later
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <p style={{ font: '500 12.5px var(--body)', color: 'var(--amber)', textAlign: 'center', padding: '0 20px', margin: '0 0 8px' }}>{error}</p>
        )}

        <div style={{ padding: '14px 20px 32px' }}>
          <button
            className="ss-btn ss-btn-primary"
            style={{ height: 50, fontSize: 15, width: '100%' }}
            onClick={next}
            disabled={!canProceed() || submitting}
          >
            {submitting ? 'Creating account…' : step === totalSteps - 1 ? "Let's go" : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
