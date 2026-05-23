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
  },
  {
    id: 'training',
    headline: 'Watch your 5K time drop, week after week',
    sub: 'Science-backed training that adapts to YOU',
  },
  {
    id: 'community',
    headline: 'Join weekly group runs. Find your tribe.',
    sub: 'Real runners. Real events. Real accountability.',
  },
  {
    id: 'events',
    headline: 'Real events. Real connections.',
    sub: 'Coffee runs, tempo sessions, community meetups — every week.',
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
      <div className="relative w-[85%] max-w-[320px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-bg-secondary/90 backdrop-blur border border-accent/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-bg-tertiary/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-accent flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Your Running DNA</p>
              <motion.p className="text-[10px] text-accent font-mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                AI SCAN COMPLETE
              </motion.p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {dnaStats.map(stat => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay, duration: 0.3 }}
                className="bg-bg-primary/60 rounded-lg p-2.5"
              >
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-lg font-heading font-bold ${stat.color} leading-tight`}>
                  {stat.value}<span className="text-[10px] text-zinc-500 font-normal">{stat.unit}</span>
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div className="flex flex-wrap gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
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
    { label: 'Easy', pace: '6:15', color: 'bg-emerald-500', delay: 0.2 },
    { label: 'Tempo', pace: '5:02', color: 'bg-orange-500', delay: 0.35 },
    { label: 'Interval', pace: '4:28', color: 'bg-red-500', delay: 0.5 },
    { label: 'Race', pace: '4:45', color: 'bg-amber-500', delay: 0.65 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-[85%] max-w-[320px] space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-bg-secondary/90 backdrop-blur border border-bg-tertiary rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Your Pace Zones</span>
            <span className="text-[10px] text-emerald-400 font-mono">VDOT 42</span>
          </div>
          {zones.map(z => (
            <div key={z.label} className="mb-3 last:mb-0">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">{z.label}</span>
                <span className="text-white font-mono font-semibold">{z.pace}/km</span>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${z.color}`}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ delay: z.delay, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-bg-secondary/90 backdrop-blur border border-accent/30 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p className="text-xs text-zinc-400">5K Prediction</p>
            <p className="text-lg font-heading font-bold text-white">24:12 <span className="text-emerald-400 text-xs font-normal">-38s this month</span></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CommunitySlide() {
  const members = [
    { name: 'Arjun', level: 12, streak: '14d' },
    { name: 'Priya', level: 8, streak: '7d' },
    { name: 'Rohit', level: 15, streak: '21d' },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-[85%] max-w-[320px] space-y-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-bg-secondary/90 backdrop-blur border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">S</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Sprint Social Club</p>
              <p className="text-[10px] text-zinc-500">247 members</p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[9px] text-emerald-400 font-mono">ACTIVE</span>
          </div>
          <div className="space-y-2">
            {members.map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.12 }} className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">{m.name[0]}</div>
                <span className="text-xs text-zinc-300 flex-1">{m.name}</span>
                <span className="text-[9px] text-zinc-500">Lv.{m.level}</span>
                <span className="text-[9px] text-orange-400">{m.streak}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-bg-secondary/90 backdrop-blur border border-bg-tertiary rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm">🏆</div>
          <div className="flex-1">
            <p className="text-[10px] text-zinc-500">This Week</p>
            <p className="text-xs font-semibold text-white">Run 20km together</p>
          </div>
          <p className="text-sm font-bold text-accent">14.2<span className="text-[9px] text-zinc-500">/20</span></p>
        </motion.div>
      </div>
    </div>
  );
}

function EventsSlide() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-[85%] max-w-[320px] space-y-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-bg-secondary/90 backdrop-blur border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-amber-400 font-mono font-semibold">UPCOMING</span>
            <span className="ml-auto text-[10px] text-zinc-500">This Saturday</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Morning Tempo Run</h3>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400 mb-3">
            <span>📍 Kolkata</span>
            <span>⏰ 6:00 AM</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500'].map((c, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.08 }} className={`w-6 h-6 rounded-full ${c} border-2 border-bg-secondary`} />
              ))}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">+23 going</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-bg-secondary/90 backdrop-blur border border-bg-tertiary rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Last Event</p>
            <p className="text-xs font-semibold text-white">Coffee Run — 18 showed up</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex items-center justify-center gap-6 pt-1">
          <div className="text-center">
            <p className="text-lg font-heading font-bold text-white">12</p>
            <p className="text-[9px] text-zinc-500">Events/month</p>
          </div>
          <div className="w-px h-8 bg-bg-tertiary" />
          <div className="text-center">
            <p className="text-lg font-heading font-bold text-accent">89%</p>
            <p className="text-[9px] text-zinc-500">Show-up rate</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const slideComponents = [AICoachSlide, TrainingSlide, CommunitySlide, EventsSlide];

