'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/** Pulls its child toward the pointer while the pointer is near it, and springs back when it leaves. */
export function Magnetic({ children, strength = 0.3, className }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.35 });

  return (
    <motion.div
      className={cn('inline-block', className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}>
      {children}
    </motion.div>
  );
}
