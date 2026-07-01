import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export function ChatFAB() {
  const navigate = useNavigate();

  const { data: suggestions } = useQuery({
    queryKey: ['chat-suggestions'],
    queryFn: () => api.get('/chat/suggestions').then(r => r.data).catch(() => null),
    staleTime: 5 * 60_000,
  });

  const hasContextualSuggestion = suggestions?.suggestions?.some((s: any) => s.priority <= 2);

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
      onClick={() => navigate('/chat')}
      className="fixed bottom-[88px] right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-warm shadow-lg shadow-accent/20 flex items-center justify-center active:scale-90 transition-transform"
      aria-label="Ask AI Coach"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H7l-3.5 2.5V12H5a2 2 0 01-2-2V4z" fill="white"/>
        <circle cx="7" cy="7" r="0.75" fill="#F97316"/>
        <circle cx="9" cy="7" r="0.75" fill="#F97316"/>
        <circle cx="11" cy="7" r="0.75" fill="#F97316"/>
      </svg>
      {hasContextualSuggestion && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-green border-2 border-bg-primary" />
      )}
    </motion.button>
  );
}
