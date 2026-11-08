/** The page's backdrop: two drifting indigo glows, a faint grid, and a vignette, all behind the content. */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div
        className="absolute -left-[12vw] -top-[18vh] size-[62vw] rounded-full opacity-60 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #474dc5 0%, transparent 65%)', animation: 'drift-a 22s ease-in-out infinite' }}
      />
      <div
        className="absolute -right-[16vw] top-[30vh] size-[55vw] rounded-full opacity-40 blur-[130px]"
        style={{ background: 'radial-gradient(circle, #6067df 0%, transparent 65%)', animation: 'drift-b 28s ease-in-out infinite' }}
      />
      <div className="bg-grid absolute inset-0" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 120%, transparent 40%, #050507 100%)' }} />
    </div>
  );
}
