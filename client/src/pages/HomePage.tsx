import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const cards = [
  {
    title: 'AI Coach',
    description: 'Your plan adapts after every run',
    gradient: 'from-orange-500/15 to-amber-500/5',
    border: 'border-orange-500/20',
  },
  {
    title: 'Get Faster',
    description: 'Science-backed pace zones + race predictions',
    gradient: 'from-emerald-500/15 to-cyan-500/5',
    border: 'border-emerald-500/20',
  },
  {
    title: 'Communities',
    description: 'Find your crew. Join clubs. Run together.',
    gradient: 'from-blue-500/15 to-purple-500/5',
    border: 'border-blue-500/20',
  },
  {
    title: 'Events',
    description: 'Show up. Check in. Earn awards.',
    gradient: 'from-amber-500/15 to-rose-500/5',
    border: 'border-amber-500/20',
  },
];

function CardPreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="space-y-2 text-[10px]">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-bg-secondary/80 rounded-lg px-2.5 py-2 max-w-[90%]">
          <p className="text-zinc-300">Your tempo improved <span className="text-accent font-semibold">12%</span> this month</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }} className="bg-accent/10 rounded-lg px-2.5 py-2 max-w-[75%] ml-auto">
          <p className="text-zinc-300">Should I run easy today?</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 }} className="bg-bg-secondary/80 rounded-lg px-2.5 py-2 max-w-[90%]">
          <p className="text-zinc-300">Yes — recovery day. Keep it under <span className="text-emerald-400 font-semibold">6:00/km</span>.</p>
        </motion.div>
      </div>
    );
  }
  if (index === 1) {
    const zones = [
      { label: 'Easy', pace: '6:15', w: '100%', color: 'bg-emerald-500', delay: 0.5 },
      { label: 'Tempo', pace: '5:02', w: '75%', color: 'bg-orange-500', delay: 0.7 },
      { label: 'Interval', pace: '4:28', w: '55%', color: 'bg-red-500', delay: 0.9 },
      { label: 'Race', pace: '4:45', w: '65%', color: 'bg-amber-500', delay: 1.1 },
    ];
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-[9px] text-zinc-500">
          <span className="uppercase tracking-wider">Pace Zones</span>
          <span className="text-emerald-400 font-mono">VDOT 42</span>
        </div>
        {zones.map(z => (
          <div key={z.label}>
            <div className="flex justify-between text-[9px] mb-0.5">
              <span className="text-zinc-500">{z.label}</span>
              <span className="text-white font-mono">{z.pace}/km</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${z.color}`}
                initial={{ width: '0%' }}
                animate={{ width: z.w }}
                transition={{ delay: z.delay, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (index === 2) {
    const clubs = [
      { name: 'Sprint Social Club', letter: 'S', color: 'bg-blue-500/30', members: 247, delay: 0.5 },
      { name: 'Run Raw', letter: 'R', color: 'bg-purple-500/30', members: 89, delay: 0.7 },
      { name: 'Kolkata Runners', letter: 'K', color: 'bg-emerald-500/30', members: 312, delay: 0.9 },
    ];
    return (
      <div className="space-y-2.5">
        {clubs.map(c => (
          <motion.div key={c.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: c.delay }} className="flex items-center gap-2 text-[10px]">
            <div className={`w-6 h-6 rounded-full ${c.color} flex items-center justify-center text-[9px] font-bold text-white`}>{c.letter}</div>
            <span className="text-zinc-200 flex-1">{c.name}</span>
            <span className="text-zinc-500 text-[9px]">{c.members}</span>
          </motion.div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[9px] text-amber-400 font-mono">THIS SATURDAY</motion.div>
      <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-[11px] text-white font-semibold">Morning Tempo Run</motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-2 text-[9px] text-zinc-500">
        <span>📍 Kolkata</span>
        <span>6:00 AM</span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="flex items-center gap-1 mt-1">
        {['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500'].map((c, i) => (
          <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 + i * 0.08 }} className={`w-4 h-4 rounded-full ${c} border border-bg-primary`} />
        ))}
        <span className="text-[9px] text-emerald-400 ml-1">+23</span>
      </motion.div>
    </div>
  );
}

export function HomePage() {
  const { login } = useAuth();
  const [introDone, setIntroDone] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll cards
  useEffect(() => {
    if (!introDone || showLogin) return;

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (pauseRef.current || !scrollRef.current) return;
        const container = scrollRef.current;
        const cardWidth = container.offsetWidth * 0.82;
        const nextIndex = (activeCard + 1) % cards.length;
        container.scrollTo({ left: nextIndex * cardWidth, behavior: 'smooth' });
      }, 4000);
    };

    startAutoScroll();
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [introDone, showLogin, activeCard]);

  // Track active card on scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.offsetWidth * 0.82;
    const index = Math.round(container.scrollLeft / cardWidth);
    setActiveCard(index);
  }, []);

  // Pause auto-scroll on touch
  const handleTouchStart = () => {
    pauseRef.current = true;
    setTimeout(() => { pauseRef.current = false; }, 8000);
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

  return (
    <LayoutGroup>
      <div className="min-h-screen bg-bg-primary flex flex-col relative overflow-hidden">

        {/* SPLASH — Logo + name centered */}
        <AnimatePresence>
          {!introDone && (
            <motion.div
              className="fixed inset-0 z-[100] bg-bg-primary flex flex-col items-center justify-center gap-3"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.img
                layoutId="app-logo"
                src="/icons/logo.png"
                alt="Sprint Society"
                className="w-16 h-16 rounded-lg object-cover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              />
              <motion.h1
                layoutId="app-title"
                className="font-heading text-2xl font-bold tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                Sprint <span className="text-accent">Society</span>
              </motion.h1>
              <motion.p
                className="text-zinc-500 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                World's 1st AI-powered running community
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN APP — visible after intro */}
        {introDone && (
          <motion.div
            className="min-h-screen flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header — logo top-left + tagline */}
            <header className="sticky top-0 z-50 px-5 py-3 flex items-center gap-2.5 bg-bg-primary/90 backdrop-blur-md border-b border-white/5">
              <motion.img
                layoutId="app-logo"
                src="/icons/logo.png"
                alt="Sprint Society"
                className="w-9 h-9 rounded-lg object-cover"
              />
              <div>
                <motion.h1
                  layoutId="app-title"
                  className="font-heading text-base font-bold tracking-tight leading-none"
                >
                  Sprint <span className="text-accent">Society</span>
                </motion.h1>
                <p className="text-zinc-500 text-[9px] mt-0.5">World's 1st AI-powered running community</p>
              </div>
            </header>

            {/* Content area */}
            <div className="flex-1 flex flex-col justify-center px-0 py-8">
              {!showLogin ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex flex-col gap-6 flex-1"
                >
                  {/* Horizontal scroll cards — taller with app snippet previews */}
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onTouchStart={handleTouchStart}
                    className="flex-1 flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {cards.map((card, i) => (
                      <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                        className={`snap-start shrink-0 w-[80%] max-w-[300px] rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-4 flex flex-col min-h-[280px]`}
                      >
                        <div className="mb-2">
                          <h3 className="font-heading text-base font-bold text-white">{card.title}</h3>
                          <p className="text-zinc-400 text-[11px] mt-0.5">{card.description}</p>
                        </div>
                        {/* App snippet preview */}
                        <div className="flex-1 rounded-xl bg-bg-primary/60 border border-white/5 p-3 overflow-hidden">
                          <CardPreview index={i} />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Dot indicators */}
                  <div className="flex gap-1.5 justify-center">
                    {cards.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === activeCard ? 'w-5 bg-accent' : 'w-1.5 bg-zinc-700'}`}
                      />
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="px-6 space-y-3">
                    <Button fullWidth size="lg" onClick={() => window.location.href = '/register'}>
                      Join Sprint Society
                    </Button>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="w-full py-3 rounded-xl border border-bg-tertiary text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-all"
                    >
                      Already a member? Log in
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 space-y-4"
                >
                  <div className="text-center mb-4">
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
                    <button onClick={() => setShowLogin(false)} className="text-accent text-xs font-medium">← Back</button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <p className="text-zinc-700 text-[10px] text-center pb-6">by Kendu Entertainment</p>
          </motion.div>
        )}
      </div>
    </LayoutGroup>
  );
}
