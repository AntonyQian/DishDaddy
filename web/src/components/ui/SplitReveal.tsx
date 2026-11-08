'use client';

import { motion } from 'framer-motion';
import type { ElementType } from 'react';

import { cn } from '@/lib/cn';

/** A headline whose words rise out of a mask one after another. Words listed in `outline` are drawn as outlines. */
export function SplitReveal({
  text, as: Tag = 'h2', className, delay = 0, outline = [], inView = false,
}: { text: string; as?: ElementType; className?: string; delay?: number; outline?: string[]; inView?: boolean }) {
  const words = text.split(' ');
  const trigger = inView ? { whileInView: { y: '0%' }, viewport: { once: true, margin: '-10% 0px' } } : { animate: { y: '0%' } };
  return (
    <Tag className={cn('flex flex-wrap gap-x-[0.28em]', className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em]" aria-hidden>
          <motion.span
            className={cn('inline-block', outline.includes(w.replace(/[^\w]/g, '')) && 'text-outline-brand')}
            initial={{ y: '115%' }}
            {...trigger}
            transition={{ duration: 1, delay: delay + i * 0.07, ease: [0.16, 1, 0.3, 1] }}>
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
