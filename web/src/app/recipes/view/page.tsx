'use client';

import type { Recipe, Substitution } from '@fridge/shared';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock, Flame, Minus, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { BookmarkButton } from '@/components/BookmarkButton';
import { GlowButton } from '@/components/ui/GlowButton';
import { getRecipe, getSubstitutions } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useKitchen } from '@/lib/kitchen';
import { missingIngredients, norm } from '@/lib/missing';
import { difficultyOf } from '@/lib/recipeFacts';
import { portionNutrition, scaleAmount, scaleStep, spaceFractions } from '@/lib/scale';
import {
  acceptSwap, hasOpenSwaps, isStillMissing, offerSwaps, rejectSwap, startSwaps, swapLabel, visibleSwaps,
  type Swap,
} from '@/lib/substitutions';
import { equipmentLabel } from '@/lib/prefs';
import { useStaples } from '@/lib/usePrefs';
import { useServings } from '@/lib/useServings';

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Suggest = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'done' };

function SwapRow({ swap, onAccept, onReject }: { swap: Swap; onAccept: () => void; onReject: () => void }) {
  const accepted = swap.status === 'accepted';
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={cn('ml-4 space-y-3 rounded-2xl border p-4', accepted ? 'border-brand-soft/40 bg-brand/15' : 'border-ember/40 bg-ember/10')}>
      <div className="font-bold">{accepted ? `Using ${swap.use.join(' + ')}` : swapLabel(swap)}</div>
      {!!swap.note && <p className="text-sm text-fg-dim">{swap.note}</p>}
      {!accepted && (
        <div className="flex gap-2">
          <GlowButton onClick={onAccept} className="flex-1">Accept</GlowButton>
          <GlowButton variant="glass" onClick={onReject} className="flex-1">Reject</GlowButton>
        </div>
      )}
    </motion.div>
  );
}

