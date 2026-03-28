'use client';

import type { ReactNode } from 'react';
import type { ValidationResult } from '@tiny-story-world/types';

export interface SentenceTrayProps {
  /** Pre-rendered tile elements (from DnD context in the app) */
  children: ReactNode;
  /** Reference callback for droppable area */
  trayRef?: (node: HTMLElement | null) => void;
  /** Whether a dragged item is currently over the tray */
  isOver?: boolean;
  /** Insert preview gap is showing */
  showGap?: boolean;
  /** Current feedback result (affects glow) */
  feedbackResult?: ValidationResult | null;
  /** Current tile count */
  tileCount: number;
  /** Max tiles allowed */
  maxTiles?: number;
  /** Localized "words" label */
  tileCountLabel?: string;
  /** Localized "tray full" message */
  trayFullLabel?: string;
  /** Extra empty slots to render */
  emptySlotCount?: number;
}

export function SentenceTray({
  children,
  trayRef,
  isOver = false,
  showGap = false,
  feedbackResult = null,
  tileCount,
  maxTiles = 12,
  tileCountLabel = 'words',
  trayFullLabel = 'Your sentence is full!',
  emptySlotCount,
}: SentenceTrayProps) {
  const computedEmptySlots = emptySlotCount ?? Math.max(0, maxTiles - tileCount - (showGap ? 1 : 0));

  const glowClass = feedbackResult
    ? feedbackResult === 'correct'
      ? 'ring-4 ring-green-400 bg-green-50/60'
      : feedbackResult === 'partial'
        ? 'ring-4 ring-yellow-400 bg-yellow-50/60'
        : 'bg-white/80'
    : isOver || showGap
      ? 'bg-purple-50/60 ring-2 ring-purple-300'
      : 'bg-white/80';

  return (
    <section className="px-3 md:px-6 pb-1 md:pb-2 shrink-0" aria-label="Sentence tray">
      <div
        ref={trayRef}
        aria-live="polite"
        aria-atomic="false"
        className={`
          flex items-center gap-2 md:gap-3
          p-3 md:p-4 rounded-2xl
          border-2 border-dashed border-gray-300
          min-h-[60px] md:min-h-[90px]
          transition-all duration-300
          ${glowClass}
        `}
      >
        {children}

        {Array.from({ length: computedEmptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-16 h-12 md:w-20 md:h-14 rounded-xl border-2 border-dashed border-gray-200 flex-shrink-0"
          />
        ))}
      </div>

      <div className="flex justify-between items-center mt-1.5 px-1">
        <span className="text-xs text-gray-400">
          {tileCount}/{maxTiles} {tileCountLabel}
        </span>
        {tileCount >= maxTiles && (
          <span className="text-xs text-orange-500 font-semibold animate-bounce">
            {trayFullLabel}
          </span>
        )}
      </div>
    </section>
  );
}
