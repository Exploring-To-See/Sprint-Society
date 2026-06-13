interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-red-400">
          <path d="M10 6v4m0 4h.01M18 10a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-[13px] text-zinc-400 mb-3 max-w-[240px]">
        {message || 'Something went wrong. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[12px] font-medium text-white transition-colors active:scale-[0.97]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
