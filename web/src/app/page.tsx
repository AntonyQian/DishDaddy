'use client';

import { useGSAP } from '@gsap/react';
import type { RecipeMatch } from '@fridge/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { HeroScene } from '@/components/three/scenes';
import { CountUp } from '@/components/ui/CountUp';
import { GlowButton } from '@/components/ui/GlowButton';
import { Magnetic } from '@/components/ui/Magnetic';
import { Marquee } from '@/components/ui/Marquee';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { SplitReveal } from '@/components/ui/SplitReveal';
import { searchRecipes } from '@/lib/api';
import { gsap, ScrollTrigger, scrollState } from '@/lib/gsap';
import { insertIngredient, SAMPLE_KITCHEN, useKitchen } from '@/lib/kitchen';
import { categoriesOf, categoryOf, emojiFor, type Category } from '@/lib/pantry';
import { suggest, useIngredients } from '@/lib/useIngredients';
import { cn } from '@/lib/cn';

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function useMatches(items: string[] | null) {
  const [matches, setMatches] = useState<RecipeMatch[] | null>(null);
  useEffect(() => {
    if (!items?.length) return setMatches([]);
    let live = true;
    searchRecipes(items).then((m) => live && setMatches(m), () => live && setMatches([]));
    return () => { live = false; };
  }, [items]);
  return matches;
}

function Hero({ count, ready }: { count: number; ready: number }) {
  const root = useRef<HTMLElement>(null);

  // GSAP ScrollTrigger turns scroll position into the 3D scene's progress, and drifts the headline up as it goes.
  useGSAP(() => {
    ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => { scrollState.hero = self.progress; },
    });
    gsap.to('[data-parallax="title"]', { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('[data-parallax="meta"]', { yPercent: -45, opacity: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: '60% top', scrub: true } });
    return () => { scrollState.hero = 0; };
  }, { scope: root });

  return (
    <section ref={root} className="relative min-h-[112svh] px-5 pb-24 pt-36 md:px-10">
      <HeroScene className="absolute inset-0 [mask-image:radial-gradient(ellipse_62%_58%_at_62%_46%,black_45%,transparent_100%)] md:left-[18%]" />
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <div data-parallax="title">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-soft">
            <span className="size-1.5 animate-pulse rounded-full bg-brand-hi shadow-[0_0_12px_#6067df]" /> Smart pantry
          </motion.div>
          <SplitReveal as="h1" text="What are we cooking today?" outline={['cooking']} delay={0.2} className="max-w-[10.5ch] text-[clamp(3.4rem,10vw,10.5rem)] font-extrabold leading-[0.88] tracking-[-0.055em]" />
        </div>
        <div data-parallax="meta">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }} className="mt-8 max-w-md text-lg font-medium leading-relaxed text-fg-dim">
            Snap your fridge, see what you can make, and cook it step by step. Everything below is built from what you actually have.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 0.8 }} className="mt-10 flex flex-wrap items-center gap-4">
            <Magnetic>
              <GlowButton size="lg" arrow href="#stock"><Camera className="size-5" strokeWidth={2.4} /> Scan now</GlowButton>
            </Magnetic>
            <GlowButton size="lg" variant="glass" href="/recipes">Browse recipes</GlowButton>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.8 }} className="mt-14 flex gap-4">
            <div className="glass rounded-3xl px-6 py-4">
              <div className="text-4xl font-extrabold tracking-tight"><CountUp value={count} /></div>
              <div className="text-xs font-bold uppercase tracking-widest text-fg-mute">in stock</div>
            </div>
            <div className="glass-brand rounded-3xl px-6 py-4">
              <div className="text-4xl font-extrabold tracking-tight"><CountUp value={ready} /></div>
              <div className="text-xs font-bold uppercase tracking-widest text-brand-soft">ready to cook</div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} className="flex h-12 w-7 items-start justify-center rounded-full border border-white/25 p-1.5">
          <span className="h-2 w-1 rounded-full bg-white/70" />
        </motion.div>
      </div>
    </section>
  );
}

