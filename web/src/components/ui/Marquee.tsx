import { cn } from '@/lib/cn';

/** A slow, endless ticker of words. Two copies run side by side so the loop has no seam. */
export function Marquee({ items, className, speed = 50 }: { items: string[]; className?: string; speed?: number }) {
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
      {items.map((t, i) => (
        <span key={`${t}-${i}`} className="flex items-center gap-10">
          <span className="whitespace-nowrap">{t}</span>
          <span className="size-2 rounded-full bg-brand-hi" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn('flex overflow-hidden', className)} aria-label={items.join(', ')}>
      <div className="flex w-max hover:[animation-play-state:paused]" style={{ animation: `marquee ${speed}s linear infinite` }}>
        {row}
        {row}
      </div>
    </div>
  );
}
