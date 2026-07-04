import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { SSAura } from '../components/ss/SSAura';
import { ChevronRight, Check, Pin, ArrowLeft } from '../components/ss/icons';

const cards = [
  { title: 'AI Coach', description: 'Your plan adapts after every run.' },
  { title: 'Get Faster', description: 'Science-backed pace zones & predictions.' },
  { title: 'Communities', description: 'Find your crew. Join clubs. Run together.' },
  { title: 'Events', description: 'Show up. Check in. Earn awards.' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 13,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13.5px var(--body)', color: 'var(--fg)', outline: 'none',
};

const lbl: React.CSSProperties = { font: '500 10px var(--body)', color: 'var(--muted-2)' };

function CardInfographic({ index }: { index: number }) {
  if (index === 0) {
    // AI Coach — performance chart
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p style={lbl}>This Month</p>
            <p className="num" style={{ font: '700 20px var(--mono)', color: 'var(--accent-2)', margin: '2px 0 0' }}>+12%</p>
            <p style={lbl}>Pace Improvement</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="num"
              style={{ font: '700 17px var(--mono)', color: 'var(--fg)', margin: 0 }}
            >
              5'21"/km
            </motion.p>
            <p style={lbl}>Today</p>
          </div>
        </div>
        {/* Mini chart */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, paddingTop: 8 }}>
          {[40, 55, 45, 60, 50, 70, 65, 75, 72, 80, 78, 85].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
              style={{ flex: 1, borderRadius: 3, background: 'linear-gradient(180deg, rgba(251,146,60,.55), rgba(249,115,22,.28))' }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span className="num" style={{ font: '500 10.5px var(--mono)', color: 'var(--muted-2)' }}>5'50"/km</span>
          <span style={lbl}>Last Month</span>
        </div>
      </div>
    );
  }
  if (index === 1) {
    // Training — pace zones with progress
    const zones = [
      { label: 'Easy', pace: '6:15/km', pct: 100, color: 'var(--green)' },
      { label: 'Tempo', pace: '5:02/km', pct: 78, color: 'var(--accent)' },
      { label: 'Interval', pace: '4:28/km', pct: 58, color: 'var(--accent-2)' },
      { label: 'Race', pace: '4:45/km', pct: 68, color: 'var(--amber)' },
    ];
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)' }}>Your Pace Zones</span>
          <span className="num" style={{ font: '600 10px var(--mono)', color: 'var(--green)' }}>VDOT 42</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          {zones.map((z, i) => (
            <div key={z.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ font: '500 11px var(--body)', color: 'var(--muted)' }}>{z.label}</span>
                <span className="num" style={{ font: '600 11px var(--mono)', color: 'var(--fg)' }}>{z.pace}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 4, background: z.color, opacity: 0.75 }}
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
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 10, marginTop: 8, borderTop: '1px solid var(--hair)' }}
        >
          <span style={lbl}>5K Prediction</span>
          <span className="num" style={{ font: '700 14px var(--mono)', color: 'var(--fg)' }}>
            24:12 <span style={{ font: '600 10px var(--mono)', color: 'var(--green)' }}>-38s</span>
          </span>
        </motion.div>
      </div>
    );
  }
  if (index === 2) {
    // Communities
    const clubs = [
      { name: 'Sprint Social Club', members: '247', verified: true },
      { name: 'Kolkata Runners', members: '312', verified: false },
      { name: 'Sunrise Runners', members: '89', verified: false },
    ];
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['All', 'Run Clubs', 'Social'].map((c, i) => (
            <span key={c} className={`ss-tab ${i === 0 ? 'on' : ''}`} style={{ minHeight: 28, padding: '0 11px', fontSize: 10.5, display: 'inline-flex', alignItems: 'center' }}>{c}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {clubs.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)' }}
            >
              <span style={{ width: 30, height: 30, borderRadius: 9, flex: 'none', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', font: '700 11px var(--head)', color: '#fff' }}>
                {c.name[0]}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '600 12px var(--body)', color: 'var(--fg)' }}>{c.name}</span>
                <span className="num" style={{ display: 'block', font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>{c.members} members</span>
              </span>
              {c.verified && <Check width={11} height={11} style={{ color: 'var(--accent-2)', flex: 'none' }} />}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  // Events
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ flex: 1, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)', padding: '13px 14px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <span className="num" style={{ font: '600 9.5px var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--accent-2)' }}>Upcoming</span>
          <span className="ss-tag go">Going</span>
        </div>
        <p style={{ font: '600 13px var(--body)', color: 'var(--fg)', margin: '0 0 4px' }}>Morning Tempo Run</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '500 10px var(--body)', color: 'var(--muted-2)' }}>
            <Pin width={10} height={10} /> Kolkata
          </span>
          <span style={{ font: '500 10px var(--body)', color: 'var(--muted-2)' }}>Sat 6:00 AM</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--accent-2)', 'var(--muted)'].map((c, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.06 }}
              style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: '2px solid var(--bg)', marginLeft: i ? -7 : 0 }}
            />
          ))}
          <span style={{ font: '500 10px var(--body)', color: 'var(--muted)', marginLeft: 6 }}>+23 going</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, paddingTop: 12 }}
      >
        <div style={{ textAlign: 'center' }}>
          <p className="num" style={{ font: '700 17px var(--mono)', color: 'var(--fg)', margin: 0 }}>12</p>
          <p style={lbl}>Events/month</p>
        </div>
        <span style={{ width: 1, height: 30, background: 'var(--hair)' }} />
        <div style={{ textAlign: 'center' }}>
          <p className="num" style={{ font: '700 17px var(--mono)', color: 'var(--accent-2)', margin: 0 }}>89%</p>
          <p style={lbl}>Show-up rate</p>
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
      setError(err?.message || err?.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="ss-screen" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} aria-label="Sprint Society">
      <SSAura />

      {/* SPLASH */}
      <AnimatePresence>
        {!introDone && (
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'linear-gradient(180deg,var(--bg2),var(--bg) 45%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src="/icons/logo.png"
              alt="Sprint Society"
              style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <motion.h1
              className="brand"
              style={{ font: '700 24px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <b>Sprint</b> Society
            </motion.h1>
            <motion.p
              style={{ font: '400 12px var(--body)', color: 'var(--muted)' }}
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
          style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {!showLogin ? (
            <>
              {/* Hero photo + brand */}
              <div style={{ position: 'relative', height: '30%', minHeight: 160, overflow: 'hidden' }}>
                <img
                  src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80&auto=format&fit=crop"
                  alt="Runners"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, var(--bg) 0%, rgba(8,8,15,.6) 55%, rgba(8,8,15,.2) 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/icons/logo.png" alt="Sprint Society" style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', marginBottom: 8 }} />
                  <h1 className="brand" style={{ font: '700 28px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}>
                    <b>Sprint</b> Society
                  </h1>
                  <p style={{ font: '400 11px var(--body)', color: 'rgba(255,255,255,.65)', marginTop: 4, textShadow: '0 1px 6px rgba(0,0,0,.5)' }}>
                    World's 1st AI-powered running community
                  </p>
                </div>
              </div>

              {/* Card section */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px 16px' }}>
                {/* Card — keyed remount crossfade (a nested AnimatePresence mode="wait"
                    stalls under the route-level AnimatePresence, leaving the card at
                    opacity 0; the keyed motion.div replays initial->animate reliably) */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <motion.div
                      key={activeCard}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="tile"
                      style={{ position: 'absolute', inset: 0, padding: 18 }}
                    >
                      {/* Card header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="num" style={{ font: '600 10px var(--mono)', color: 'var(--muted-2)' }}>
                          {activeCard + 1}/{cards.length}
                        </span>
                        <button
                          onClick={goNext}
                          aria-label="Next"
                          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff' }}
                        >
                          <ChevronRight width={14} height={14} />
                        </button>
                      </div>

                      {/* Card title */}
                      <div style={{ marginBottom: 10 }}>
                        <h2 style={{ font: '600 20px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>{cards[activeCard].title}</h2>
                        <p style={{ font: '400 12px var(--body)', color: 'var(--muted)', marginTop: 3 }}>{cards[activeCard].description}</p>
                      </div>

                      {/* Infographic */}
                      <CardInfographic index={activeCard} />
                    </motion.div>
                </div>

                {/* Dots */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingTop: 14 }}>
                  {cards.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        height: 6, borderRadius: 3, transition: 'all .3s var(--ease)',
                        width: i === activeCard ? 18 : 6,
                        background: i === activeCard ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : 'rgba(255,255,255,.18)',
                      }}
                    />
                  ))}
                </div>

                {/* CTA — Google sign-in lives on the Join (register) and Log in pages, not here */}
                <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <button className="ss-btn ss-btn-primary" style={{ height: 50, fontSize: 15, flex: 'none' }} onClick={() => { window.location.href = '/register'; }}>
                    Join with Email
                  </button>
                  <button className="ss-btn ss-btn-soft" style={{ height: 46, fontSize: 13.5, flex: 'none' }} onClick={() => setShowLogin(true)}>
                    Already a member? Log in
                  </button>
                  <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', opacity: 0.6, textAlign: 'center', margin: 0 }}>by Kendu Entertainment</p>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 32px' }}>
              {/* Header for login */}
              <div style={{ padding: '18px 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/icons/logo.png" alt="Sprint Society" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                <div>
                  <h1 className="brand" style={{ font: '700 17px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)', lineHeight: 1 }}>
                    <b>Sprint</b> Society
                  </h1>
                  <p style={{ font: '400 10px var(--body)', color: 'var(--muted-2)', marginTop: 3 }}>World's 1st AI-powered running community</p>
                </div>
              </div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 13, flex: 1, justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <h2 style={{ font: '600 20px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>Welcome back</h2>
                  <p style={{ font: '400 13px var(--body)', color: 'var(--muted)', marginTop: 5 }}>Log in to continue your journey</p>
                </div>
                <GoogleSignInButton
                  text="signin_with"
                  onSuccess={(isNew) => { window.location.href = isNew ? '/profiling' : '/dashboard'; }}
                  onError={(msg) => setError(msg)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
                  <span style={{ font: '500 11px var(--body)', color: 'var(--muted-2)' }}>or</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
                </div>
                <input type="text" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="Email or phone number" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoFocus />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                {error && <p style={{ font: '500 12.5px var(--body)', color: 'var(--amber)', textAlign: 'center', margin: 0 }}>{error}</p>}
                <button className="ss-btn ss-btn-primary" style={{ height: 50, fontSize: 15, flex: 'none' }} onClick={handleLogin} disabled={loading}>
                  {loading ? 'Logging in…' : 'Log in'}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                  <Link to="/forgot-password" style={{ font: '500 11.5px var(--body)', color: 'var(--muted-2)', textDecoration: 'none' }}>Forgot password?</Link>
                  <button onClick={() => setShowLogin(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '600 11.5px var(--body)', color: 'var(--accent-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <ArrowLeft width={12} height={12} /> Back
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