function AddIngredient({ onAdd, vocabulary }: { onAdd: (name: string) => void; vocabulary: string[] }) {
  const [text, setText] = useState('');
  const options = suggest(text, vocabulary);
  const submit = (name: string) => {
    if (!name.trim()) return;
    onAdd(name);
    setText('');
  };
  return (
    <div className="relative z-20">
      <form onSubmit={(e) => { e.preventDefault(); submit(text); }} className="glass flex items-center gap-3 rounded-full py-2 pl-6 pr-2">
        <Plus className="size-5 text-fg-mute" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an ingredient: eggs, spinach, rice…"
          className="min-w-0 flex-1 bg-transparent py-2 text-base font-medium outline-none placeholder:text-fg-mute"
          aria-label="Add an ingredient"
        />
        <GlowButton type="submit" size="md">Add</GlowButton>
      </form>
      <AnimatePresence>
        {options.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 right-0 top-full mt-3 flex flex-wrap gap-2">
            {options.map((o) => (
              <button key={o} onClick={() => submit(o)} className="glass rounded-full px-4 py-2 text-sm font-bold transition-colors hover:border-brand-soft/60 hover:text-brand-soft">
                {capital(o)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stock({ items, set, remove, add }: { items: string[]; set: (n: string[]) => void; remove: (n: string) => void; add: (n: string) => void }) {
  const vocabulary = useIngredients();
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [undo, setUndo] = useState<{ name: string; index: number } | null>(null);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);

  const groups = categoriesOf(items);
  const active = category === 'All' || groups.some(([c]) => c === category) ? category : 'All';
  const shown = active === 'All' ? items : items.filter((i) => categoryOf(i) === active);

  return (
    <section id="stock" className="relative mx-auto max-w-[1500px] scroll-mt-28 px-5 py-24 md:px-10">
      <div className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SplitReveal inView text="Fresh in stock" outline={['stock']} className="text-[clamp(2.6rem,6.5vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.045em]" />
        <div className="w-full md:max-w-lg"><AddIngredient onAdd={add} vocabulary={vocabulary} /></div>
      </div>

      {items.length > 0 && (
        <div className="no-scrollbar mb-10 flex gap-2 overflow-x-auto pb-2">
          {([['All', items.length], ...groups] as [Category | 'All', number][]).map(([c, n]) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn('relative flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors', active === c ? 'text-white' : 'glass text-fg-dim hover:text-fg')}>
              {active === c && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-gradient-to-b from-brand-hi to-brand shadow-[0_8px_30px_-6px_rgb(96_103_223/0.9)]" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
              <span className="relative">{c}</span>
              <span className="relative rounded-full bg-white/15 px-2 py-0.5 text-xs">{n}</span>
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass flex flex-col items-center gap-5 rounded-[2.5rem] px-6 py-20 text-center">
          <div className="text-6xl">🥗</div>
          <h3 className="text-3xl font-extrabold tracking-tight">Your kitchen is empty</h3>
          <p className="max-w-sm text-fg-dim">Add what you have above and recipes appear instantly. Or start with a sample kitchen.</p>
          <GlowButton onClick={() => set(SAMPLE_KITCHEN)} arrow>Load a sample kitchen</GlowButton>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {shown.map((name, i) => (
              <motion.div
                key={name}
                layout
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-6% 0px' }}
                exit={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
                transition={{ duration: 0.7, delay: (i % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}>
                <SpotlightCard className="min-h-[19rem] p-5">
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-fg-dim">{categoryOf(name)}</span>
                      <button
                        aria-label={`Remove ${name}`}
                        onClick={() => { setUndo({ name, index: items.indexOf(name) }); remove(name); }}
                        className="rounded-full p-2 text-fg-mute transition-colors hover:bg-white/10 hover:text-white">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <motion.div whileHover={{ scale: 1.18, rotate: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} className="my-auto select-none py-6 text-center text-[5.5rem] leading-none drop-shadow-[0_18px_30px_rgb(96_103_223/0.55)]">
                      {emojiFor(name)}
                    </motion.div>
                    <div className="text-2xl font-extrabold tracking-tight">{capital(name)}</div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {undo && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="glass-dark fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-6 rounded-full py-3 pl-6 pr-3">
            <span className="text-sm font-bold capitalize">Removed {undo.name}</span>
            <GlowButton size="md" onClick={() => { set(insertIngredient(items, undo.name, undo.index)); setUndo(null); }}>Undo</GlowButton>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ChefPick({ pick }: { pick: RecipeMatch | undefined }) {
  if (!pick) return null;
  return (
    <section className="mx-auto max-w-[1500px] px-5 pb-32 md:px-10">
      <SpotlightCard tilt={2} className="rounded-[3rem]">
        <div className="grid items-center md:grid-cols-[1.1fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:h-[28rem]">
            {pick.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <motion.img initial={{ scale: 1.25 }} whileInView={{ scale: 1 }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} viewport={{ once: true }} src={pick.imageUrl} alt={pick.name} className="size-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-ink/60 max-md:bg-gradient-to-b" />
          </div>
          <div className="p-8 md:p-14">
            <div className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-soft"><Sparkles className="size-4" /> Chef suggestion</div>
            <h3 className="text-4xl font-extrabold leading-[1] tracking-[-0.035em] md:text-6xl">{pick.name}</h3>
            <p className="mt-5 text-lg font-medium text-fg-dim">
              Ready in {pick.minutes} min with what you already have.
              {pick.calories !== undefined && <> About {pick.calories} kcal and {pick.proteinGrams} g protein per serving.</>}
            </p>
            <div className="mt-9"><Magnetic><GlowButton size="lg" arrow href={`/cook?id=${pick.recipeId}`}>Cook now</GlowButton></Magnetic></div>
          </div>
        </div>
      </SpotlightCard>
    </section>
  );
}

export default function KitchenPage() {
  const { items, set, add, remove } = useKitchen();
  const matches = useMatches(items);
  const ready = matches?.filter((m) => m.missing.length === 0) ?? [];
  const names = items?.length ? items.map(capital) : ['Eggs', 'Milk', 'Spinach', 'Tomatoes', 'Butter', 'Rice', 'Cheddar'];

  return (
    <>
      <Hero count={items?.length ?? 0} ready={ready.length} />
      <Marquee items={names} speed={Math.max(24, names.length * 5)} className="text-outline border-y border-white/10 py-6 text-[clamp(2.5rem,7vw,6rem)] font-extrabold uppercase leading-none tracking-[-0.04em]" />
      <Stock items={items ?? []} set={set} remove={remove} add={add} />
      <ChefPick pick={ready[0]} />
      <footer className="border-t border-white/10 px-5 py-10 text-center text-sm font-medium text-fg-mute">DishDaddy. Cook with what you have.</footer>
    </>
  );
}
