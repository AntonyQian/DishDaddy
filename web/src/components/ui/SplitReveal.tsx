'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, type ElementType } from 'react';

import { cn } from '@/lib/cn';

/**
 * A headline whose words rise out of a mask one after another. Words listed in `outline` are drawn as outlines.
 * With `inView` it waits until the heading scrolls into view. The trigger watches the heading itself, not the words,
 * because the words start hidden inside the mask and a clipped element never counts as visible.
 */
export function SplitReveal({
  text, as: Tag = 'h2', className, delay = 0, outline = [], inView = false,
}: { text: string; as?: ElementType; className?: string; delay?: number; outline?: string[]; inView?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, margin: '-10% 0px' });
  const go = inView ? seen : true;
  const words = text.split(' ');

  return (
    <Tag ref={ref} className={cn('flex flex-wrap gap-x-[0.28em]', className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em]" aria-hidden>
          <motion.span
            className={cn('inline-block', outline.includes(w.replace(/[^\w]/g, '')) && 'text-outline-brand')}
            initial={{ y: '115%' }}
            animate={{ y: go ? '0%' : '115%' }}
            transition={{ duration: 1, delay: go ? delay + i * 0.07 : 0, ease: [0.16, 1, 0.3, 1] }}>
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
