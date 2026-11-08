'use client';

import { animate, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/** A number that counts up to its value when it scrolls into view, and re-counts when the value changes. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from.current, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => {
        from.current = value;
      },
    });
    return () => controls.stop();
  }, [value, inView]);

  return <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{shown}</span>;
}
