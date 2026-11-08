'use client';

import { useGSAP } from '@gsap/react';
import type { RecipeMatch } from '@fridge/shared';
import { motion } from 'framer-motion';
import { Clock, Flame, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { BookmarkButton } from '@/components/BookmarkButton';
import { BowlScene } from '@/components/three/scenes';
import { CountUp } from '@/components/ui/CountUp';
import { GlowButton } from '@/components/ui/GlowButton';
import { Magnetic } from '@/components/ui/Magnetic';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { SplitReveal } from '@/components/ui/SplitReveal';
import { searchRecipes } from '@/lib/api';
import { cn } from '@/lib/cn';
import { gsap, ScrollTrigger, scrollState } from '@/lib/gsap';
import { useKitchen } from '@/lib/kitchen';
import { useEquipment, useStaples } from '@/lib/usePrefs';
import { applyFilters, countFilters, FILTER_LABELS, ingredientCounts, matchesQuery, type MatchFilter } from '@/lib/matchFilters';

const FILTERS = Object.keys(FILTER_LABELS) as MatchFilter[];

function RecipeCard({ m }: { m: RecipeMatch }) {
  const { have, total } = ingredientCounts(m);
  const ready = m.missing.length === 0;
  return (
    <div className="recipe-card">
      <SpotlightCard className="flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          {m.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.imageUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
          <span className={cn('absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md', ready ? 'bg-brand/80 text-white' : 'bg-white/15 text-white')}>
            {ready ? 'In stock' : `Missing ${m.missing.length}`}
          </span>
          <BookmarkButton recipe={m.recipeId} className="absolute right-4 top-4" />
          <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold backdrop-blur-md">
            <Clock className="size-3.5" /> {m.minutes} min
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <h3 className="text-2xl font-extrabold leading-[1.05] tracking-[-0.03em]">{m.name}</h3>
          {m.calories !== undefined && (
            <div className="flex items-center gap-2 text-sm font-semibold text-fg-dim" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <Flame className="size-4 text-brand-soft" /> {m.calories} kcal · {m.proteinGrams} g protein <span className="text-fg-mute">per serving</span>
            </div>
          )}
          <div className="mt-auto space-y-4 pt-2">
            <div>
              <div className="mb-2 flex justify-between text-xs font-bold text-fg-dim">
                <span>You have {have} of {total}</span>
                {!ready && <span className="truncate pl-4 text-fg-mute">Missing {m.missing.slice(0, 2).join(', ')}</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-soft" initial={{ width: 0 }} whileInView={{ width: `${(have / total) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} />
              </div>
            </div>
            <GlowButton arrow variant={ready ? 'primary' : 'glass'} href={`/cook?id=${m.recipeId}`} className="w-full">Cook now</GlowButton>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}

export default function RecipesPage() {
  const { items } = useKitchen();
  const [staples] = useStaples();
  const [equipment] = useEquipment();
  const [matches, setMatches] = useState<RecipeMatch[] | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState<ReadonlySet<MatchFilter>>(new Set());
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLElement>(null);

  useEffect(() => {
    if (items === null) return;
    if (items.length === 0) return setMatches([]);
    let live = true;
    searchRecipes(items, staples, equipment).then((m) => live && (setMatches(m), setError(false)), () => live && setError(true));
    return () => { live = false; };
  }, [items, staples, equipment]);

  const counts = countFilters(matches ?? []);
  const shown = (matches ? applyFilters(matches, active).filter((m) => matchesQuery(m, query)) : []);
  const filterKey = `${[...active].join()}|${query}|${matches?.length}`;
  const toggle = (f: MatchFilter) => setActive((a) => { const n = new Set(a); if (!n.delete(f)) n.add(f); return n; });

  useGSAP(() => {
    ScrollTrigger.create({ trigger: head.current, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => { scrollState.hero = s.progress; } });
    gsap.to('[data-parallax="count"]', { yPercent: -25, ease: 'none', scrollTrigger: { trigger: head.current, start: 'top top', end: 'bottom top', scrub: true } });
    return () => { scrollState.hero = 0; };
  }, { scope: root });

  // Each time the list changes, its cards rise in as they scroll into view, in small staggered batches.
  useGSAP(() => {
    gsap.set('.recipe-card', { opacity: 0, y: 70 });
    ScrollTrigger.batch('.recipe-card', {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out', overwrite: true }),
    });
    ScrollTrigger.refresh();
  }, { scope: root, dependencies: [filterKey], revertOnUpdate: true });

  return (
    <div ref={root}>
      <section ref={head} className="relative min-h-[88svh] overflow-hidden px-5 pb-20 pt-36 md:px-10">
        <BowlScene className="absolute inset-0 md:left-[30%] [mask-image:radial-gradient(ellipse_60%_60%_at_55%_48%,black_45%,transparent_100%)]" />
        <div className="relative z-10 mx-auto max-w-[1500px]">
          <div data-parallax="count">
            <div className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-soft">
              <span className="size-1.5 rounded-full bg-brand-hi shadow-[0_0_12px_#6067df]" /> Matched to your kitchen
            </div>
            <div className="flex items-end gap-6">
              <CountUp value={counts.ready} className="text-outline-brand text-[clamp(7rem,24vw,22rem)] font-extrabold leading-[0.8] tracking-[-0.07em]" />
              <div className="pb-[1.6vw]">
                <SplitReveal as="h1" text="Ready to cook" outline={['cook']} className="text-[clamp(2.4rem,6vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.05em]" delay={0.2} />
                <p className="mt-4 max-w-sm text-lg font-medium text-fg-dim">Recipes you can make right now with what is already in your kitchen.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1500px] px-5 pb-32 md:px-10">
        <div className="glass-dark sticky top-24 z-30 mb-10 flex flex-col gap-4 rounded-[2rem] p-3 md:flex-row md:items-center">
          <label className="flex flex-1 items-center gap-3 rounded-full bg-white/5 px-5 py-3">
            <Search className="size-5 text-fg-mute" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes…" aria-label="Search recipes" className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-fg-mute" />
            {query && <button aria-label="Clear search" onClick={() => setQuery('')}><X className="size-4 text-fg-mute" /></button>}
          </label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {[['all', 'All'] as const, ...FILTERS.map((f) => [f, FILTER_LABELS[f]] as const)].map(([f, label]) => {
              const on = f === 'all' ? active.size === 0 : active.has(f as MatchFilter);
              return (
                <button key={f} onClick={() => (f === 'all' ? setActive(new Set()) : toggle(f as MatchFilter))} className={cn('relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors', on ? 'text-white' : 'text-fg-dim hover:text-fg')}>
                  {on && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-gradient-to-b from-brand-hi to-brand shadow-[0_8px_26px_-6px_rgb(96_103_223/0.9)]" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                  <span className="relative">{label}</span>
                  <span className="relative rounded-full bg-white/15 px-2 py-0.5 text-xs">{counts[f as MatchFilter | 'all']}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <Empty title="Can't reach the recipe server" text="Start it with npm run server, then reload." />
        ) : items && items.length === 0 ? (
          <Empty title="Your kitchen is empty" text="Add what you have and recipes show up here." action={<GlowButton href="/" arrow>Go to Kitchen</GlowButton>} />
        ) : matches === null ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="glass aspect-[4/5] animate-pulse rounded-[2rem]" />)}</div>
        ) : shown.length === 0 ? (
          <Empty title="No recipes match" text="Try a different search or turn a filter off." action={<GlowButton onClick={() => { setActive(new Set()); setQuery(''); }}>Clear filters</GlowButton>} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((m) => <RecipeCard key={m.recipeId} m={m} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="glass flex flex-col items-center gap-4 rounded-[2.5rem] px-6 py-24 text-center">
      <div className="text-6xl">🥗</div>
      <h3 className="text-3xl font-extrabold tracking-tight">{title}</h3>
      <p className="max-w-sm text-fg-dim">{text}</p>
      {action && <Magnetic>{action}</Magnetic>}
    </div>
  );
}
