'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { SplitReveal } from '@/components/ui/SplitReveal';
import { addStaple, removeStaple } from '@/lib/prefs';
import { groupStaples } from '@/lib/staples';
import { useIngredients } from '@/lib/useIngredients';
import { useStaples } from '@/lib/usePrefs';
import { AddIngredient } from './AddIngredient';

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The things always on hand: sauces, seasonings, oils, baking basics. Recipes never list these as missing. */
export function Essentials() {
  const [staples, setStaples] = useStaples();
  const vocabulary = useIngredients();
  const groups = groupStaples(staples);

  return (
    <section id="essentials" className="relative mx-auto max-w-[1500px] scroll-mt-28 px-5 py-20 md:px-10">
      <div className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <SplitReveal inView text="Cooking essentials" outline={['essentials']} className="text-[clamp(2.6rem,6.5vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.045em]" />
          <p className="mt-5 max-w-md text-lg font-medium text-fg-dim">Always on hand, so recipes never count them as missing.</p>
        </div>
        <div className="w-full md:max-w-lg">
          <AddIngredient vocabulary={vocabulary} onAdd={(n) => setStaples(addStaple(staples, n))} placeholder="Add an essential: soy sauce, cumin…" label="Add a cooking essential" />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glass rounded-[2.5rem] px-6 py-16 text-center text-fg-dim">No essentials yet. Add the things you always have.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map(([group, items], g) => (
            <motion.div key={group} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-6% 0px' }} transition={{ duration: 0.7, delay: (g % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}>
              <SpotlightCard tilt={3} className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xl font-extrabold tracking-tight">{group}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{items.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((s) => (
                      <motion.button
                        key={s}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setStaples(removeStaple(staples, s))}
                        aria-label={`Remove ${s}`}
                        className="group/chip flex items-center gap-2 rounded-full bg-white/8 py-2 pl-4 pr-3 text-sm font-bold transition-colors hover:bg-white/15">
                        {capital(s)}
                        <X className="size-3.5 text-fg-mute transition-colors group-hover/chip:text-white" strokeWidth={3} />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
