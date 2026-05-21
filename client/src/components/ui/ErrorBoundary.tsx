import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#EF4444" strokeWidth="1.5"/>
              <path d="M10 6V10.5M10 13.5V14" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-semibold text-white mb-1">Something went wrong</p>
            <p className="text-[11px] text-zinc-500 max-w-[240px]">
              Try refreshing the page. If this persists, contact support.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary text-[12px] font-medium text-white hover:border-zinc-600 transition-colors active:scale-95"
          >
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
