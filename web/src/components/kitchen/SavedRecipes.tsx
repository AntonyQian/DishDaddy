'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';

import { BookmarkButton } from '@/components/BookmarkButton';
import { GlowButton } from '@/components/ui/GlowButton';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { SplitReveal } from '@/components/ui/SplitReveal';
import { useSaved } from '@/lib/usePrefs';

/** The recipes bookmarked from the Recipes page or Cook Mode, kept in full so they open instantly. */
export function SavedRecipes() {
  const { saved } = useSaved();

  return (
    <section id="saved" className="relative mx-auto max-w-[1500px] scroll-mt-28 px-5 py-20 md:px-10">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <SplitReveal inView text="Saved recipes" outline={['recipes']} className="text-[clamp(2.6rem,6.5vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.045em]" />
          <p className="mt-5 max-w-md text-lg font-medium text-fg-dim">The ones you want to cook again.</p>
        </div>
        {saved.length > 0 && <div className="glass-brand self-start rounded-full px-5 py-2.5 text-sm font-bold md:self-auto">{saved.length} saved</div>}
      </div>

      {saved.length === 0 ? (
        <div className="glass flex flex-col items-center gap-4 rounded-[2.5rem] px-6 py-16 text-center">
          <div className="text-5xl">🔖</div>
          <h3 className="text-2xl font-extrabold tracking-tight">Nothing saved yet</h3>
          <p className="max-w-sm text-fg-dim">Tap the bookmark on any recipe and it waits for you here.</p>
          <GlowButton href="/recipes" arrow>Find recipes</GlowButton>
        </div>
      ) : (
        <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {saved.map((r, i) => (
              <motion.div key={r.id} layout initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} exit={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }} transition={{ duration: 0.6, delay: (i % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}>
                <SpotlightCard className="flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {r.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-110" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                    <BookmarkButton recipe={r} className="absolute right-3 top-3" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="text-xl font-extrabold leading-[1.1] tracking-[-0.025em]">{r.name}</h3>
                    <div className="flex items-center gap-4 text-sm font-semibold text-fg-dim" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <span className="flex items-center gap-1.5"><Clock className="size-4" /> {r.minutes} min</span>
                      {r.calories !== undefined && <span className="flex items-center gap-1.5"><Flame className="size-4 text-brand-soft" /> {r.calories} kcal</span>}
                    </div>
                    <GlowButton arrow href={`/recipes/view?id=${r.id}`} className="mt-auto w-full">View recipe</GlowButton>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
