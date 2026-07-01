// Cookie consent banner — shows once until the user accepts or rejects. Gates
// analytics via lib/consent. Non-blocking, bottom-anchored, mobile-first, ss-kit.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getConsent, setConsent } from '../lib/consent';

export function CookieConsent() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Defer so it never competes with first paint / auth redirect.
    const t = setTimeout(() => setShow(getConsent() === 'unset'), 800);
    return () => clearTimeout(t);
  }, []);

  const choose = (v: 'accepted' | 'rejected') => {
    setConsent(v);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          data-testid="cookie-consent"
          initial={reduce ? false : { y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          style={{
            position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 200,
            margin: '0 auto', maxWidth: 440,
          }}
        >
          <div className="ss-surface ss-rise" style={{ borderRadius: 18, padding: 16, boxShadow: '0 18px 48px -18px rgba(0,0,0,.7)' }}>
            <p style={{ font: '600 14px var(--head)', color: 'var(--fg)', marginBottom: 6 }}>We use cookies</p>
            <p style={{ font: '400 12px/1.55 var(--body)', color: 'var(--muted)' }}>
              Essential cookies keep you signed in. With your OK we also use analytics cookies to improve Sprint Society.
              See our{' '}
              <Link to="/privacy" style={{ color: 'var(--violet-2)', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                className="ss-btn ss-btn-soft"
                style={{ flex: 1, height: 42 }}
                onClick={() => choose('rejected')}
                data-testid="cookie-reject"
              >
                Essential only
              </button>
              <button
                className="ss-btn ss-btn-primary"
                style={{ flex: 1, height: 42 }}
                onClick={() => choose('accepted')}
                data-testid="cookie-accept"
              >
                Accept all
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
