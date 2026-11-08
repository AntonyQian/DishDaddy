'use client';

import Lenis from 'lenis';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { gsap, ScrollTrigger } from '@/lib/gsap';

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/** Inertia scrolling, driven by GSAP's ticker so ScrollTrigger and the 3D scene see the same scroll position. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Each page starts at its top, with the 3D scene at progress 0.
    history.scrollRestoration = 'manual';
    const instance = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
