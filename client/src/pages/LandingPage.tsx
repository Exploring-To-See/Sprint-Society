import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const TOTAL_SPOTS = 50;

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Select your level' },
  { value: 'just_starting', label: 'Just Starting' },
  { value: 'casual', label: 'Casual Runner' },
  { value: 'regular', label: 'Regular Runner' },
  { value: 'competitive', label: 'Competitive' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'How did you hear about us?' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'friend', label: 'Friend' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
];

const PERKS = [
  { icon: '∞', title: 'Lifetime Free Access', desc: 'Sprint Society app — forever free for Founders' },
  { icon: '⚡', title: 'AI Pace Coaching', desc: 'Personalized training plans that adapt to you' },
  { icon: '♥', title: 'VO2max & HR Zones', desc: 'Know your body, train smarter, not harder' },
  { icon: '🎯', title: 'Weekly Challenges & XP', desc: 'Gamified progress that keeps you consistent' },
  { icon: '★', title: 'Founder Badge', desc: 'Your name permanently in the app as a Founding Member' },
];

const WHATSAPP_LINK = 'https://chat.whatsapp.com/YOUR_GROUP_LINK';

export function LandingPage() {
  const [spotsRemaining] = useState(TOTAL_SPOTS);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    experience: '',
    source: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid 10-digit Indian number';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email';
    if (!form.experience) e.experience = 'Select your experience level';
    if (!form.source) e.source = 'Let us know how you found us';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate submission — replace with real API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-bg-primary text-white overflow-x-hidden">
      {/* Gradient orbs - background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[30%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-cyan-500/8 to-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-[20%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-blue-600/6 to-cyan-400/4 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 py-8 pb-20">
        {/* Header / Hero */}
        <motion.section
          initial="hidden"
          animate="show"
          className="text-center pt-8 pb-10"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
              Founding Members — {spotsRemaining} spots left
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-heading text-4xl font-bold tracking-tight leading-[1.1] mb-3"
          >
            Sprint{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Society
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-zinc-400 text-[15px] leading-relaxed max-w-[280px] mx-auto"
          >
            Kolkata's first AI-powered running community. Train smarter. Run together. Level up.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-6 flex items-center justify-center gap-3 text-xs text-zinc-500"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">●</span> May 31, 2025
            </span>
            <span className="w-px h-3 bg-zinc-700" />
            <span>Kolkata</span>
            <span className="w-px h-3 bg-zinc-700" />
            <span>6:00 AM</span>
          </motion.div>
        </motion.section>

        {/* Perks */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="mb-12"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-heading text-lg font-semibold mb-5 text-center"
          >
            What Founding Members Get
          </motion.h2>

          <div className="space-y-3">
            {PERKS.map((perk, i) => (
              <motion.div
                key={perk.title}
                variants={fadeUp}
                custom={i + 1}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-bg-secondary/80 border border-bg-tertiary/60 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/10 flex items-center justify-center text-base shrink-0">
                  {perk.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white leading-tight">{perk.title}</p>
                  <p className="text-[12px] text-zinc-500 leading-snug mt-0.5">{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Form / Success */}
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.section
              key="form"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-30px' }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <motion.h2
                variants={fadeUp}
                custom={0}
                className="font-heading text-lg font-semibold mb-1 text-center"
              >
                Claim Your Spot
              </motion.h2>
              <motion.p
                variants={fadeUp}
                custom={0.5}
                className="text-zinc-500 text-xs text-center mb-6"
              >
                First 50 runners get lifetime free access
              </motion.p>

              <motion.form
                variants={fadeUp}
                custom={1}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                <InputField
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(v) => updateField('name', v)}
                  error={errors.name}
                  autoComplete="name"
                />
                <InputField
                  type="tel"
                  placeholder="Phone (10 digits)"
                  value={form.phone}
                  onChange={(v) => updateField('phone', v)}
                  error={errors.phone}
                  autoComplete="tel"
                  prefix="+91"
                />
                <InputField
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(v) => updateField('email', v)}
                  error={errors.email}
                  autoComplete="email"
                />
                <InputField
                  type="text"
                  placeholder="Instagram handle (optional)"
                  value={form.instagram}
                  onChange={(v) => updateField('instagram', v)}
                  prefix="@"
                />
                <SelectField
                  options={EXPERIENCE_OPTIONS}
                  value={form.experience}
                  onChange={(v) => updateField('experience', v)}
                  error={errors.experience}
                />
                <SelectField
                  options={SOURCE_OPTIONS}
                  value={form.source}
                  onChange={(v) => updateField('source', v)}
                  error={errors.source}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 rounded-xl font-semibold text-[15px] text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Registering...
                    </span>
                  ) : (
                    "I'm In — Reserve My Spot"
                  )}
                </button>
              </motion.form>
            </motion.section>
          ) : (
            <motion.section
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 text-center"
            >
              <div className="p-8 rounded-2xl bg-bg-secondary/80 border border-emerald-500/20 backdrop-blur-sm">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-heading text-xl font-bold mb-2">You're In!</h2>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Welcome to Sprint Society, {form.name.split(' ')[0]}! You're now a Founding Member. Join the WhatsApp group for event details and location.
                </p>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#20BD5A] active:scale-[0.97] transition-all"
                >
                  <WhatsAppIcon />
                  Join WhatsApp Group
                </a>
                <p className="text-zinc-600 text-xs mt-4">
                  Location will be shared in the group
                </p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Event Details */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-30px' }}
          className="mb-12"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-heading text-lg font-semibold mb-5 text-center"
          >
            First Run Details
          </motion.h2>

          <motion.div
            variants={fadeUp}
            custom={1}
            className="rounded-xl bg-bg-secondary/80 border border-bg-tertiary/60 backdrop-blur-sm overflow-hidden"
          >
            <div className="divide-y divide-bg-tertiary/60">
              <EventRow label="Date" value="Saturday, May 31, 2025" />
              <EventRow label="Time" value="6:00 AM" />
              <EventRow label="Location" value="Kolkata — revealed in WhatsApp group" highlight />
              <EventRow label="Bring" value="Running shoes, water bottle, phone" />
              <EventRow label="Distance" value="Any pace, any distance — we run together" />
            </div>
          </motion.div>
        </motion.section>

        {/* Spots counter */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center pb-8"
        >
          <div className="inline-flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-6 rounded-full ${
                    i < Math.ceil((spotsRemaining / TOTAL_SPOTS) * 10)
                      ? 'bg-gradient-to-t from-cyan-500 to-emerald-400'
                      : 'bg-bg-tertiary'
                  }`}
                />
              ))}
            </div>
            <p className="text-zinc-500 text-xs">
              <span className="text-emerald-400 font-semibold">{spotsRemaining}/{TOTAL_SPOTS}</span> spots remaining
            </p>
          </div>

          <p className="text-zinc-700 text-[10px] mt-8">
            by Kendu Entertainment
          </p>
        </motion.section>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function InputField({
  type,
  placeholder,
  value,
  onChange,
  error,
  prefix,
  autoComplete,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  prefix?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <div className={`flex items-center rounded-xl bg-bg-secondary border ${error ? 'border-red-500/50' : 'border-bg-tertiary'} focus-within:border-cyan-500/40 transition-colors`}>
        {prefix && (
          <span className="pl-3.5 text-zinc-500 text-sm select-none">{prefix}</span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`w-full ${prefix ? 'pl-1.5' : 'pl-3.5'} pr-3.5 py-3 bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none`}
        />
      </div>
      {error && <p className="text-red-400 text-[11px] mt-1 ml-1">{error}</p>}
    </div>
  );
}

function SelectField({
  options,
  value,
  onChange,
  error,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-3 rounded-xl bg-bg-secondary border ${error ? 'border-red-500/50' : 'border-bg-tertiary'} text-sm focus:border-cyan-500/40 focus:outline-none transition-colors appearance-none ${value ? 'text-white' : 'text-zinc-600'}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-[11px] mt-1 ml-1">{error}</p>}
    </div>
  );
}

function EventRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-zinc-500 text-xs font-medium w-16 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm ${highlight ? 'text-cyan-400' : 'text-zinc-300'}`}>{value}</span>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
