'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

const MotionLink = motion.create(Link);

type Props = {
  children: ReactNode;
  variant?: 'primary' | 'glass' | 'ghost';
  size?: 'md' | 'lg';
  arrow?: boolean;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  'aria-label'?: string;
} & Omit<ComponentProps<'button'>, 'children' | 'className' | 'onClick' | 'type' | 'disabled'>;

const looks = {
  primary:
    'bg-gradient-to-b from-brand-hi to-brand text-white shadow-[0_14px_50px_-10px_rgb(96_103_223/0.9),inset_0_1px_0_rgb(255_255_255/0.45)] hover:shadow-[0_18px_70px_-8px_rgb(96_103_223/1),inset_0_1px_0_rgb(255_255_255/0.6)]',
  glass: 'glass text-fg hover:border-white/25',
  ghost: 'text-fg-dim hover:text-fg',
} as const;

/**
 * A button that reacts: a light follows the pointer across it, a sheen sweeps over it on hover,
 * it dips when pressed, and its arrow slides forward.
 */
export function GlowButton({ children, variant = 'primary', size = 'md', arrow, className, href, onClick, type = 'button', disabled, ...rest }: Props) {
  const classes = cn(
    'sheen group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-bold tracking-tight transition-[box-shadow,border-color,color] duration-300 disabled:opacity-40',
    size === 'lg' ? 'px-8 py-4 text-base' : 'px-5 py-2.5 text-sm',
    looks[variant],
    className,
  );
  const motionProps = {
    whileHover: { scale: 1.035 },
    whileTap: { scale: 0.96 },
    transition: { type: 'spring' as const, stiffness: 420, damping: 22 },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
  };
  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(120px circle at var(--mx, 50%) var(--my, 50%), rgb(255 255 255 / 0.28), transparent 70%)' }}
      />
      <span className="relative z-10">{children}</span>
      {arrow && <ArrowRight className="relative z-10 size-[1.1em] transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.6} />}
    </>
  );

  if (href) {
    return (
      <MotionLink href={href} className={classes} {...motionProps}>
        {inner}
      </MotionLink>
    );
  }
  return (
    <motion.button type={type} disabled={disabled} onClick={onClick} className={classes} {...motionProps} {...(rest as object)}>
      {inner}
    </motion.button>
  );
}
