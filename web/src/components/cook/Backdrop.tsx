/** The Cook Mode background: three slow indigo and violet glows drifting over black, under a soft vignette. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      <div className="absolute -left-[15vw] -top-[10vh] size-[70vw] rounded-full opacity-70 blur-[110px]" style={{ background: 'radial-gradient(circle, #474dc5 0%, transparent 65%)', animation: 'drift-a 18s ease-in-out infinite' }} />
      <div className="absolute -right-[18vw] top-[25vh] size-[62vw] rounded-full opacity-55 blur-[120px]" style={{ background: 'radial-gradient(circle, #8a5bd6 0%, transparent 65%)', animation: 'drift-b 24s ease-in-out infinite' }} />
      <div className="absolute bottom-[-30vh] left-[20vw] size-[60vw] rounded-full opacity-40 blur-[130px]" style={{ background: 'radial-gradient(circle, #6067df 0%, transparent 65%)', animation: 'drift-a 30s ease-in-out infinite reverse' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgb(5 5 7 / 0.6) 100%)' }} />
    </div>
  );
}
