import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
    headline: 'Base. Pro. Your running, your level.',
    sub: 'From silent AI training to personal chat coaching',
    gradient: 'from-amber-500/20 via-transparent to-transparent',
  },
];

function AICoachSlide() {
  const dnaStats = [
    { label: 'VO2max', value: '48.2', unit: 'ml/kg/min', color: 'text-emerald-400', delay: 0.3 },
    { label: 'Tier', value: 'Advanced', unit: '', color: 'text-accent', delay: 0.5 },
    { label: '5K Prediction', value: '22:14', unit: '', color: 'text-orange-400', delay: 0.7 },
    { label: 'Readiness', value: '87', unit: '/100', color: 'text-blue-400', delay: 0.9 },
  ];

  const tags = ['Tempo Lover', 'Morning Runner', 'Hill Crusher', 'Streak Machine'];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/8 via-transparent to-transparent" />
      {/* Scanning line animation */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        initial={{ top: '10%' }}
        animate={{ top: '90%' }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative w-[85%] max-w-[320px]">
        {/* DNA Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-bg-secondary/90 backdrop-blur-lg border border-accent/20 rounded-2xl p-5 shadow-xl shadow-accent/5"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-bg-tertiary/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-accent flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Your Running DNA</p>
              <motion.p
                className="text-[10px] text-accent font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.7, 1] }}
                transition={{ duration: 1.5, delay: 0.2 }}
              >
                AI SCAN COMPLETE
              </motion.p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {dnaStats.map(stat => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay, duration: 0.4 }}
                className="bg-bg-primary/60 rounded-lg p-2.5"
              >
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-lg font-heading font-bold ${stat.color} leading-tight`}>
                  {stat.value}<span className="text-[10px] text-zinc-500 font-normal">{stat.unit}</span>
                </p>
              </motion.div>
            ))}
          </div>

          {/* Personality tags */}
          <motion.div
            className="flex flex-wrap gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {tags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                className="px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-[9px] text-accent font-medium"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
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
          <h3 className="text-sm font-semibold text-white mb-1">Morning Tempo Run — Kolkata</h3>
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
    { name: 'Base', price: '₹9', color: 'border-zinc-700', features: ['AI training plans', 'Pace zones', 'Weekly AI summary', 'HR zones', 'Events & communities'] },
    { name: 'Pro', price: '₹99', color: 'border-accent', highlight: true, features: ['AI chat coach', 'Adaptive training', 'Coach remembers you', 'Transformation plans', 'Create communities'] },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
      <div className="relative w-[85%] max-w-[320px]">
        <div className="flex gap-3">
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
  const [paused, setPaused] = useState(false);
  const [introPhase, setIntroPhase] = useState(0); // 0=logo center, 1=logo moving up, 2=content visible
  const pauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase(1), 1000);
    const t2 = setTimeout(() => setIntroPhase(2), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrent(index);
    setPaused(true);
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    pauseTimeout.current = setTimeout(() => setPaused(false), 8000);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (paused || showLogin || introPhase < 2) return;
    const timer = setInterval(nextSlide, 4500);
    return () => clearInterval(timer);
  }, [nextSlide, paused, showLogin, introPhase]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50) {
      goToSlide((current + 1) % slides.length);
    } else if (info.offset.x > 50) {
      goToSlide((current - 1 + slides.length) % slides.length);
    }
  };

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
    <div className="min-h-screen bg-bg-primary flex flex-col relative overflow-hidden">
      {/* Ambient background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[-20%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-accent/6 to-emerald-500/4 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-blue-600/5 to-cyan-400/3 blur-3xl"
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* Cinematic intro overlay — logo pops center then moves to header */}
      <AnimatePresence>
        {introPhase === 0 && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <img src="/icons/logo.png" alt="Sprint Society" className="w-20 h-20 rounded-full object-cover shadow-2xl shadow-accent/20 border-2 border-accent/20" />
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                Sprint <span className="text-accent">Society</span>
              </h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed top-left header (appears after intro) */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-5 py-3.5 flex items-center gap-3 bg-bg-primary/85 backdrop-blur-md border-b border-white/5"
        initial={{ opacity: 0, y: -20 }}
        animate={introPhase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.5, delay: introPhase === 1 ? 0.2 : 0 }}
      >
        <img src="/icons/logo.png" alt="Sprint Society" className="w-10 h-10 rounded-full object-cover" />
        <div>
          <h1 className="font-heading text-lg font-bold tracking-tight leading-none">
            Sprint <span className="text-accent">Society</span>
          </h1>
          <p className="text-zinc-500 text-[10px] mt-0.5">AI-powered running community</p>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-[68px]" />

      {/* Cinematic intro → then slides */}
      {!showLogin && (
        <motion.div
          className="flex-1 flex flex-col min-h-0 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {/* Slide visual area — swipeable */}
          <motion.div
            className="relative flex-1 min-h-[260px] max-h-[44vh] overflow-hidden touch-pan-y"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-0"
              >
                <SlideComponent />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Slide text + dots */}
          <div className="px-6 pt-4 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-center"
              >
                <h2 className="font-heading text-xl font-bold text-white leading-tight">
                  {slides[current].headline}
                </h2>
                <p className="text-sm text-zinc-400 mt-1.5">{slides[current].sub}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-2 mt-4 justify-center">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-7 bg-accent' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom: Signup + Login */}
      <motion.div
        className={`px-6 pb-8 relative z-10 ${showLogin ? 'pt-8 flex-1 flex flex-col justify-center' : 'pt-5'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <div className="w-full max-w-sm mx-auto space-y-3">
          {!showLogin ? (
            <div className="space-y-3">
              <Button fullWidth size="lg" onClick={() => window.location.href = '/register'}>
                Join Sprint Society
              </Button>

              <button
                onClick={() => setShowLogin(true)}
                className="w-full py-3.5 rounded-xl border border-bg-tertiary text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white active:scale-[0.98] transition-all"
              >
                Already a member? Log in
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-heading text-xl font-semibold text-white">Welcome back</h2>
                <p className="text-zinc-500 text-sm mt-1">Log in to continue your journey</p>
              </div>
              <input
                type="text"
                placeholder="Email or phone number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-accent/40 focus:outline-none transition-colors"
                autoFocus
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-accent/40 focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <Button fullWidth size="lg" onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </Button>
              <div className="flex justify-between pt-1">
                <Link to="/forgot-password" className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">Forgot password?</Link>
                <button onClick={() => setShowLogin(false)} className="text-accent text-xs font-medium hover:text-accent/80 transition-colors">← Back</button>
              </div>
            </motion.div>
          )}

          <p className="text-zinc-700 text-[10px] text-center pt-3">by Kendu Entertainment</p>
        </div>
      </motion.div>
    </div>
  );
}
