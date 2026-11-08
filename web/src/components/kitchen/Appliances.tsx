'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

import { SplitReveal } from '@/components/ui/SplitReveal';
import { cn } from '@/lib/cn';
import { ALL_EQUIPMENT, equipmentLabel, toggleEquipment } from '@/lib/prefs';
import { useEquipment } from '@/lib/usePrefs';

const PICTURE: Record<string, string> = {
  hob: '🍳', oven: '♨️', grill: '🥩', microwave: '🍿', blender: '🥤', mixer: '🧁', 'meat grinder': '⚙️',
  'slow cooker': '🍲', toaster: '🍞', 'rice cooker': '🍚', 'air fryer': '🍟', 'pressure cooker': '🥘',
};

/** The appliances the user cooks with. Recipes that need one that is switched off never show up. */
export function Appliances() {
  const [equipment, setEquipment] = useEquipment();

  return (
    <section id="appliances" className="relative mx-auto max-w-[1500px] scroll-mt-28 px-5 py-20 md:px-10">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <SplitReveal inView text="Appliances" outline={['Appliances']} className="text-[clamp(2.6rem,6.5vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.045em]" />
          <p className="mt-5 max-w-md text-lg font-medium text-fg-dim">Switch on what you cook with. Recipes only use these.</p>
        </div>
        <div className="glass-brand self-start rounded-full px-5 py-2.5 text-sm font-bold md:self-auto">
          {equipment.length} of {ALL_EQUIPMENT.length} on
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6">
        {ALL_EQUIPMENT.map((item, i) => {
          const on = equipment.includes(item);
          return (
            <motion.button
              key={item}
              role="switch"
              aria-checked={on}
              onClick={() => setEquipment(toggleEquipment(equipment, item))}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-4% 0px' }}
              transition={{ duration: 0.6, delay: (i % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={cn('group relative flex aspect-square flex-col items-start justify-between overflow-hidden rounded-[1.75rem] p-5 text-left transition-colors duration-500', on ? 'glass-brand' : 'glass opacity-70 hover:opacity-100')}>
              <span className={cn('flex size-7 items-center justify-center rounded-full border-2 transition-all duration-300', on ? 'border-white bg-white text-brand' : 'border-white/25')}>
                {on && <Check className="size-4" strokeWidth={3.5} />}
              </span>
              <motion.span animate={{ scale: on ? 1 : 0.85, filter: on ? 'grayscale(0)' : 'grayscale(1)' }} className="self-center text-5xl drop-shadow-[0_10px_20px_rgb(96_103_223/0.5)] transition-transform duration-300 group-hover:scale-110">
                {PICTURE[item]}
              </motion.span>
              <span className="text-base font-extrabold leading-tight tracking-tight">{equipmentLabel(item)}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
