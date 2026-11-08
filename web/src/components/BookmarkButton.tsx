'use client';

import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/cn';
import { useSaved } from '@/lib/usePrefs';

/** Saves or unsaves a recipe in the browser. Takes the recipe, or just its id and fetches it on first save. */
export function BookmarkButton({ recipe, className }: { recipe: Parameters<ReturnType<typeof useSaved>['toggle']>[0]; className?: string }) {
  const { isSaved, toggle } = useSaved();
  const [busy, setBusy] = useState(false);
  const id = typeof recipe === 'string' ? recipe : recipe.id;
  const saved = isSaved(id);

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      disabled={busy}
      aria-label={saved ? 'Unsave recipe' : 'Save recipe'}
      aria-pressed={saved}
      onClick={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await toggle(recipe);
        } finally {
          setBusy(false);
        }
      }}
      className={cn('flex size-11 items-center justify-center rounded-full backdrop-blur-md transition-colors', saved ? 'bg-brand text-white shadow-[0_8px_26px_-6px_rgb(96_103_223/0.9)]' : 'bg-black/45 text-white hover:bg-black/65', className)}>
      <Bookmark className="size-5" strokeWidth={2.4} fill={saved ? 'currentColor' : 'none'} />
    </motion.button>
  );
}
