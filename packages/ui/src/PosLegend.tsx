'use client';

import type { PartOfSpeech } from '@tiny-story-world/types';
import { POS_COLORS } from '@tiny-story-world/types';

interface PosLegendProps {
  /** Map POS key → display label (e.g. from i18n) */
  labels: Partial<Record<PartOfSpeech, string>>;
  /** Which POS types to show (defaults to noun, verb, adjective, adverb) */
  types?: PartOfSpeech[];
  title?: string;
}

const DEFAULT_TYPES: PartOfSpeech[] = ['noun', 'verb', 'adjective', 'adverb'];

export function PosLegend({ labels, types = DEFAULT_TYPES, title }: PosLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
      {title && <span className="font-semibold">{title}:</span>}
      {types.map((pos) => {
        const colors = POS_COLORS[pos];
        return (
          <span key={pos} className="inline-flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
            {labels[pos] ?? pos}
          </span>
        );
      })}
    </div>
  );
}
