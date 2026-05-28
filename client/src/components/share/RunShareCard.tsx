import { motion } from 'framer-motion';

interface RunShareCardProps {
  distance: number; // km
  pace: string; // formatted "5:30"
  time: string; // formatted "32:15"
  date: string;
  streak: number;
  level: number;
  userName: string;
  isPB?: boolean;
  score?: number;
}

export function RunShareCard({
  distance,
  pace,
  time,
  date,
  streak,
  level,
  userName,
  isPB,
  score,
}: RunShareCardProps) {
  return (
    <div
      className={`relative w-[360px] h-[640px] rounded-3xl overflow-hidden flex flex-col p-6 ${
        isPB ? 'ring-2 ring-amber-400/60 shadow-[0_0_40px_rgba(251,191,36,0.2)]' : ''
      }`}
      style={{
        background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
      }}
    >
      {/* PB glow overlay */}
      {isPB && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.08), transparent 60%)',
          }}
        />
      )}

      {/* Header — Logo */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="text-accent text-lg">⚡</span>
        <span className="font-heading font-bold text-[14px] tracking-tight text-white">
          Sprint <span className="text-accent">Society</span>
        </span>
      </div>

      {/* PB Badge */}
      {isPB && (
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
          className="absolute top-5 right-5 z-20"
        >
          <div className="bg-gradient-to-br from-amber-400 to-yellow-600 px-3 py-1.5 rounded-lg shadow-lg">
            <span className="text-[11px] font-black text-black uppercase tracking-wider">
              NEW PB
            </span>
          </div>
        </motion.div>
      )}

      {/* Center — Large distance */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <p className="font-mono text-[72px] font-black text-white leading-none tracking-tight">
            {distance.toFixed(1)}
          </p>
          <p className="text-[14px] text-zinc-500 uppercase tracking-[0.3em] mt-2 font-medium">
            kilometers
          </p>
        </motion.div>

        {/* Score ring (if provided) */}
        {score !== undefined && score > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 flex items-center gap-2"
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="absolute w-full h-full" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="17"
                  stroke="#27272a"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="17"
                  stroke="#f97316"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(score / 100) * 106.8} 106.8`}
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                />
              </svg>
              <span className="text-[11px] font-mono font-bold text-white">{score}</span>
            </div>
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Score</span>
          </motion.div>
        )}
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 grid grid-cols-3 gap-3 mb-5"
      >
        <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.04]">
          <p className="font-mono text-[18px] font-bold text-white">{pace}</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">min/km</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.04]">
          <p className="font-mono text-[18px] font-bold text-white">{time}</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">time</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.04]">
          <p className="font-mono text-[18px] font-bold text-white">{date}</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">date</p>
        </div>
      </motion.div>

      {/* Streak indicator */}
      {streak > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 flex items-center justify-center gap-1.5 mb-4"
        >
          <span className="text-[14px]">
            {streak >= 30 ? '\u{1F31F}' : streak >= 14 ? '\u{26A1}' : '\u{1F525}'}
          </span>
          <span className="text-[12px] font-bold text-orange-400">{streak}-day streak</span>
        </motion.div>
      )}

      {/* Footer — User + Level */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 flex items-center justify-between pt-4 border-t border-white/[0.05]"
      >
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-zinc-300">{userName}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
          <span className="text-[10px] text-accent font-bold">LVL {level}</span>
        </div>
      </motion.div>

      {/* Branding footer */}
      <p className="relative z-10 text-center text-zinc-800 text-[8px] mt-3 tracking-wider">
        Kendu Entertainment
      </p>
    </div>
  );
}
