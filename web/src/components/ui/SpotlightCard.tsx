'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/** A glass card with a light that follows the pointer and a gentle 3D tilt. */
export function SpotlightCard({ children, className, tilt = 5 }: { children: ReactNode; className?: string; tilt?: number }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [tilt, -tilt]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), { stiffness: 180, damping: 18 });

  return (
    <div style={{ perspective: 900 }} className="h-full">
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
          e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
          e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
        className={cn('glass group relative h-full overflow-hidden rounded-[2rem]', className)}>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(360px circle at var(--x, 50%) var(--y, 50%), rgb(96 103 223 / 0.28), transparent 60%)' }}
        />
        <div className="relative h-full">{children}</div>
      </motion.div>
    </div>
  );
}
