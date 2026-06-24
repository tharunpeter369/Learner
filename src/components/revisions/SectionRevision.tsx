"use client";

import React, { useEffect, useState } from 'react';
import { Minus, Plus, Clock } from 'lucide-react';
import { useRevisions, REVISION_WINDOW_MS } from './RevisionsProvider';

/** "2h 13m" / "47m" / "under a minute" left until the next increment is allowed. */
function formatRemaining(ms: number): string {
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin <= 1) return 'under a minute';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Compact per-section revision counter, shown to the LEFT of a heading's Notes
 * button. Increment is allowed once per 4h (then the + button shows a cooldown
 * clock + countdown); − only undoes an increment still inside that window.
 */
export function SectionRevision({ topicId }: { topicId: string }) {
  const { getCount, getLastChanged, getLastIncremented, bump, user, signIn } = useRevisions();
  const count = getCount(topicId);
  const lastChanged = getLastChanged(topicId);
  const lastInc = getLastIncremented(topicId);

  // Bumps on every increment; used as a React key to replay the CSS animations.
  const [fx, setFx] = useState(0);
  // Clock read from an effect (not render) so the component stays pure; ticked
  // so the cooldown countdown updates and the + button re-enables on time.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Reading the wall clock is an external-system sync; a lazy initializer would
    // instead break the render-purity rule (Date.now() during render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const incMs = lastInc ? new Date(lastInc).getTime() : null;
  const remaining = now !== null && incMs !== null ? REVISION_WINDOW_MS - (now - incMs) : 0;
  const inWindow = !!user && remaining > 0; // cooling down AND has an undoable increment
  const canDecrement = inWindow && count > 0;

  const tip = !user
    ? 'Sign in to track revisions'
    : inWindow
      ? `Counted ✓ · next revision in ${formatRemaining(remaining)}`
      : lastChanged
        ? `Last changed ${new Date(lastChanged).toLocaleString()}`
        : 'Not revised yet';

  const onBump = (delta: number) => {
    if (!user) {
      signIn();
      return;
    }
    if (delta > 0 && inWindow) return; // on cooldown
    if (delta < 0 && !canDecrement) return; // nothing to undo
    if (delta > 0) setFx((n) => n + 1); // celebrate increases only
    bump(topicId, delta);
  };

  return (
    <span
      className="not-prose group relative inline-flex shrink-0 items-center gap-0.5 rounded-lg border px-1 py-0.5 text-xs font-medium
        border-neutral-200 bg-white text-neutral-600
        dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
    >
      {/* emerald glow burst on increment */}
      {fx > 0 && (
        <span
          key={`glow-${fx}`}
          aria-hidden
          className="animate-pill-glow pointer-events-none absolute inset-0 rounded-lg"
        />
      )}

      {/* tooltip — shows immediately on hover or keyboard focus */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap
          rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-normal text-white opacity-0 shadow-lg ring-1 ring-black/10
          transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100
          dark:bg-neutral-700"
      >
        {tip}
      </span>

      <button
        type="button"
        onClick={() => onBump(-1)}
        disabled={!canDecrement}
        aria-label="Undo this window's revision"
        className="flex h-5 w-5 items-center justify-center rounded transition-transform
          hover:text-emerald-600 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30
          dark:hover:text-emerald-400"
      >
        <Minus className="h-3 w-3" />
      </button>

      <span className="relative inline-flex min-w-[1.1rem] items-center justify-center">
        <span
          key={`n-${fx}`}
          className={fx > 0 ? 'animate-count-pop tabular-nums' : 'tabular-nums'}
          aria-label={`Revised ${count} times`}
        >
          {count}
        </span>
        {/* floating "+1" that rises and fades */}
        {fx > 0 && (
          <span
            key={`plus-${fx}`}
            aria-hidden
            className="animate-float-up pointer-events-none absolute bottom-full left-1/2 text-[11px] font-bold text-emerald-500"
          >
            +1
          </span>
        )}
      </span>

      <button
        type="button"
        onClick={() => onBump(1)}
        disabled={!!user && inWindow}
        aria-label={inWindow ? 'On cooldown — revise again later' : 'Increase revision count'}
        className={`flex h-5 w-5 items-center justify-center rounded transition-transform active:scale-90
          ${inWindow ? 'cursor-not-allowed text-neutral-400 dark:text-neutral-600' : 'hover:text-emerald-600 dark:hover:text-emerald-400'}`}
      >
        {inWindow ? <Clock className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      </button>
    </span>
  );
}
