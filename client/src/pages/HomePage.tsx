import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const cards = [
  {
    title: 'AI Coach',
    description: 'Your plan adapts after every run',
    gradient: 'from-orange-500/25 to-amber-500/10',
    border: 'border-orange-500/30',
  },
  {
    title: 'Get Faster',
    description: 'Science-backed pace zones + race predictions',
    gradient: 'from-emerald-500/25 to-cyan-500/10',
    border: 'border-emerald-500/30',
  },
  {
    title: 'Communities',
    description: 'Find your crew. Join clubs. Run together.',
    gradient: 'from-blue-500/25 to-purple-500/10',
    border: 'border-blue-500/30',
  },
  {
    title: 'Events',
    description: 'Show up. Check in. Earn awards.',
    gradient: 'from-amber-500/25 to-rose-500/10',
    border: 'border-amber-500/30',
  },
];

function CardPreview({ index, isActive }: { index: number; isActive: boolean }) {
  if (!isActive) return <div className="h-full" />;

  if (index === 0) {
    return (
      <div className="flex flex-col h-full text-[10px]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-[8px]">🔥</div>
          <span className="text-zinc-400 text-[9px] font-medium">The Energizer</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex-1 space-y-1.5 overflow-hidden">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-bg-tertiary/60 rounded-lg px-2 py-1.5 max-w-[92%]">
            <p className="text-zinc-300 leading-relaxed">Your tempo pace improved <span className="text-accent font-bold">12%</span> this month. Adjusting intervals.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-accent/10 border border-accent/20 rounded-lg px-2 py-1.5 max-w-[70%] ml-auto">
            <p className="text-zinc-200">Should I run easy today?</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="bg-bg-tertiary/60 rounded-lg px-2 py-1.5 max-w-[92%]">
            <p className="text-zinc-300 leading-relaxed">Yes — load is <span className="text-amber-400 font-semibold">elevated</span>. Stay under 6:00/km today! 🔥</p>
          </motion.div>
        </div>
      </div>
    );
  }
  if (index === 1) {
    const zones = [
      { label: 'Easy', pace: '6:15', w: '100%', color: 'bg-emerald-500', delay: 0.3 },
      { label: 'Tempo', pace: '5:02', w: '75%', color: 'bg-orange-500', delay: 0.5 },
      { label: 'Interval', pace: '4:28', w: '55%', color: 'bg-red-500', delay: 0.7 },
      { label: 'Race', pace: '4:45', w: '65%', color: 'bg-amber-500', delay: 0.9 },
    ];
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Pace Zones</span>
          <span className="text-[9px] text-emerald-400 font-mono">VDOT 42</span>
        </div>
        <div className="space-y-2 flex-1">
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
          <span className="text-[9px] text-zinc-500">5K Prediction:</span>
          <span className="text-[10px] text-white font-bold font-mono">24:12</span>
          <span className="text-[9px] text-emerald-400">↓ 38s</span>
        </motion.div>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="flex flex-col h-full">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-1 mb-2">
          {['All', 'Run Clubs', 'Social'].map((cat, i) => (
            <span key={cat} className={`px-2 py-0.5 rounded-full text-[8px] font-semibold ${i === 0 ? 'bg-accent text-black' : 'bg-bg-tertiary text-zinc-500'}`}>{cat}</span>
          ))}
        </motion.div>
        <div className="flex-1 space-y-2">
          {[
            { name: 'Sprint Social Club', members: 247, color: 'from-blue-500 to-purple-600', verified: true },
            { name: 'Kolkata Runners', members: 312, color: 'from-emerald-500 to-cyan-600' },
            { name: 'Sunrise Runners', members: 89, color: 'from-orange-500 to-red-600' },
          ].map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.15 }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-bg-tertiary/40">
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-[8px] font-bold text-white`}>{c.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-white font-medium truncate">{c.name}</p>
                <p className="text-[8px] text-zinc-500">{c.members} members</p>
              </div>
              {c.verified && <span className="text-[8px] text-accent">✓</span>}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-1 mb-2">
        {['All', 'Runs', 'Social'].map((f, i) => (
          <span key={f} className={`px-2 py-0.5 rounded-full text-[8px] font-semibold ${i === 0 ? 'bg-accent text-black' : 'bg-bg-tertiary text-zinc-500'}`}>{f}</span>
        ))}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex-1 rounded-lg bg-bg-tertiary/40 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] text-amber-400 font-mono font-semibold">UPCOMING</span>
          <span className="text-[8px] text-emerald-400">Going ✓</span>
        </div>
        <p className="text-[10px] text-white font-semibold">Morning Tempo Run</p>
        <div className="flex items-center gap-2 text-[8px] text-zinc-500 mt-1">
          <span>📍 Kolkata</span>
          <span>Sat 6:00 AM</span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500'].map((c, i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 + i * 0.06 }} className={`w-4 h-4 rounded-full ${c} border border-bg-primary`} />
          ))}
          <span className="text-[8px] text-zinc-400 ml-1">+23</span>
        </div>
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
  const pauseRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!introDone || showLogin) return;
    const interval = setInterval(() => {
      if (pauseRef.current || !scrollRef.current) return;
      const container = scrollRef.current;
      const cardWidth = container.offsetWidth * 0.82;
      const nextIndex = (activeCard + 1) % cards.length;
      container.scrollTo({ left: nextIndex * cardWidth, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(interval);
  }, [introDone, showLogin, activeCard]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.offsetWidth * 0.82;
    const index = Math.round(container.scrollLeft / cardWidth);
    setActiveCard(index);
  }, []);

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
    <div className="min-h-screen bg-bg-primary flex flex-col relative overflow-hidden">

      {/* SPLASH */}
      <AnimatePresence>
        {!introDone && (
          <motion.div
            className="fixed inset-0 z-[100] bg-bg-primary flex flex-col items-center justify-center gap-3"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src="/icons/logo.png"
              alt="Sprint Society"
              className="w-16 h-16 rounded-lg object-cover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <motion.h1
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

      {/* MAIN */}
      {introDone && (
        <motion.div
          className="min-h-screen flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand — inside hero, overlaid top-left, no panel */}
          <div className="absolute top-0 left-0 right-0 z-20 px-5 pt-4 flex items-center gap-2.5">
            <img src="/icons/logo.png" alt="Sprint Society" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight leading-none text-white drop-shadow-lg">
                Sprint <span className="text-accent">Society</span>
              </h1>
              <p className="text-white/60 text-[10px] mt-0.5 drop-shadow">World's 1st AI-powered running community</p>
            </div>
          </div>

            {!showLogin ? (
              <div className="flex-1 flex flex-col">
                {/* HERO — Photo with brand overlaid */}
                <div className="relative h-[28vh] min-h-[160px] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80&auto=format&fit=crop"
                    alt="Runners"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent" />
                </div>

                {/* Feature cards */}
                <div className="flex-1 flex flex-col gap-4 pt-3">
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onTouchStart={handleTouchStart}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {cards.map((card, i) => (
                      <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                        className={`snap-start shrink-0 w-[80%] max-w-[300px] rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-4 flex flex-col min-h-[240px]`}
                      >
                        <div className="mb-2">
                          <h3 className="font-heading text-lg font-bold text-white tracking-tight">{card.title}</h3>
                          <p className="text-zinc-400 text-[11px] mt-0.5">{card.description}</p>
                        </div>
                        <div className="flex-1 rounded-xl bg-bg-primary/80 backdrop-blur border border-white/10 p-3 overflow-hidden">
                          <CardPreview index={i} isActive={activeCard === i} />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Dots */}
                  <div className="flex gap-1.5 justify-center">
                    {cards.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeCard ? 'w-5 bg-accent' : 'w-1.5 bg-zinc-700'}`} />
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="px-6 pb-8 space-y-3">
                    <Button fullWidth size="lg" onClick={() => window.location.href = '/register'}>
                      Join Sprint Society
                    </Button>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="w-full py-3 rounded-xl border border-bg-tertiary text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-all"
                    >
                      Already a member? Log in
                    </button>
                    <p className="text-zinc-700 text-[10px] text-center pt-2">by Kendu Entertainment</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center px-6 pb-8">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto space-y-4">
                  <div className="flex flex-col items-center mb-6">
                    <img src="/icons/logo.png" alt="Sprint Society" className="w-12 h-12 rounded-lg object-cover mb-3" />
                    <h2 className="font-heading text-xl font-bold text-white">Welcome back</h2>
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
              </div>
            )}
          </motion.div>
        )}
      </div>
  );
}
