'use client';

import { useGSAP } from '@gsap/react';
import type { Recipe } from '@fridge/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Timer, UtensilsCrossed } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { BookmarkButton } from '@/components/BookmarkButton';
import { useLenis } from '@/components/SmoothScroll';
import { Backdrop, BACKDROPS, type BackdropId } from '@/components/cook/Backdrop';
import { GlowButton } from '@/components/ui/GlowButton';
import { Magnetic } from '@/components/ui/Magnetic';
import { getRecipe, searchRecipes } from '@/lib/api';
import { cn } from '@/lib/cn';
import { gsap, ScrollTrigger, scrollState } from '@/lib/gsap';
import { useKitchen } from '@/lib/kitchen';
import { useStored } from '@/lib/store';
import { useEquipment, useStaples } from '@/lib/usePrefs';
import { useServings } from '@/lib/useServings';
import { portionNutrition, scaleAmount, scaleStep, spaceFractions } from '@/lib/scale';
import { minutesIn } from '@/lib/steps';

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A countdown ring for a step that names a time. */
function StepTimer({ minutes }: { minutes: number }) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => { if (left === 0) setRunning(false); }, [left]);

  const done = left === 0;
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 34;

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => (done ? (setLeft(total), setRunning(false)) : setRunning((r) => !r))}
      className={cn('glass group flex items-center gap-4 rounded-full py-3 pl-3 pr-7', done && 'border-brand-soft/60')}
      aria-label={done ? 'Reset timer' : running ? 'Pause timer' : 'Start timer'}>
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
        <circle cx="38" cy="38" r="34" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="4" />
        <circle cx="38" cy="38" r="34" fill="none" stroke="#bfc2ff" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - left / total)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div className="text-left">
        <div className="text-3xl font-extrabold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>{done ? 'Done!' : `${mm}:${ss}`}</div>
        <div className="text-xs font-bold uppercase tracking-widest text-fg-mute">{done ? 'Tap to reset' : running ? 'Tap to pause' : 'Tap to start'}</div>
      </div>
    </motion.button>
  );
}

