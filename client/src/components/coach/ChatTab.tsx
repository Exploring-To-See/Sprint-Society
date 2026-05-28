import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function ChatTab() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => api.get('/chat/history').then(r => r.data).catch(() => ({ messages: [] })),
  });

  const { data: suggestions } = useQuery({
    queryKey: ['chat-suggestions'],
    queryFn: () => api.get('/chat/suggestions').then(r => r.data).catch(() => ({ suggestions: [] })),
  });

  const sendMessage = useMutation({
    mutationFn: (message: string) => api.post('/ai/chat', { message }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      setInput('');
    },
  });

  const messages: ChatMessage[] = history?.messages || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input.trim());
  };

  const quickSuggestions = suggestions?.suggestions || ['Adjust my plan', 'Am I overtraining?', 'Race strategy', 'Nutrition advice'];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 240px)' }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-none">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">⚔️</div>
            <p className="text-[12px] font-bold text-zinc-400">The Warrior</p>
            <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px] mx-auto">Ask me anything about your training, race prep, recovery, or nutrition.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-2'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-[12px] flex-shrink-0 mt-0.5">⚔️</div>
            )}
            <div className={`max-w-[80%] px-3 py-2.5 text-[11px] leading-relaxed ${
              msg.role === 'user'
                ? 'rounded-xl rounded-br-sm bg-accent/12 border border-accent/15 text-zinc-200'
                : 'rounded-xl rounded-bl-sm bg-bg-tertiary/50 border border-bg-tertiary text-zinc-300'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sendMessage.isPending && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-[12px]">⚔️</div>
            <div className="px-3 py-2.5 rounded-xl bg-bg-tertiary/50 border border-bg-tertiary">
              <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" /><div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.1s' }} /><div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.2s' }} /></div>
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      {messages.length < 3 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {quickSuggestions.slice(0, 4).map((s: string, i: number) => (
            <button
              key={i}
              onClick={() => { setInput(s); }}
              className="px-2.5 py-1.5 rounded-full bg-bg-tertiary/50 border border-bg-tertiary text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t border-bg-tertiary/50">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask your coach..."
          className="flex-1 px-3.5 py-2.5 rounded-full bg-bg-tertiary/50 border border-bg-tertiary text-[11px] text-white placeholder-zinc-600 outline-none focus:border-accent/40"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
          className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-[12px] text-white disabled:opacity-40 active:scale-90 transition-transform"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
