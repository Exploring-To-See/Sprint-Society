// Sculpted aurora field — the single lit volume behind every redesigned screen.
// Decorative only (aria-hidden, pointer-events:none). Fixed to the viewport so it
// stays put while content scrolls. One detuned drift loop; killed under reduced-motion.
export function SSAura() {
  return (
    <div className="ss-aura" aria-hidden="true">
      <div className="aurora">
        <div className="mesh" />
        <div className="sweep" />
        <div className="ray" />
        <div className="vignette" />
        <div className="grain" />
      </div>
      <div className="veil" />
    </div>
  );
}
