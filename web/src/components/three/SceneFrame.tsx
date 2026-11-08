'use client';

import { useInView } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { pointerState } from '@/lib/gsap';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Holds a 3D canvas. It checks the device can draw WebGL, and tells the scene whether it is on screen
 * so it can stop rendering when scrolled out of view. Without WebGL it shows a soft glow instead.
 */
export function SceneFrame({ children, className }: { children: (visible: boolean) => ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: '200px' });
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(hasWebGL()), []);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointerState.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerState.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {ok === false && <div className="absolute inset-0 m-auto size-[60%] rounded-full bg-brand/30 blur-3xl" />}
      {ok && children(visible)}
    </div>
  );
}