export function HomePage() {
  const { login } = useAuth();
  const [current, setCurrent] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const pauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 2200);
    return () => clearTimeout(t);
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
    if (paused || showLogin || !introDone) return;
    const timer = setInterval(nextSlide, 4500);
    return () => clearInterval(timer);
  }, [nextSlide, paused, showLogin, introDone]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50) goToSlide((current + 1) % slides.length);
    else if (info.offset.x > 50) goToSlide((current - 1 + slides.length) % slides.length);
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
      {/* INTRO SPLASH — logo + name centered, fades out after 2s */}
      <AnimatePresence>
        {!introDone && (
          <motion.div
            className="fixed inset-0 z-[100] bg-bg-primary flex flex-col items-center justify-center gap-4"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src="/icons/logo.png"
              alt="Sprint Society"
              className="w-20 h-20 rounded-2xl object-cover"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
            <motion.h1
              className="font-heading text-2xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Sprint <span className="text-accent">Society</span>
            </motion.h1>
            <motion.p
              className="text-zinc-500 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              AI-powered running community
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT — only visible after intro */}
      {introDone && (
        <motion.div
          className="min-h-screen flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header — fixed top-left */}
          <header className="sticky top-0 z-50 px-5 py-3 flex items-center gap-3 bg-bg-primary/90 backdrop-blur-md border-b border-white/5">
            <img src="/icons/logo.png" alt="Sprint Society" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <h1 className="font-heading text-base font-bold tracking-tight leading-none">
                Sprint <span className="text-accent">Society</span>
              </h1>
              <p className="text-zinc-600 text-[9px] mt-0.5">AI-powered running community</p>
            </div>
          </header>

          {/* Slides */}
          {!showLogin && (
            <div className="flex-1 flex flex-col">
              <motion.div
                className="relative flex-1 min-h-[280px] max-h-[46vh] overflow-hidden"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={handleDragEnd}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <SlideComponent />
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Slide headline + dots */}
              <div className="px-6 pt-4 pb-3 text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="font-heading text-lg font-bold text-white leading-tight">{slides[current].headline}</h2>
                    <p className="text-sm text-zinc-400 mt-1">{slides[current].sub}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex gap-2 mt-3 justify-center">
                  {slides.map((_, i) => (
                    <button key={i} onClick={() => goToSlide(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-accent' : 'w-1.5 bg-zinc-700'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CTA / Login */}
          <div className={`px-6 pb-8 ${showLogin ? 'flex-1 flex flex-col justify-center' : 'pt-2'}`}>
            <div className="w-full max-w-sm mx-auto space-y-3">
              {!showLogin ? (
                <div className="space-y-3">
                  <Button fullWidth size="lg" onClick={() => window.location.href = '/register'}>
                    Join Sprint Society
                  </Button>
                  <button onClick={() => setShowLogin(true)} className="w-full py-3 rounded-xl border border-bg-tertiary text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-all">
                    Already a member? Log in
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="text-center mb-2">
                    <h2 className="font-heading text-xl font-semibold text-white">Welcome back</h2>
                    <p className="text-zinc-500 text-sm mt-1">Log in to continue your journey</p>
                  </div>
                  <input type="text" placeholder="Email or phone number" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-accent/40 focus:outline-none transition-colors" autoFocus />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-accent/40 focus:outline-none transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <Button fullWidth size="lg" onClick={handleLogin} disabled={loading}>
                    {loading ? 'Logging in...' : 'Log in'}
                  </Button>
                  <div className="flex justify-between pt-1">
                    <Link to="/forgot-password" className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">Forgot password?</Link>
                    <button onClick={() => setShowLogin(false)} className="text-accent text-xs font-medium">← Back</button>
                  </div>
                </motion.div>
              )}
              <p className="text-zinc-700 text-[10px] text-center pt-3">by Kendu Entertainment</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
