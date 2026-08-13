import { ReactNode } from 'react';

/**
 * Tiny markdown renderer for AI coach replies. The models emit light markdown
 * (headings, **bold**, lists) which previously rendered as raw `#` and `*`
 * characters. Handles exactly the subset a chat reply uses — headings, bullet
 * and numbered lists, bold/italic, inline code — as real React nodes (no HTML
 * injection). Anything else falls through as plain text.
 */

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Order matters: bold (**x**) before italic (*x*), inline code first.
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith('`')) {
      nodes.push(
        <code key={key} style={{ font: '500 12px var(--mono)', background: 'rgba(255,255,255,.07)', borderRadius: 4, padding: '1px 5px' }}>
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith('**')) {
      nodes.push(<strong key={key} style={{ fontWeight: 600, color: 'var(--fg)' }}>{tok.slice(2, -2)}</strong>);
    } else {
      nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function CoachMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: ReactNode[][] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const items = list.items.map((item, idx) => (
      <li key={`${key}-li-${idx}`} style={{ margin: '2px 0' }}>{item}</li>
    ));
    blocks.push(
      list.ordered
        ? <ol key={key} style={{ margin: '4px 0', paddingLeft: 20 }}>{items}</ol>
        : <ul key={key} style={{ margin: '4px 0', paddingLeft: 20 }}>{items}</ul>,
    );
    list = null;
  };

  lines.forEach((raw, idx) => {
    const key = `md-${idx}`;
    const line = raw.trimEnd();

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(line);

    if (heading) {
      flushList(key);
      blocks.push(
        <p key={key} style={{ font: '600 13.5px var(--head)', color: 'var(--fg)', margin: '8px 0 2px' }}>
          {renderInline(heading[2], key)}
        </p>,
      );
    } else if (bullet) {
      if (!list || list.ordered) { flushList(key); list = { ordered: false, items: [] }; }
      list.items.push(renderInline(bullet[1], key));
    } else if (numbered) {
      if (!list || !list.ordered) { flushList(key); list = { ordered: true, items: [] }; }
      list.items.push(renderInline(numbered[2], key));
    } else if (line.trim() === '') {
      flushList(key);
      // Collapse runs of blank lines into a single gap.
      const prev = blocks[blocks.length - 1];
      if (prev !== null || blocks.length === 0) blocks.push(null);
    } else {
      flushList(key);
      blocks.push(<span key={key}>{renderInline(line, key)}{' '}</span>);
    }
  });
  flushList('md-tail');

  // Group consecutive inline spans into paragraphs separated by blank markers.
  const paragraphs: ReactNode[] = [];
  let current: ReactNode[] = [];
  blocks.forEach((b, i) => {
    if (b === null) {
      if (current.length) { paragraphs.push(<p key={`p-${i}`} style={{ margin: '4px 0' }}>{current}</p>); current = []; }
      return;
    }
    if (typeof b === 'object' && b !== null && 'type' in (b as { type?: unknown }) && ((b as { type: unknown }).type === 'span')) {
      current.push(b);
      return;
    }
    if (current.length) { paragraphs.push(<p key={`p-${i}`} style={{ margin: '4px 0' }}>{current}</p>); current = []; }
    paragraphs.push(b);
  });
  if (current.length) paragraphs.push(<p key="p-tail" style={{ margin: '4px 0' }}>{current}</p>);

  return <div style={{ font: '400 13px/1.55 var(--body)' }}>{paragraphs}</div>;
}
