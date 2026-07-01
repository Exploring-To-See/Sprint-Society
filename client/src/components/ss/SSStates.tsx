// Shared production states — skeletons (match the surface system), empty (text-led
// headline + copy + optional CTA, NO emoji), and error (friendly copy + retry).
import { ReactNode } from 'react';

export function SSSkeleton({ height = 80, className = '', style }: { height?: number | string; className?: string; style?: React.CSSProperties }) {
  return <div className={`ss-skel ${className}`} style={{ height, ...style }} aria-hidden="true" />;
}

export function SSEmpty({
  icon, title, body, cta, testid,
}: {
  icon?: ReactNode; title: string; body?: string; cta?: ReactNode; testid?: string;
}) {
  return (
    <div
      className="ss-rise"
      data-testid={testid}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '52px 24px', gap: 12 }}
    >
      {icon && (
        <div className="ticon" style={{ width: 46, height: 46, borderRadius: 13, color: 'var(--muted)' }}>
          {icon}
        </div>
      )}
      <h3 style={{ font: '600 17px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)' }}>{title}</h3>
      {body && <p style={{ font: '400 12.5px/1.5 var(--body)', color: 'var(--muted)', maxWidth: 280 }}>{body}</p>}
      {cta && <div style={{ marginTop: 6 }}>{cta}</div>}
    </div>
  );
}

export function SSError({ onRetry, message, testid }: { onRetry?: () => void; message?: string; testid?: string }) {
  return (
    <div
      className="ss-rise"
      data-testid={testid}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '52px 24px', gap: 12 }}
    >
      <div className="ticon" style={{ width: 46, height: 46, borderRadius: 13, color: 'var(--amber)' }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v5" /><circle cx="12" cy="16.5" r=".6" fill="currentColor" /><path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <h3 style={{ font: '600 16px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)' }}>Something didn't load</h3>
      <p style={{ font: '400 12.5px/1.5 var(--body)', color: 'var(--muted)', maxWidth: 280 }}>
        {message || 'We couldn’t reach your training data just now. Check your connection and try again.'}
      </p>
      {onRetry && (
        <button className="ss-btn ss-btn-soft" style={{ height: 42, padding: '0 22px', flex: 'none', marginTop: 4 }} onClick={onRetry} data-testid="ss-retry">
          Try again
        </button>
      )}
    </div>
  );
}
