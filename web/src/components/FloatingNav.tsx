'use client';

import { motion } from 'framer-motion';
import { BookOpen, Flame, Refrigerator } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

const TABS = [
  { href: '/', label: 'Kitchen', icon: Refrigerator },
  { href: '/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/cook', label: 'Cook Mode', icon: Flame },
] as const;

/** The three pages as a floating glass pill; the active page is a solid indigo capsule that slides between tabs. */
export function FloatingNav() {
  const pathname = usePathname();
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 pt-5 md:px-10">
      <Link href="/" className="pointer-events-auto flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="" className="size-10 rounded-full ring-1 ring-white/20" />
        <span className="hidden text-lg font-extrabold tracking-tight sm:block">DishDaddy</span>
      </Link>
      <nav className="glass-dark pointer-events-auto flex items-center gap-1 rounded-full p-1.5" aria-label="Pages">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn('relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors', active ? 'text-white' : 'text-fg-dim hover:text-fg')}>
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-brand-hi to-brand shadow-[0_8px_30px_-6px_rgb(96_103_223/0.9),inset_0_1px_0_rgb(255_255_255/0.4)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative size-4" strokeWidth={2.4} />
              <span className="relative hidden sm:block">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="w-10 sm:w-[7.5rem]" />
    </header>
  );
}
