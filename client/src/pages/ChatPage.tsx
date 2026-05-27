import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { KenduSpendConfirmModal } from '../components/kendu/KenduSpendConfirmModal';

const FALLBACK_PROMPTS = [
  { label: 'How should I train today?', icon: '🏃' },
  { label: 'Am I overtraining?', icon: '⚠️' },
  { label: 'Predict my 5K time', icon: '⏱️' },
  { label: 'I need motivation', icon: '💪' },
];

export function ChatPage() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [showDeepDive, setShowDeepDive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: history } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => api.get('/chat/history').then(r => r.data),
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['chat-suggestions'],
    queryFn: () => api.get('/chat/suggestions').then(r => r.data).catch(() => null),
  });

  const quickPrompts = suggestionsData?.suggestions?.length > 0
    ? suggestionsData.suggestions
    : FALLBACK_PROMPTS;

  const { data: kenduBalance } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
  });

  const sendMessage = useMutation({
    mutationFn: (message: string) => api.post('/chat/message', { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      setInput('');
    },
  });

  const deepDiveMutation = useMutation({
    mutationFn: () => api.post('/kendu/spend/ai-deep-dive'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kendu-balance'] });
      setShowDeepDive(false);
      sendMessage.mutate('Give me a comprehensive deep dive analysis of my training: readiness score, injury risk assessment, pace zone compliance, weekly volume trend, recovery status, and a specific training recommendation for this week. Be detailed and data-driven.');
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, sendMessage.isPending]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input.trim());
  };

  const messages = history || [];
  const isEmpty = messages.length === 0;

  return (
    <AppShell hideNav>
      <div className="flex flex-col h-[calc(100vh-env(safe-area-inset-top,0px))] -mx-4 -mt-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-tertiary/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent-gold/20 border border-accent/20 flex items-center justify-center">
            <span className="text-base">🧠</span>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">AI Coach</p>
            <p className="text-[10px] text-accent">Knows your data · Always available</p>
          </div>
          <button
            onClick={() => setShowDeepDive(true)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
          >
            Deep Dive
          </button>
          <a href="/dashboard" className="px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-500 hover:text-white hover:bg-bg-tertiary transition-colors">
            ←
          </a>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Empty state — quick prompts */}
          {isEmpty && !sendMessage.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 pt-12"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/10 to-accent-gold/10 border border-accent/15 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🧠</span>
                </div>
                <h2 className="font-heading text-[18px] font-bold">Your AI Running Coach</h2>
                <p className="text-[12px] text-zinc-500 mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                  I know your training data, pace zones, readiness, and injury risk. Ask me anything.
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 max-w-[300px]">
                {quickPrompts.map((prompt: any) => (
                  <button
                    key={prompt.label}
                    onClick={() => sendMessage.mutate(prompt.label)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-left hover:border-zinc-700 transition-colors active:scale-[0.97]"
                  >
                    <span className="text-sm">{prompt.icon}</span>
                    <span className="text-[11px] text-zinc-400 leading-tight">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message bubbles */}
          {messages.map((msg: any, i: number) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-accent/15 border border-accent/20 rounded-br-md'
                  : 'bg-bg-secondary border border-bg-tertiary rounded-bl-md'
              }`}>
                <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'text-white' : 'text-zinc-300'
                }`}>
                  {msg.content}
                </p>
                <p className="text-[9px] text-zinc-700 mt-1.5">
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {sendMessage.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-[5px] h-[5px] rounded-full bg-zinc-500"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-bg-tertiary/50 bg-bg-primary/95 backdrop-blur-lg pb-[calc(env(safe-area-inset-bottom,8px)+12px)]">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your coach..."
              className="flex-1 px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-[13px] text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none transition-colors"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              disabled={sendMessage.isPending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-90 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8L14 2L10 14L8 9L2 8Z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <KenduSpendConfirmModal
        isOpen={showDeepDive}
        onClose={() => setShowDeepDive(false)}
        onConfirm={() => deepDiveMutation.mutate()}
        title="AI Deep Dive"
        description="Get a comprehensive training analysis: readiness, injury risk, pace compliance, and personalized recommendations"
        cost={30}
        currentBalance={kenduBalance?.spendable_balance ?? 0}
        loading={deepDiveMutation.isPending}
      />
    </AppShell>
  );
}