function Detail({ recipe, have }: { recipe: Recipe; have: { ingredients: string[]; staples: string[] } }) {
  const missing = useMemo(() => missingIngredients(recipe, have), [recipe, have]);
  const [swaps, setSwaps] = useState(() => startSwaps(missing));
  const [suggest, setSuggest] = useState<Suggest>({ status: 'idle' });
  const [servings, changeServings] = useServings();

  const factor = servings / Math.max(1, recipe.servings);
  const nutrition = portionNutrition({ calories: recipe.calories, proteinGrams: recipe.proteinGrams }, servings);

  async function suggestSubstitutions() {
    setSuggest({ status: 'loading' });
    try {
      const found: Substitution[] = await getSubstitutions(recipe.id, have);
      setSwaps((s) => offerSwaps(s, found));
      setSuggest({ status: 'done' });
    } catch (e) {
      setSuggest({ status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }

  const offered = swaps.swaps.length > 0;
  const canSuggest = swaps.missing.size > 0 && !hasOpenSwaps(swaps) && (suggest.status === 'idle' || suggest.status === 'done');
  const available = recipe.ingredients.filter((i) => !isStillMissing(swaps, i.ingredient)).length;
  // Swaps show once per Missing Ingredient, under its first row, even when the Recipe lists it twice.
  const swapRows = new Set<number>();
  const seen = new Set<string>();
  recipe.ingredients.forEach((i, n) => {
    const item = norm(i.ingredient);
    if (seen.has(item)) return;
    seen.add(item);
    if ([...missing].some((m) => norm(m) === item)) swapRows.add(n);
  });

  const tags = [recipe.cuisine !== 'Other' ? recipe.cuisine : null, ...recipe.equipment.map(equipmentLabel)].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-5xl px-5 pb-40 pt-28 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/recipes" className="glass-dark flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-fg-dim transition-colors hover:text-fg">
          <ArrowLeft className="size-4" /> All recipes
        </Link>
        <BookmarkButton recipe={recipe} className="size-12" />
      </div>

      <section className="glass overflow-hidden rounded-[2.5rem]">
        <div className="relative aspect-[16/9] md:aspect-[2/1]">
          {recipe.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.imageUrl} alt="" className="size-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
          <span className="absolute bottom-5 right-5 flex items-center gap-1.5 rounded-full bg-black/55 px-4 py-2 text-sm font-bold backdrop-blur-md">
            <Clock className="size-4" /> {difficultyOf(recipe)} · {recipe.minutes}m
          </span>
        </div>
        <div className="space-y-6 p-6 md:p-10">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => <span key={t} className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-fg-dim">{t}</span>)}
            </div>
          )}
          <h1 className="text-[clamp(2.2rem,5vw,4.2rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">{recipe.name}</h1>
          {nutrition.calories !== undefined && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <Flame className="size-5 text-brand-soft" />
              {nutrition.calories} kcal · {nutrition.proteinGrams} g protein
              <span className="text-sm font-semibold text-fg-mute">for {servings} {servings === 1 ? 'serving' : 'servings'}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-fg-mute">Prep &amp; cook</div>
              <div className="mt-1 text-xl font-extrabold">{recipe.minutes} mins</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-fg-mute">Difficulty</div>
              <div className="mt-1 text-xl font-extrabold">{difficultyOf(recipe)}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-fg-mute">Servings</div>
              <div className="mt-1 flex items-center justify-center gap-3">
                <button aria-label="Fewer servings" onClick={() => changeServings(-1)} className="flex size-8 items-center justify-center rounded-full bg-brand/30 transition-colors hover:bg-brand/60"><Minus className="size-4" /></button>
                <span className="min-w-6 text-xl font-extrabold" aria-live="polite">{servings}</span>
                <button aria-label="More servings" onClick={() => changeServings(1)} className="flex size-8 items-center justify-center rounded-full bg-brand/30 transition-colors hover:bg-brand/60"><Plus className="size-4" /></button>
              </div>
            </div>
          </div>
          {servings !== recipe.servings && (
            <p className="text-center text-sm text-fg-mute">Amounts scaled from {recipe.servings} to {servings} {servings === 1 ? 'serving' : 'servings'}. Cooking times and pan sizes stay the same.</p>
          )}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight">Ingredients</h2>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold">{available} of {recipe.ingredients.length} available</span>
        </div>
        <ul className="space-y-2.5">
          {recipe.ingredients.map((i, n) => {
            const isMissing = isStillMissing(swaps, i.ingredient);
            const shown = swapRows.has(n) ? visibleSwaps(swaps, i.ingredient) : [];
            const note = isMissing ? 'Missing from your kitchen' : i.original && norm(i.original) !== norm(i.ingredient) ? i.original : undefined;
            return (
              <li key={`${i.ingredient}-${n}`} className="space-y-2">
                <div className={cn('flex items-center gap-4 rounded-2xl border px-5 py-4', isMissing ? 'border-ember/40 bg-ember/10' : 'glass border-transparent')}>
                  <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', isMissing ? 'border-2 border-ember' : 'bg-brand-hi')}>
                    {!isMissing && <Check className="size-3.5" strokeWidth={3.5} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{capital(i.ingredient)}</div>
                    {note && <div className={cn('text-sm', isMissing ? 'text-ember' : 'text-fg-mute')}>{note}</div>}
                  </div>
                  {!!i.quantity && <div className="text-right text-sm font-extrabold text-fg-dim" style={{ fontVariantNumeric: 'tabular-nums' }}>{spaceFractions(scaleAmount(i.quantity, factor))}</div>}
                </div>
                {shown.map((s) => (
                  <SwapRow key={s.id} swap={s} onAccept={() => setSwaps((st) => acceptSwap(st, s.id))} onReject={() => setSwaps((st) => rejectSwap(st, s.id))} />
                ))}
              </li>
            );
          })}
        </ul>

        {canSuggest && (
          <div className="mt-5">
            <GlowButton variant="glass" onClick={suggestSubstitutions}><Sparkles className="size-4" /> Suggest substitutions</GlowButton>
          </div>
        )}
        {suggest.status === 'loading' && <p className="mt-5 animate-pulse text-fg-dim">Finding substitutions…</p>}
        {suggest.status === 'error' && (
          <div className="mt-5 space-y-3">
            <p className="text-fg-dim">Could not get substitutions: {suggest.message}</p>
            <GlowButton variant="glass" onClick={suggestSubstitutions}>Try again</GlowButton>
          </div>
        )}
        {suggest.status === 'done' && !offered && <p className="mt-5 text-fg-dim">No substitutions found for the missing ingredients.</p>}
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight">Cooking steps</h2>
          <span className="text-sm font-bold text-fg-mute">{recipe.steps.length} steps</span>
        </div>
        <ol className="space-y-3">
          {recipe.steps.map((s, n) => (
            <li key={n} className="glass flex gap-5 rounded-[1.75rem] p-5 md:p-6">
              <span className="text-outline-brand text-4xl font-extrabold leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{String(n + 1).padStart(2, '0')}</span>
              <p className="pt-1 text-lg font-medium leading-snug text-fg-dim">{spaceFractions(scaleStep(s, factor))}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-6">
        <GlowButton size="lg" arrow href={`/cook?id=${recipe.id}`} className="pointer-events-auto w-full max-w-md">Start cooking</GlowButton>
      </div>
    </div>
  );
}

function Loaded() {
  const id = useSearchParams().get('id');
  const { items } = useKitchen();
  const [staples] = useStaples();
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return setRecipe(null);
    let live = true;
    getRecipe(id).then((r) => live && setRecipe(r), () => live && setError(true));
    return () => { live = false; };
  }, [id]);

  if (error) return <Notice title="Could not load the recipe" text="Start the server with npm run server, then reload." />;
  if (recipe === undefined || items === null) return <Notice title="Getting your recipe…" text="" />;
  if (recipe === null) return <Notice title="Pick a recipe first" text="Choose one from the list and it opens here." />;
  // Keyed by id and what the user has, so the swap state restarts when either changes.
  return <Detail key={`${recipe.id}|${items.join()}|${staples.join()}`} recipe={recipe} have={{ ingredients: items, staples: [...staples] }} />;
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="text-6xl">🍳</div>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">{title}</h1>
      {text && <p className="max-w-md text-lg text-fg-dim">{text}</p>}
      <GlowButton href="/recipes" arrow>Browse recipes</GlowButton>
    </div>
  );
}

export default function RecipeViewPage() {
  return (
    <Suspense fallback={<Notice title="Getting your recipe…" text="" />}>
      <Loaded />
    </Suspense>
  );
}
