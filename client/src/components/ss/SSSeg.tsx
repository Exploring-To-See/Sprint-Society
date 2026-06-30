// Segmented sub-tab control — the locked Home Pace/Load/HR pattern (UI-UX §18.1):
// a recessed container with the active item as a NEUTRAL frosted glide-pill that slides
// (Motion shared-layout). Never a row of separate pills, never a hue fill on the active item.
import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

export interface SegItem<K extends string> {
  key: K;
  label: string;
  icon?: ReactNode;
}

interface SSSegProps<K extends string> {
  items: SegItem<K>[];
  value: K;
  onChange: (key: K) => void;
  layoutId?: string;
  ariaLabel?: string;
  testid?: string;
}

export function SSSeg<K extends string>({
  items, value, onChange, layoutId = 'ss-seg-pill', ariaLabel, testid,
}: SSSegProps<K>) {
  const reduce = useReducedMotion();
  return (
    <div className="ss-segbar" role="tablist" aria-label={ariaLabel} data-testid={testid}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            role="tab"
            aria-selected={on}
            aria-current={on ? 'page' : undefined}
            className={`ss-segtab${on ? ' on' : ''}`}
            data-testid={`${testid ?? 'seg'}-${it.key}`}
            onClick={() => onChange(it.key)}
          >
            {on && (
              <motion.span
                layoutId={layoutId}
                className="ss-segpill"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 40 }}
              />
            )}
            {it.icon && <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex' }}>{it.icon}</span>}
            <span style={{ position: 'relative', zIndex: 1 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
