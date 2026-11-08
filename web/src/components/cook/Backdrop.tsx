'use client';

import { useEffect, useRef } from 'react';

import { scrollState } from '@/lib/gsap';

export const BACKDROPS = [
  { id: 'aurora', label: 'Aurora', hint: 'Slow drifting indigo light' },
  { id: 'spotlight', label: 'Spotlight', hint: 'A soft light that follows your pointer' },
  { id: 'glow', label: 'Step glow', hint: 'Light that travels and warms as you cook' },
  { id: 'stove', label: 'Stove', hint: 'A warm, flickering glow from below' },
] as const;
export type BackdropId = (typeof BACKDROPS)[number]['id'];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Indigo at the start of a recipe, warming to gold at the end.
const STOPS = [[71, 77, 197], [138, 91, 214], [255, 122, 89], [252, 207, 90]];
function warmth(p: number): string {
  const x = Math.min(0.9999, Math.max(0, p)) * (STOPS.length - 1);
  const i = Math.floor(x);
  const t = x - i;
  return STOPS[i].map((c, k) => Math.round(lerp(c, STOPS[i + 1][k], t))).join(' ');
}

/**
 * The Cook Mode background: soft dynamic light on black. One animation loop writes a few CSS variables
 * (smoothed pointer, recipe progress, a flicker value) and each variant is just gradients that read them.
 */
export function Backdrop({ variant }: { variant: BackdropId }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const pointer = { x: 0.5, y: 0.5 };
    const eased = { x: 0.5, y: 0.5, p: 0 };
    const onMove = (e: PointerEvent) => { pointer.x = e.clientX / innerWidth; pointer.y = e.clientY / innerHeight; };
    window.addEventListener('pointermove', onMove);
    let frame = 0;
    const tick = (now: number) => {
      const t = now / 1000;
      eased.x = lerp(eased.x, pointer.x, 0.06);
      eased.y = lerp(eased.y, pointer.y, 0.06);
      eased.p = lerp(eased.p, scrollState.cook, 0.05);
      // A candle-like flicker: a few sine waves that never line up.
      const flicker = 0.78 + 0.1 * Math.sin(t * 2.3) + 0.07 * Math.sin(t * 5.1 + 1) + 0.05 * Math.sin(t * 9.7 + 2);
      el.style.setProperty('--px', `${(eased.x * 100).toFixed(2)}%`);
      el.style.setProperty('--py', `${(eased.y * 100).toFixed(2)}%`);
      el.style.setProperty('--gx', `${(12 + eased.p * 76).toFixed(2)}%`);
      el.style.setProperty('--gy', `${(30 + Math.sin(eased.p * Math.PI * 2) * 18).toFixed(2)}%`);
      el.style.setProperty('--glow', warmth(eased.p));
      el.style.setProperty('--flicker', flicker.toFixed(3));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', onMove); };
  }, []);

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      {variant === 'aurora' && (
        <>
          <div className="absolute -left-[15vw] -top-[10vh] size-[70vw] rounded-full opacity-70 blur-[110px]" style={{ background: 'radial-gradient(circle, #474dc5 0%, transparent 65%)', animation: 'drift-a 18s ease-in-out infinite' }} />
          <div className="absolute -right-[18vw] top-[25vh] size-[62vw] rounded-full opacity-55 blur-[120px]" style={{ background: 'radial-gradient(circle, #8a5bd6 0%, transparent 65%)', animation: 'drift-b 24s ease-in-out infinite' }} />
          <div className="absolute bottom-[-30vh] left-[20vw] size-[60vw] rounded-full opacity-40 blur-[130px]" style={{ background: 'radial-gradient(circle, #6067df 0%, transparent 65%)', animation: 'drift-a 30s ease-in-out infinite reverse' }} />
        </>
      )}
      {variant === 'spotlight' && (
        <>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(38vmax circle at var(--px) var(--py), rgb(191 194 255 / 0.4), rgb(96 103 223 / 0.2) 40%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(70vmax circle at calc(100% - var(--px)) calc(100% - var(--py)), rgb(71 77 197 / 0.22), transparent 65%)' }} />
        </>
      )}
      {variant === 'glow' && (
        <>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(58vmax circle at var(--gx) var(--gy), rgb(var(--glow) / 0.8), rgb(var(--glow) / 0.28) 45%, transparent 75%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(80vmax circle at 85% 110%, rgb(var(--glow) / 0.18), transparent 60%)' }} />
        </>
      )}
      {variant === 'stove' && (
        <>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(95vmax 62vmax at 50% 118%, rgb(255 122 89 / calc(0.95 * var(--flicker))), rgb(252 207 90 / calc(0.3 * var(--flicker))) 45%, transparent 75%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(60vmax 40vmax at 50% -10%, rgb(71 77 197 / 0.28), transparent 70%)' }} />
        </>
      )}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgb(5 5 7 / 0.6) 100%)' }} />
    </div>
  );
}
