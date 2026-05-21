import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

const COLORS = ['#F97316', '#FBBF24', '#10B981', '#FB923C', '#FCD34D', '#34D399'];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.4,
  }));
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      setParticles(generateParticles(40));
      const timeout = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: 0, opacity: 1 }}
              animate={{
                y: '110vh',
                rotate: p.rotation + 720,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{ position: 'absolute', transform: `scale(${p.scale})` }}
            >
              <div
                className="w-2 h-3 rounded-[1px]"
                style={{ backgroundColor: p.color }}
              />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Toast-style celebration notification
interface CelebrationToastProps {
  title: string;
  message: string;
  type: 'gold' | 'silver' | 'bronze';
  visible: boolean;
  onDismiss: () => void;
}

const TOAST_STYLES = {
  gold: { bg: 'from-accent-gold/15 to-accent-gold/5', border: 'border-accent-gold/30', icon: '🏆' },
  silver: { bg: 'from-zinc-400/15 to-zinc-400/5', border: 'border-zinc-500/30', icon: '🥈' },
  bronze: { bg: 'from-orange-600/15 to-orange-600/5', border: 'border-orange-600/30', icon: '⚡' },
};

export function CelebrationToast({ title, message, type, visible, onDismiss }: CelebrationToastProps) {
  const style = TOAST_STYLES[type];

  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-[90] max-w-lg mx-auto"
          onClick={onDismiss}
        >
          <div className={`rounded-xl border ${style.border} bg-gradient-to-r ${style.bg} backdrop-blur-lg p-4 shadow-lg shadow-black/20`}>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.15 }}
                className="text-2xl"
              >
                {style.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white">{title}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{message}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
