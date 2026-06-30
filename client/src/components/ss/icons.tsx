// Sprint Society — crafted inline SVG icons (Icon Law §15: stroke-width 2, currentColor,
// 24×24 viewBox, ZERO emoji). Nav icons ship an outline + a filled variant for the
// outline→fill active swap; utility icons are single-stroke.
import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (p: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

/* ---------- nav: outline + fill pairs ---------- */
export const HomeOutline = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 10.6 12 3l9 7.6" /><path d="M5.5 9.4V20a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9.4" /><path d="M9.5 21v-6h5v6" /></svg>
);
export const HomeFill = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M11.3 2.6 3.5 9.2A2 2 0 0 0 3 10.6V20a1 1 0 0 0 1 1h5v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h5a1 1 0 0 0 1-1v-9.4a2 2 0 0 0-.5-1.4l-7.8-6.6a1 1 0 0 0-1.4 0Z" /></svg>
);
export const CoachOutline = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3.2 13.9 8.6 19.4 10.5 13.9 12.4 12 17.8 10.1 12.4 4.6 10.5 10.1 8.6Z" /><path d="M19 16.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7Z" /></svg>
);
export const CoachFill = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2.4 14.2 8.4 20.6 10.5 14.2 12.6 12 18.6 9.8 12.6 3.4 10.5 9.8 8.4Z" /><path d="M19 15.8l.85 2.35 2.35.85-2.35.85L19 22.2l-.85-2.35-2.35-.85 2.35-.85Z" /></svg>
);
export const CommunityOutline = (p: IconProps) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" /><path d="M16 5.5a3 3 0 0 1 0 5.6" /><path d="M17.2 14.4c2 .5 3.8 1.9 3.8 4.6" /></svg>
);
export const CommunityFill = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="9" cy="8" r="3.1" /><path d="M9 13.6c-3.2 0-5.8 2-5.8 5.1 0 .4.3.7.7.7h10.2c.4 0 .7-.3.7-.7 0-3.1-2.6-5.1-5.8-5.1Z" /><path d="M16.4 5.2a3 3 0 0 1 .3 5.9c1.9.7 3.3 2.2 3.3 4.6a.6.6 0 0 1-.6.6h-2.1c.1-2.6-1-4.6-2.7-5.9a4.5 4.5 0 0 0 1.8-3.6c0-.4 0-.8-.1-1.2Z" /></svg>
);
export const EventsOutline = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17" /><path d="M8 3v4M16 3v4" /><path d="M7.5 13.5h3v3h-3z" /></svg>
);
export const EventsFill = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 2.2a1 1 0 0 0-1 1v.8h-.5A2.5 2.5 0 0 0 4 6.5V8h16V6.5A2.5 2.5 0 0 0 17.5 4H17v-.8a1 1 0 1 0-2 0V4H9v-.8a1 1 0 0 0-1-1Z" /><path d="M4 9.5v9A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-9Zm5 6.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1Z" /></svg>
);
// directions_run — white glyph on the FAB
export const RunGlyph = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="14.5" cy="4.5" r="2" /><path d="M11.9 7.3 9 9.1a2 2 0 0 0-.86 1.2L7.4 13.2a1 1 0 0 0 1.94.5l.62-2.4 1.74-1-.62 3.1 2.5 2.4.9 4.1a1.05 1.05 0 0 0 2.05-.45l-1-4.6a2 2 0 0 0-.6-1.05l-1.9-1.8.6-3 .9 1.7a2 2 0 0 0 1.5 1.05l2.2.3a1 1 0 0 0 .27-1.98l-1.9-.26-1.5-2.85a2.4 2.4 0 0 0-2.8-1.1l-2.7.86a2 2 0 0 0-.55.27Z" /></svg>
);

/* ---------- utility (single stroke) ---------- */
export const Bell = (p: IconProps) => (
  <svg {...base({ strokeWidth: 1.9, ...p })}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
export const Plus = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Send = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M3.2 11.1 19.5 3.6c1-.46 2 .54 1.54 1.54l-7.5 16.3c-.5 1.08-2.07.96-2.4-.18l-1.7-5.8a1.2 1.2 0 0 0-.82-.82l-5.8-1.7c-1.14-.33-1.26-1.9-.18-2.4Z" /></svg>
);
export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
);
export const ChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
);
export const ArrowLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
);
export const Clock = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Play = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="6 4 20 12 6 20" /></svg>
);
export const Target = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>
);
export const Bolt = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 4.5 13.2a.7.7 0 0 0 .55 1.12H10l-1.4 7.3a.5.5 0 0 0 .9.38L19.5 10.8a.7.7 0 0 0-.56-1.12H14l1.36-7.06A.55.55 0 0 0 13 2Z" /></svg>
);
export const Pulse = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 12h4l2-6 4 14 2-8h6" /></svg>
);
export const Heart = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 20.5 4.2 13a4.6 4.6 0 0 1 6.5-6.5l1.3 1.3 1.3-1.3A4.6 4.6 0 0 1 19.8 13Z" /></svg>
);
export const Leaf = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 18c0-7 5-12 14-12 0 9-5 14-12 14-2 0-2-2-2-2Z" /><path d="M9 15c2-3 5-5 8-6" /></svg>
);
export const Trophy = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4.5a2 2 0 0 0 0 4H7M17 5h2.5a2 2 0 0 1 0 4H17" /><path d="M10 12.5V16M14 12.5V16M8.5 20h7M9.5 16h5l.5 4h-6Z" /></svg>
);
export const Medal = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="14.5" r="5" /><path d="M8.5 9.8 6 3.5h4l2 4M15.5 9.8 18 3.5h-4l-2 4" /><path d="M12 12.7l.9 1.7 1.9.2-1.4 1.3.4 1.9-1.8-1-1.8 1 .4-1.9-1.4-1.3 1.9-.2Z" /></svg>
);
export const Flag = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 21V4" /><path d="M5 4.5h11l-1.6 3.2L16 11H5" /></svg>
);
export const Chart = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 17l5-5 4 3 8-9" /><path d="M16 6h4v4" /></svg>
);
export const Bars = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="11" width="4" height="9" rx="1" /><rect x="10" y="6" width="4" height="14" rx="1" /><rect x="17" y="13" width="4" height="7" rx="1" /></svg>
);
export const Check = (p: IconProps) => (
  <svg {...base({ strokeWidth: 2.6, ...p })}><path d="M4 12.5l5 5 11-11" /></svg>
);
export const Chat = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 16.5H9l-4.5 4V16.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5Z" /></svg>
);
export const Calendar = EventsOutline;
export const Spark = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2.4 14.2 8.4 20.6 10.5 14.2 12.6 12 18.6 9.8 12.6 3.4 10.5 9.8 8.4Z" /></svg>
);
export const Lock = (p: IconProps) => (
  <svg {...base(p)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
