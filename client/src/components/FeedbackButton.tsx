import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { SUPPORT_EMAIL, supportMailto } from '../lib/support';

const types = [
  { value: 'bug', label: '🐛 Bug', desc: 'Something broke' },
  { value: 'idea', label: '💡 Idea', desc: 'Feature request' },
  { value: 'complaint', label: '😤 Issue', desc: 'Something annoying' },
  { value: 'praise', label: '🔥 Love it', desc: 'Something great' },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!type || !message.trim()) return;
    setSending(true);
    try {
      await api.post('/feedback', { type, message, page: window.location.pathname });
      setSent(true);
      setTimeout(() => { setOpen(false); setSent(false); setType(''); setMessage(''); }, 2000);
    } catch {
      /* silent fail for feedback */
    }
    setSending(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[140px] right-4 z-40 w-9 h-9 rounded-full bg-bg-secondary/80 border border-bg-tertiary shadow-lg flex items-center justify-center text-zinc-500 hover:text-white hover:border-accent/50 transition-all backdrop-blur-sm"
        aria-label="Send feedback"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-bg-secondary border border-bg-tertiary rounded-2xl p-5 space-y-4"
            >
              {sent ? (
                <div className="text-center py-6">
                  <p className="text-emerald-400 font-semibold text-lg">Thanks! 🙏</p>
                  <p className="text-sm text-zinc-500 mt-1">Your feedback shapes Sprint Society.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-heading font-bold text-white">Send Feedback</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {types.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setType(t.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${type === t.value ? 'border-accent bg-accent/10' : 'border-bg-tertiary hover:border-zinc-600'}`}
                      >
                        <span className="text-sm">{t.label}</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us more..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-accent/50 focus:outline-none resize-none text-sm"
                  />
                  <button
                    onClick={submit}
                    disabled={!type || !message.trim() || sending}
                    className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                  >
                    {sending ? 'Sending...' : 'Send Feedback'}
                  </button>
                  <p className="text-[11px] text-zinc-600 text-center mt-3">
                    Prefer email? Reach us at{' '}
                    <a
                      href={supportMailto('Sprint Society — support', `\n\n— page: ${window.location.pathname}`)}
                      className="text-accent hover:underline"
                      data-testid="feedback-support-email"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