function Cooking({ recipe }: { recipe: Recipe }) {
  const lenis = useLenis();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [step, setStep] = useState(0);
  const [servings, changeServings] = useServings();
  const [open, setOpen] = useState(false);
  const [backdrop, setBackdrop] = useStored<BackdropId>('cookBackdrop', 'aurora');
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const n = recipe.steps.length;
  const factor = servings / Math.max(1, recipe.servings);
  const nutrition = portionNutrition({ calories: recipe.calories, proteinGrams: recipe.proteinGrams }, servings);

  // Scrolling is the recipe's progress: GSAP turns the scroll position into a step and drives the 3D scene.
  useGSAP(() => {
    trigger.current = ScrollTrigger.create({
      trigger: wrapper.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        scrollState.cook = self.progress;
        setStep(Math.min(n - 1, Math.floor(self.progress * n)));
      },
    });
    return () => { scrollState.cook = 0; };
  }, { scope: wrapper, dependencies: [n] });

  const goTo = useCallback((i: number) => {
    const st = trigger.current;
    if (!st) return;
    const target = Math.max(0, Math.min(n - 1, i));
    const y = st.start + ((target + 0.5) / n) * (st.end - st.start);
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }, [lenis, n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(step + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(step - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, step]);

  const minutes = minutesIn(spaceFractions(scaleStep(recipe.steps[step], factor)));
  const last = step === n - 1;

  return (
    <div ref={wrapper} style={{ height: `${(n + 1) * 100}svh` }} className="relative">
      <div className="sticky top-0 h-svh overflow-hidden">
        <Backdrop variant={backdrop} />

        <div className="relative z-10 flex h-full flex-col px-5 pb-8 pt-28 md:px-10">
          <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-soft">Cooking</div>
              <h1 className="mt-1 max-w-xl text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">{recipe.name}</h1>
              <div className="mt-2 text-sm font-semibold text-fg-dim" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {nutrition.calories !== undefined && <>{nutrition.calories} kcal · {nutrition.proteinGrams} g protein · </>}
                for {servings} {servings === 1 ? 'serving' : 'servings'}
              </div>
            </div>
            <div className="flex items-center gap-3">
            <BookmarkButton recipe={recipe} className="size-12" />
            <div className="glass-dark flex items-center gap-1 rounded-full p-1.5">
              <button aria-label="Fewer servings" onClick={() => changeServings(-1)} className="rounded-full p-2.5 transition-colors hover:bg-white/10"><Minus className="size-4" /></button>
              <div className="min-w-16 text-center">
                <div className="text-lg font-extrabold leading-none">{servings}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-fg-mute">servings</div>
              </div>
              <button aria-label="More servings" onClick={() => changeServings(1)} className="rounded-full p-2.5 transition-colors hover:bg-white/10"><Plus className="size-4" /></button>
            </div>
            </div>
          </div>

          <div className="pointer-events-none relative my-auto max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 50, filter: 'blur(14px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -40, filter: 'blur(14px)' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <div className="text-outline-brand text-[clamp(6rem,20vw,16rem)] font-extrabold leading-[0.8] tracking-[-0.06em]" style={{ fontVariantNumeric: 'tabular-nums' }}>{String(step + 1).padStart(2, '0')}</div>
                <p className="mt-6 text-[clamp(1.6rem,3.6vw,3.2rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">{spaceFractions(scaleStep(recipe.steps[step], factor))}</p>
                {minutes && <div className="pointer-events-auto mt-8"><StepTimer key={`${step}-${minutes}`} minutes={minutes} /></div>}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pointer-events-auto flex items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <GlowButton variant="glass" onClick={() => setOpen((o) => !o)}><UtensilsCrossed className="size-4" /> Ingredients</GlowButton>
              <div className="glass-dark flex items-center gap-1 rounded-full p-1" role="radiogroup" aria-label="Background">
                {BACKDROPS.map((b) => (
                  <button key={b.id} role="radio" aria-checked={backdrop === b.id} title={b.hint} onClick={() => setBackdrop(b.id)} className={cn('rounded-full px-3.5 py-2 text-xs font-bold transition-colors', backdrop === b.id ? 'bg-brand text-white' : 'text-fg-dim hover:text-fg')}>{b.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="mr-2 hidden items-center gap-1.5 md:flex" aria-label={`Step ${step + 1} of ${n}`}>
                {recipe.steps.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} aria-label={`Go to step ${i + 1}`} className="group p-1">
                    <motion.span animate={{ width: i === step ? 36 : 8, backgroundColor: i <= step ? '#bfc2ff' : 'rgb(255 255 255 / 0.2)' }} className="block h-2 rounded-full" transition={{ type: 'spring', stiffness: 300, damping: 26 }} />
                  </button>
                ))}
              </div>
              <GlowButton variant="glass" aria-label="Previous step" onClick={() => goTo(step - 1)} disabled={step === 0}><ChevronLeft className="size-5" /></GlowButton>
              {last ? (
                <Magnetic><GlowButton size="lg" arrow href="/">Finish</GlowButton></Magnetic>
              ) : (
                <Magnetic><GlowButton size="lg" arrow onClick={() => goTo(step + 1)}>Next step</GlowButton></Magnetic>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.aside initial={{ x: '-105%' }} animate={{ x: 0 }} exit={{ x: '-105%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className="glass absolute bottom-24 left-5 top-28 z-20 flex w-[min(24rem,calc(100%-2.5rem))] flex-col rounded-[2rem] p-5 md:left-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-extrabold tracking-tight">Ingredients</h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{checked.size}/{recipe.ingredients.length}</span>
              </div>
              <ul className="no-scrollbar -mx-1 flex-1 space-y-1.5 overflow-y-auto px-1" data-lenis-prevent>
                {recipe.ingredients.map((ing, i) => {
                  const on = checked.has(i);
                  return (
                    <li key={`${ing.ingredient}-${i}`}>
                      <button onClick={() => setChecked((c) => { const x = new Set(c); if (!x.delete(i)) x.add(i); return x; })} className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10">
                        <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors', on ? 'border-brand-hi bg-brand-hi' : 'border-white/30')}>{on && <Check className="size-3.5" strokeWidth={3.5} />}</span>
                        <span className={cn('flex-1 font-semibold transition-opacity', on && 'line-through opacity-40')}>{capital(ing.ingredient)}</span>
                        <span className="text-sm font-bold text-fg-dim">{spaceFractions(scaleAmount(ing.quantity, factor))}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CookInner() {
  const id = useSearchParams().get('id');
  const { items } = useKitchen();
  const [staples] = useStaples();
  const [equipment] = useEquipment();
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    // With no recipe chosen, cook the best match for the Kitchen.
    if (!id && items === null) return;
    let live = true;
    (async () => {
      try {
        const chosen = id ?? (items?.length ? (await searchRecipes(items, staples, equipment)).find((m) => m.missing.length === 0)?.recipeId : undefined);
        const r = chosen ? await getRecipe(chosen) : null;
        if (live) setRecipe(r);
      } catch {
        if (live) setError(true);
      }
    })();
    return () => { live = false; };
  }, [id, items, staples, equipment]);

  if (error) return <Notice title="Can't reach the recipe server" text="Start it with npm run server, then reload." />;
  if (recipe === undefined) return <Notice title="Getting your recipe…" text="" />;
  if (recipe === null) return <Notice title="Nothing cooking yet" text="Pick a recipe and its steps appear here, one scroll at a time." action={<GlowButton href="/recipes" arrow>Browse recipes</GlowButton>} />;
  return <Cooking recipe={recipe} />;
}

function Notice({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="text-6xl">🍳</div>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">{title}</h1>
      {text && <p className="max-w-md text-lg text-fg-dim">{text}</p>}
      {action && <Magnetic>{action}</Magnetic>}
    </div>
  );
}

export default function CookPage() {
  return (
    <Suspense fallback={<Notice title="Getting your recipe…" text="" />}>
      <CookInner />
    </Suspense>
  );
}
