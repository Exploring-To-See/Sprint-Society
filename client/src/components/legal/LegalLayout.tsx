// Shared readable layout for long-form legal pages (Privacy, Terms). Public —
// no auth. Mobile-first, ss tokens, back button, cross-links + support footer.
import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '../ss/icons';
import { SUPPORT_EMAIL, LEGAL_LAST_UPDATED, supportMailto } from '../../lib/support';

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <h2 style={{ font: '600 16px var(--head)', color: 'var(--fg)', letterSpacing: '-.01em', marginBottom: 8 }}>{heading}</h2>
      <div style={{ font: '400 13.5px/1.7 var(--body)', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
      {items.map((it, i) => (
        <li key={i} style={{ listStyle: 'disc', font: '400 13px/1.6 var(--body)', color: 'var(--muted)' }}>{it}</li>
      ))}
    </ul>
  );
}

export function LegalLayout({ title, intro, children, otherLabel, otherTo }: {
  title: string; intro: string; children: ReactNode; otherLabel: string; otherTo: string;
}) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '18px 18px 64px' }}>
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="ss-btn ss-btn-soft"
          style={{ height: 38, padding: '0 14px', gap: 6, font: '600 12px var(--head)' }}
          data-testid="legal-back"
        >
          <ArrowLeft width={15} height={15} /> Back
        </button>

        <h1 style={{ font: '700 26px var(--head)', letterSpacing: '-.02em', marginTop: 22 }}>{title}</h1>
        <p style={{ font: '500 11px var(--mono)', color: 'var(--muted-2)', marginTop: 6 }}>Last updated · {LEGAL_LAST_UPDATED}</p>
        <p style={{ font: '400 13.5px/1.7 var(--body)', color: 'var(--muted)', marginTop: 14 }}>{intro}</p>

        {children}

        <div style={{ marginTop: 34, paddingTop: 18, borderTop: '1px solid var(--hair)', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <Link to={otherTo} style={{ font: '600 13px var(--head)', color: 'var(--violet-2)' }} data-testid="legal-cross-link">{otherLabel} →</Link>
          <a href={supportMailto('Sprint Society — question')} style={{ font: '600 13px var(--head)', color: 'var(--violet-2)' }}>Contact {SUPPORT_EMAIL}</a>
        </div>
      </div>
    </div>
  );
}
