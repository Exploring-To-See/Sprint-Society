import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const cards = [
  { title: 'AI Coach', description: 'Your plan adapts after every run.' },
  { title: 'Get Faster', description: 'Science-backed pace zones & predictions.' },
  { title: 'Communities', description: 'Find your crew. Join clubs. Run together.' },
  { title: 'Events', description: 'Show up. Check in. Earn awards.' },
];

function CardInfographic({ index }: { index: number }) {
  if (index === 0) {
    // AI Coach — performance chart
    return (
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-[10px] text-zinc-500">This Month</p>
            <p className="text-xl font-heading font-bold text-accent">+12%</p>
            <p className="text-[10px] text-zinc-600">Pace Improvement</p>
          </div>
          <div className="text-right">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg font-heading font-bold text-white"
            >
              5'21"/km
            </motion.p>
            <p className="text-[10px] text-zinc-500">Today</p>
          </div>
        </div>
        {/* Mini chart */}
        <div className="flex-1 flex items-end gap-[3px] pt-2">
          {[40, 55, 45, 60, 50, 70, 65, 75, 72, 80, 78, 85].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
              className="flex-1 rounded-sm bg-gradient-to-t from-accent/80 to-accent/30"
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] text-zinc-600">5'50"/km</span>
          <span className="text-[9px] text-zinc-600">Last Month</span>
        </div>
      </div>
    );
  }
  if (index === 1) {
    // Training — pace zones with progress
    const zones = [
      { label: 'Easy', pace: '6:15/km', pct: 100, color: 'bg-emerald-500' },
      { label: 'Tempo', pace: '5:02/km', pct: 78, color: 'bg-accent' },
      { label: 'Interval', pace: '4:28/km', pct: 58, color: 'bg-red-500' },
      { label: 'Race', pace: '4:45/km', pct: 68, color: 'bg-amber-500' },
    ];
    return (
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Your Pace Zones</span>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold">VDOT 42</span>
        </div>
        <div className="space-y-3 flex-1 justify-center flex flex-col">
          {zones.map((z, i) => (
            <div key={z.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-zinc-400">{z.label}</span>
                <span className="text-[11px] text-white font-mono font-semibold">{z.pace}</span>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${z.color}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${z.pct}%` }}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-between pt-3 mt-2 border-t border-white/5"
        >
          <span className="text-[10px] text-zinc-500">5K Prediction</span>
          <span className="text-sm font-heading font-bold text-white">24:12 <span className="text-emerald-400 text-[10px]">↓38s</span></span>
        </motion.div>
      </div>
    );
  }
  if (index === 2) {
    // Communities
    const clubs = [
      { name: 'Sprint Social Club', members: '247', color: 'from-accent to-orange-600', verified: true },
      { name: 'Kolkata Runners', members: '312', color: 'from-emerald-500 to-cyan-600', verified: false },
      { name: 'Sunrise Runners', members: '89', color: 'from-amber-500 to-orange-600', verified: false },
    ];
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex gap-2 mb-3">
          {['All', 'Run Clubs', 'Social'].map((c, i) => (
            <span key={c} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${i === 0 ? 'bg-accent text-black' : 'bg-bg-tertiary text-zinc-500'}`}>{c}</span>
          ))}
        </div>
        <div className="space-y-2.5 flex-1">
          {clubs.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-tertiary/50"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-[11px] font-bold text-white`}>{c.name[0]}</div>
              <div className="flex-1">
                <p className="text-[12px] text-white font-medium">{c.name}</p>
                <p className="text-[10px] text-zinc-500">{c.members} members</p>
              </div>
              {c.verified && <span className="text-[10px] text-accent">✓</span>}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  // Events
  return (
    <div className="flex-1 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-1 rounded-xl bg-bg-tertiary/50 p-3.5"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-accent font-mono font-semibold">UPCOMING</span>
          <span className="text-[10px] text-emerald-400 font-medium">Going ✓</span>
        </div>
        <p className="text-[13px] text-white font-semibold mb-1">Morning Tempo Run</p>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500 mb-3">
          <span>📍 Kolkata</span>
          <span>Sat 6:00 AM</span>
        </div>
        <div className="flex items-center gap-1">
          {['bg-accent', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500'].map((c, i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.06 }} className={`w-5 h-5 rounded-full ${c} border-2 border-bg-primary`} />
          ))}
          <span className="text-[10px] text-zinc-400 ml-1">+23 going</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center justify-center gap-6 pt-3"
      >
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
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!introDone || showLogin) return;
    autoRef.current = setInterval(() => {
      setActiveCard(prev => (prev + 1) % cards.length);
    }, 3500);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [introDone, showLogin]);

  const goNext = () => {
    setActiveCard(prev => (prev + 1) % cards.length);
    if (autoRef.current) clearInterval(autoRef.current);
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
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
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
          className="h-full flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {!showLogin ? (
            <>
              {/* Hero photo + brand */}
              <div className="relative h-[30%] min-h-[160px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80&auto=format&fit=crop"
                  alt="Runners"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-bg-primary/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <img src="/icons/logo.png" alt="Sprint Society" className="w-18 h-18 rounded-xl object-cover mb-2" style={{ width: '72px', height: '72px' }} />
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                    Sprint <span className="text-accent">Society</span>
                  </h1>
                  <p className="text-white/60 text-[11px] mt-1 drop-shadow">World's 1st AI-powered running community</p>
                </div>
                {/* Skip */}
                <button className="absolute top-4 right-4 z-20 text-[11px] text-zinc-400 hover:text-white transition-colors">Skip</button>
              </div>

              {/* Card section */}
              <div className="flex-1 flex flex-col px-5 pt-4 pb-4">
                {/* Card */}
                <div className="flex-1 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCard}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 rounded-2xl bg-bg-secondary border border-bg-tertiary p-5 flex flex-col"
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-[10px] text-zinc-600 font-mono">{activeCard + 1}/{cards.length}</span>
                        </div>
                        <button
                          onClick={goNext}
                          className="w-8 h-8 rounded-full bg-accent flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12l4-4-4-4"/></svg>
                        </button>
                      </div>

                      {/* Card title */}
                      <div className="mb-3">
                        <h2 className="font-heading text-xl font-bold text-white">{cards[activeCard].title}</h2>
                        <p className="text-zinc-400 text-[12px] mt-0.5">{cards[activeCard].description}</p>
                      </div>

                      {/* Infographic */}
                      <CardInfographic index={activeCard} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Dots */}
                <div className="flex gap-1.5 justify-center pt-4">
                  {cards.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeCard ? 'w-5 bg-accent' : 'w-1.5 bg-zinc-700'}`} />
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-4 space-y-2.5">
                  <Button fullWidth size="lg" onClick={() => window.location.href = '/register'}>
                    Join Sprint Society
                  </Button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="w-full py-3 rounded-xl border border-bg-tertiary text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-all"
                  >
                    Already a member? Log in
                  </button>
                  <p className="text-zinc-700 text-[10px] text-center">by Kendu Entertainment</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center px-6 pb-8">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto space-y-4">
                <div className="text-center mb-6">
                  <img src="/icons/logo.png" alt="Sprint Society" className="w-12 h-12 rounded-lg object-cover mx-auto mb-3" />
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
