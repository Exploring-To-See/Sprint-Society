import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const slides = [
  {
    id: 'ai-coach',
    headline: 'Your personal running coach, powered by AI',
    sub: 'Knows your pace, your body, your goals',
    gradient: 'from-orange-500/20 via-transparent to-transparent',
  },
  {
    id: 'training',
    headline: 'Watch your 5K time drop, week after week',
    sub: 'Science-backed training that adapts to YOU',
    gradient: 'from-emerald-500/20 via-transparent to-transparent',
  },
  {
    id: 'community',
    headline: 'Join weekly group runs. Find your tribe.',
    sub: 'Real runners. Real events. Real accountability.',
    gradient: 'from-blue-500/20 via-transparent to-transparent',
  },
  {
    id: 'tiers',
    headline: 'Free. Pro. Elite. Your running, your level.',
    sub: 'From AI training plans to personal nutrition coaching',
    gradient: 'from-amber-500/20 via-transparent to-transparent',
  },
];

function AICoachSlide() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent" />
      <div className="relative w-[85%] max-w-[320px] space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-xs text-zinc-400 font-mono">AI Coach</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-bg-secondary/80 backdrop-blur border border-bg-tertiary rounded-2xl rounded-tl-sm p-4"
        >
          <p className="text-sm text-zinc-300 leading-relaxed">
            Your tempo pace has improved <span className="text-accent font-semibold">12%</span> this month.
            I'm adjusting tomorrow's interval session — you're ready for 4:45/km repeats.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-accent/10 border border-accent/20 rounded-2xl rounded-tr-sm p-4 ml-auto max-w-[80%]"
        >
          <p className="text-sm text-zinc-300">Should I run easy today?</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-bg-secondary/80 backdrop-blur border border-bg-tertiary rounded-2xl rounded-tl-sm p-4"
        >
          <p className="text-sm text-zinc-300 leading-relaxed">
            Yes — your training load is <span className="text-amber-400 font-semibold">elevated</span>.
            Keep it under 6:00/km today. Recovery is part of getting faster.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function TrainingSlide() {
  const zones = [
    { label: 'Easy', pace: '6:15', width: '100%', color: 'bg-emerald-500' },
    { label: 'Tempo', pace: '5:02', width: '80%', color: 'bg-orange-500' },
    { label: 'Interval', pace: '4:28', width: '65%', color: 'bg-red-500' },
    { label: 'Race', pace: '4:45', width: '72%', color: 'bg-amber-500' },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
      <div className="relative w-[85%] max-w-[320px] space-y-5">
        <div className="bg-bg-secondary/80 backdrop-blur border border-bg-tertiary rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Your Pace Zones</span>
            <span className="text-[10px] text-emerald-400 font-mono">VDOT 42</span>
          </div>
          {zones.map((z, i) => (
            <motion.div
              key={z.label}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: z.width }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              className="mb-3 last:mb-0"
            >
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">{z.label}</span>
                <span className="text-white font-mono font-semibold">{z.pace}/km</span>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${z.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-bg-secondary/80 backdrop-blur border border-accent/30 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p className="text-xs text-zinc-400">5K Prediction</p>
            <p className="text-lg font-heading font-bold text-white">24:12 <span className="text-emerald-400 text-xs font-normal">↓ 38s this month</span></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CommunitySlide() {
  const avatars = ['🏃', '🏃‍♀️', '🏃‍♂️', '💪', '🔥'];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent" />
      <div className="relative w-[85%] max-w-[320px] space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-secondary/80 backdrop-blur border border-bg-tertiary rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">📍</div>
            <span className="text-xs text-zinc-400">Saturday, 6:30 AM</span>
            <span className="ml-auto text-[10px] text-emerald-400 font-mono">LIVE</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Morning Tempo Run — Lodhi Garden</h3>
          <p className="text-xs text-zinc-500 mb-3">5K tempo with 1K warm-up/cool-down</p>
          <div className="flex items-center gap-1">
            {avatars.map((a, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="w-7 h-7 rounded-full bg-bg-tertiary border border-bg-primary flex items-center justify-center text-xs -ml-1 first:ml-0"
              >
                {a}
              </motion.div>
            ))}
            <span className="text-[10px] text-zinc-500 ml-2">+18 going</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-bg-secondary/80 backdrop-blur border border-bg-tertiary rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-lg">🏆</div>
            <div className="flex-1">
              <p className="text-xs text-zinc-400">Weekly Challenge</p>
              <p className="text-sm font-semibold text-white">Run 20km this week</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-accent">14.2</p>
              <p className="text-[10px] text-zinc-500">/ 20 km</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-2 px-1"
        >
          <div className="flex -space-x-2">
            {['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500'].map((c, i) => (
              <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-bg-primary`} />
            ))}
          </div>
          <p className="text-xs text-zinc-500">247 runners in your city</p>
        </motion.div>
      </div>
    </div>
  );
}

function TiersSlide() {
  const tiers = [
    { name: 'Base', price: '₹9', color: 'border-zinc-700', features: ['AI training plans', 'Pace zones', 'Weekly insights'] },
    { name: 'Pro', price: '₹99', color: 'border-accent', highlight: true, features: ['AI chat coach', 'Pre/post run check-ins', 'Memory-based coaching'] },
    { name: 'Elite', price: '₹199', color: 'border-amber-500', features: ['Full AI conversations', 'Nutrition coaching', 'Diet tracking'] },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
      <div className="relative w-[90%] max-w-[340px]">
        <div className="flex gap-2">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className={`flex-1 rounded-xl border ${t.color} ${t.highlight ? 'bg-accent/5 scale-[1.03]' : 'bg-bg-secondary/80'} p-3 backdrop-blur`}
            >
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.name}</p>
              <p className="text-lg font-heading font-bold text-white mt-1">{t.price}<span className="text-[10px] text-zinc-500 font-normal">/mo</span></p>
              <div className="mt-3 space-y-1.5">
                {t.features.map(f => (
                  <p key={f} className="text-[9px] text-zinc-400 flex items-start gap-1">
                    <span className="text-emerald-400 mt-px">✓</span> {f}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

const slideComponents = [AICoachSlide, TrainingSlide, CommunitySlide, TiersSlide];

export function HomePage() {
  const { login } = useAuth();
  const [current, setCurrent] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const SlideComponent = slideComponents[current];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top: Logo + Brand */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-center gap-2.5">
        <img src="/icons/logo.png" alt="Sprint Society" className="w-10 h-10 rounded-lg object-cover" />
        <h1 className="font-heading text-xl font-bold tracking-tight">
          Sprint <span className="text-accent">Society</span>
        </h1>
      </div>

      {/* Middle: Slides (visual + text separated) */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative flex-1 min-h-[280px] max-h-[45vh] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <SlideComponent />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide text — below the visual, not overlapping */}
        <div className="px-6 pt-4 pb-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <h2 className="font-heading text-xl font-bold text-white leading-tight">
                {slides[current].headline}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">{slides[current].sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-4 justify-center">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-accent' : 'w-1.5 bg-zinc-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Signup + Login */}
      <div className="px-6 pb-8 pt-4">
        <div className="w-full max-w-sm mx-auto space-y-3">
          {!showLogin ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <Button fullWidth size="lg" onClick={() => window.location.href = '/register'}>
                Join Sprint Society
              </Button>

              <button
                onClick={() => setShowLogin(true)}
                className="w-full py-3 rounded-xl border border-bg-tertiary text-zinc-300 text-sm font-medium hover:border-zinc-600 hover:text-white transition-all"
              >
                Already a member? Log in
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                autoFocus
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <Button fullWidth size="lg" onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </Button>
              <div className="flex justify-between">
                <Link to="/forgot-password" className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">Forgot password?</Link>
                <button onClick={() => setShowLogin(false)} className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">← Back</button>
              </div>
            </motion.div>
          )}

          <p className="text-zinc-700 text-[10px] text-center pt-2">by Kendu Entertainment</p>
        </div>
      </div>
    </div>
  );
}
