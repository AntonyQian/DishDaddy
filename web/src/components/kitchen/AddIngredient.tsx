'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { GlowButton } from '@/components/ui/GlowButton';
import { suggest } from '@/lib/useIngredients';

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A glass input that suggests ingredient names as you type. */
export function AddIngredient({ onAdd, vocabulary, placeholder = 'Add an ingredient: eggs, spinach, rice…', label = 'Add an ingredient' }: { onAdd: (name: string) => void; vocabulary: string[]; placeholder?: string; label?: string }) {
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
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent py-2 text-base font-medium outline-none placeholder:text-fg-mute"
          aria-label={label}
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

