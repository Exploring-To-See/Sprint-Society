import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  invite_code: string;
  profile_photo: File | null;
  profile_photo_preview: string;
}

const INITIAL: FormData = {
  name: '', email: '', phone: '', password: '', confirmPassword: '', invite_code: '',
  profile_photo: null, profile_photo_preview: '',
};

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-blue-400' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
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

export function RegistrationFlow() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => ({
    ...INITIAL,
    invite_code: searchParams.get('code')?.toUpperCase() || '',
  }));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stravaConnecting, setStravaConnecting] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
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

  const handleStravaConnect = async () => {
    setStravaConnecting(true);
    try {
      const res = await fetch('/api/strava/auth');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setStravaConnecting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.name.trim().length >= 2 && isValidEmail(form.email) && form.phone.length >= 10 && form.password.length >= 6 && form.password === form.confirmPassword && form.invite_code.length >= 3;
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
        invite_code: form.invite_code,
        profile_photo: form.profile_photo,
      });
      navigate('/profiling');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Brand header */}
      <div className="px-5 pt-5 pb-2 flex items-center gap-2.5">
        <img src="/icons/logo.png" alt="Sprint Society" className="w-9 h-9 rounded-lg object-cover" />
        <div>
          <h1 className="font-heading text-lg font-bold tracking-tight leading-none">Sprint <span className="text-accent">Society</span></h1>
          <p className="text-zinc-500 text-[10px] mt-0.5">World's 1st AI-powered running community</p>
        </div>
      </div>
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors active:scale-95">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[12px] font-medium">Back</span>
            </button>
          ) : <div />}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-[6px] rounded-full transition-all duration-300 ${
                i === step ? 'w-5 bg-accent' : i < step ? 'w-[6px] bg-accent/40' : 'w-[6px] bg-bg-tertiary'
              }`} />
            ))}
          </div>
        </div>
        <div className="h-[2px] rounded-full bg-bg-tertiary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-gold"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      <div className="flex-1 px-5 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stagger}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
            className="space-y-6"
          >
            {/* STEP 0: Account Details */}
            {step === 0 && (
              <>
                <motion.div variants={fadeUp}>
                  <h2 className="font-heading text-2xl font-bold mb-1">Join the Sprint Society</h2>
                  <p className="text-zinc-500 text-sm">Quick setup — takes 30 seconds</p>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                    autoFocus
                  />

                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value.replace(/[^0-9+]/g, ''))}
                    maxLength={15}
                    className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                  />

                  <div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={`w-full px-4 py-3.5 rounded-xl bg-bg-secondary border text-white placeholder:text-zinc-600 focus:outline-none transition-colors ${
                          form.email && !emailValid ? 'border-red-500/50 focus:border-red-500' : 'border-bg-tertiary focus:border-zinc-500'
                        }`}
                      />
                      {form.email && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                          {emailValid ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}
                        </span>
                      )}
                    </div>
                    {form.email && !emailValid && (
                      <p className="text-[10px] text-red-400 mt-1 ml-1">Enter a valid email address</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password (6+ characters)"
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        className="w-full px-4 py-3.5 pr-12 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 3l14 14M8.5 8.5a2 2 0 002.9 2.9M4 10s2.5-5 6-5c1 0 1.8.3 2.5.7M16 10s-1.2 2.5-3 3.7"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M10 5C6 5 3 10 3 10s3 5 7 5 7-5 7-5-3-5-7-5z"/>
                            <circle cx="10" cy="10" r="2.5"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors ${
                              i <= passwordStrength.score ? passwordStrength.color : 'bg-bg-tertiary'
                            }`} />
                          ))}
                        </div>
                        <p className={`text-[10px] font-medium ${
                          passwordStrength.score <= 1 ? 'text-red-400' :
                          passwordStrength.score <= 2 ? 'text-amber-400' :
                          passwordStrength.score <= 3 ? 'text-blue-400' : 'text-emerald-400'
                        }`}>
                          {passwordStrength.label}{form.password.length < 6 ? ' — needs 6+ characters' : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={form.confirmPassword}
                        onChange={(e) => update('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-3.5 pr-12 rounded-xl bg-bg-secondary border text-white placeholder:text-zinc-600 focus:outline-none transition-colors ${
                          form.confirmPassword && !passwordsMatch ? 'border-red-500/50' : form.confirmPassword && passwordsMatch ? 'border-emerald-500/50' : 'border-bg-tertiary focus:border-zinc-500'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {form.confirmPassword && (
                          <span className="text-sm">
                            {passwordsMatch ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          {showConfirm ? (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M3 3l14 14M8.5 8.5a2 2 0 002.9 2.9"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M10 5C6 5 3 10 3 10s3 5 7 5 7-5 7-5-3-5-7-5z"/>
                              <circle cx="10" cy="10" r="2.5"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {form.confirmPassword && !passwordsMatch && (
                      <p className="text-[10px] text-red-400 mt-1 ml-1">Passwords don't match</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Invite code"
                        value={form.invite_code}
                        onChange={(e) => update('invite_code', e.target.value.toUpperCase())}
                        className="w-full px-4 py-3.5 pr-10 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors font-mono tracking-wider"
                      />
                      {form.invite_code.length >= 3 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-accent">🎟️</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-700 mt-1 ml-1">Got a code from Sprint Society? Enter it here</p>
                  </div>
                </motion.div>
              </>
            )}

            {/* STEP 1: Photo Upload */}
            {step === 1 && (
              <>
                <motion.div variants={fadeUp}>
                  <h2 className="font-heading text-2xl font-bold mb-1">Add your photo</h2>
                  <p className="text-zinc-500 text-sm">So others can recognize you at events</p>
                </motion.div>
                <motion.div variants={fadeUp} className="flex flex-col items-center space-y-5 pt-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-zinc-600 hover:border-accent/50 transition-colors cursor-pointer group"
                  >
                    {form.profile_photo_preview ? (
                      <img src={form.profile_photo_preview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-bg-secondary group-hover:bg-bg-tertiary transition-colors">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[10px] text-zinc-600 mt-2">Tap to upload</span>
                      </div>
                    )}
                    {form.profile_photo_preview && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white font-medium">Change</span>
                      </div>
                    )}
                  </div>
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
                      className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors"
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
        <p className="text-red-400 text-sm text-center px-5 mb-2">{error}</p>
      )}

      <div className="px-5 pb-8 pt-4">
        <Button
          onClick={next}
          disabled={!canProceed() || submitting}
          fullWidth
          size="lg"
        >
          {submitting ? 'Creating account...' : step === totalSteps - 1 ? "Let's go" : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
