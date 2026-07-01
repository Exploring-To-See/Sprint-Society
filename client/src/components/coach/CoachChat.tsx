// AI Coach · Chat — the conversation surface. Look from locked Home/ss-base, data &
// behavior from chat.routes.ts (GET /chat/history, GET /chat/suggestions, GET /kendu/balance,
// POST /chat/message, POST /kendu/spend/ai-deep-dive). §18.2: neutral-glass bubbles
// differentiated by SIDE + weight; AI identity = violet orb only; send = the one orange primary.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import api from '../../lib/api';
import { Spark, Send, Chat as ChatIcon } from '../ss/icons';
import { SSError } from '../ss/SSStates';
import { KenduSpendConfirmModal } from '../kendu/KenduSpendConfirmModal';

interface ChatMessage { id?: number | string; role: 'user' | 'assistant'; content: string; created_at?: string }
interface Suggestion { label: string }

const FALLBACK_PROMPTS: Suggestion[] = [
  { label: 'How should I train today?' },
  { label: 'Am I overtraining?' },
  { label: 'Predict my 5K time' },
  { label: 'I need motivation' },
];

function fmtTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function CoachChat() {
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const [input, setInput] = useState('');
  const [showDeepDive, setShowDeepDive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading, isError, refetch } = useQuery<ChatMessage[]>({
    queryKey: ['chat-history'],
    queryFn: () => api.get('/chat/history').then((r) => r.data),
  });

  const { data: suggestionsData } = useQuery<{ suggestions?: Suggestion[] } | null>({
    queryKey: ['chat-suggestions'],
    queryFn: () => api.get('/chat/suggestions').then((r) => r.data).catch(() => null),
  });
  const quickPrompts: Suggestion[] = suggestionsData?.suggestions?.length ? suggestionsData.suggestions : FALLBACK_PROMPTS;

  const { data: kenduBalance } = useQuery<{ spendable_balance?: number }>({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then((r) => r.data),
  });

  const sendMessage = useMutation({
    mutationFn: (message: string) => api.post('/chat/message', { message }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chat-history'] }); setInput(''); },
  });

  const deepDive = useMutation({
    mutationFn: () => api.post('/kendu/spend/ai-deep-dive'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kendu-balance'] });
      setShowDeepDive(false);
      sendMessage.mutate('Give me a comprehensive deep dive analysis of my training: readiness score, injury risk assessment, pace zone compliance, weekly volume trend, recovery status, and a specific training recommendation for this week. Be detailed and data-driven.');
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, sendMessage.isPending]);

  const messages: ChatMessage[] = history || [];
  const isEmpty = messages.length === 0;

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input.trim());
  };

  return (
    <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 214px)' }}>
      {/* identity row — violet orb carries the AI signal (no persona name, §18.3) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12 }}>
        <span className="ticon" style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,var(--violet),var(--accent))', border: 'none', color: '#fff', boxShadow: '0 6px 16px -6px rgba(124,107,240,.7)' }}>
          <Spark width={16} height={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 13px var(--head)', color: 'var(--fg)' }}>AI Coach</div>
          <div style={{ font: '500 11px var(--body)', color: 'var(--violet-2)' }}>Knows your data · Always available</div>
        </div>
        <button
          className="ss-btn ss-btn-soft"
          style={{ flex: 'none', height: 34, padding: '0 13px', font: '600 11.5px var(--head)', gap: 6 }}
          onClick={() => setShowDeepDive(true)}
          data-testid="coach-deepdive"
        >
          <Spark width={13} height={13} style={{ color: 'var(--violet-2)' }} /> Deep Dive
        </button>
      </div>

      {/* thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 2, scrollbarWidth: 'none' }} data-testid="coach-chat-thread">
        {isLoading && (
          <>
            {[{ w: '70%', s: 'flex-start' }, { w: '55%', s: 'flex-end' }, { w: '80%', s: 'flex-start' }].map((b, i) => (
              <div key={i} className="ss-skel" style={{ alignSelf: b.s as 'flex-start' | 'flex-end', width: b.w, height: 54, borderRadius: 16 }} />
            ))}
          </>
        )}

        {isError && !isLoading && (
          <SSError onRetry={() => refetch()} message="We couldn’t load your conversation. Try again." testid="coach-chat-error" />
        )}

        {!isLoading && !isError && isEmpty && !sendMessage.isPending && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18, paddingTop: 28 }}
            data-testid="coach-chat-empty"
          >
            <div className="ss-ai" style={{ width: 56, height: 56, borderRadius: 18, display: 'grid', placeItems: 'center' }}>
              <Spark width={26} height={26} style={{ color: 'var(--violet-2)' }} />
            </div>
            <div>
              <h2 style={{ font: '600 18px var(--head)', letterSpacing: '-.02em' }}>Your AI Running Coach</h2>
              <p style={{ font: '400 12px/1.5 var(--body)', color: 'var(--muted)', maxWidth: 264, margin: '6px auto 0' }}>
                I know your training data, pace zones, readiness and injury risk. Ask me anything.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 320 }}>
              {quickPrompts.map((p) => (
                <button
                  key={p.label}
                  className="ss-surface ss-recess"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 13, textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => sendMessage.mutate(p.label)}
                  data-testid="coach-chat-prompt"
                >
                  <ChatIcon width={14} height={14} style={{ color: 'var(--violet-2)', flex: 'none' }} />
                  <span style={{ font: '500 11.5px/1.25 var(--body)', color: 'var(--fg)' }}>{p.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <motion.div
              key={m.id ?? i}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
            >
              <div
                className="ss-surface"
                style={{
                  maxWidth: '86%',
                  padding: '10px 14px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isUser ? 'var(--glass-2)' : 'var(--glass)',
                }}
              >
                <p style={{ font: '400 13px/1.5 var(--body)', color: isUser ? 'var(--fg)' : '#D7D7E4', whiteSpace: 'pre-wrap' }}>{m.content}</p>
                {m.created_at && <p style={{ font: '500 9.5px var(--mono)', color: 'var(--muted-2)', marginTop: 5 }}>{fmtTime(m.created_at)}</p>}
              </div>
            </motion.div>
          );
        })}

        {sendMessage.isPending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }} data-testid="coach-chat-typing">
            <div className="ss-surface" style={{ padding: '13px 16px', borderRadius: '16px 16px 16px 4px' }}>
              <span className="ss-typing" aria-label="Coach is typing"><i /><i /><i /></span>
            </div>
          </div>
        )}
      </div>

      {/* composer — the one orange primary action on this surface */}
      <div style={{ display: 'flex', gap: 9, paddingTop: 12 }}>
        <input
          className="ss-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          aria-label="Message your coach"
          data-testid="coach-chat-input"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          disabled={sendMessage.isPending}
        />
        <button
          className="ss-btn ss-btn-primary"
          style={{ flex: 'none', width: 48, height: 48 }}
          onClick={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
          aria-label="Send message"
          data-testid="coach-chat-send"
        >
          <Send width={18} height={18} />
        </button>
      </div>

      <KenduSpendConfirmModal
        isOpen={showDeepDive}
        onClose={() => setShowDeepDive(false)}
        onConfirm={() => deepDive.mutate()}
        title="AI Deep Dive"
        description="Get a comprehensive training analysis: readiness, injury risk, pace compliance, and personalized recommendations"
        cost={30}
        currentBalance={kenduBalance?.spendable_balance ?? 0}
        loading={deepDive.isPending}
      />
    </div>
  );
}
