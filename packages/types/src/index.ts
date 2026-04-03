export type UserRole = 'student' | 'teacher' | 'parent' | 'admin' | 'editor';

export type Language = 'en' | 'fr' | 'zh-Hans';

export type ReadingStage = 'emergent' | 'beginner' | 'in_transition' | 'competent' | 'experienced';

export type PartOfSpeech =
  | 'noun' | 'verb' | 'adjective' | 'adverb'
  | 'determiner' | 'preposition' | 'conjunction'
  | 'pronoun' | 'particle' | 'phrase' | 'other';

export interface WordEntry {
  id: string;
  word: string;
  pos: PartOfSpeech;
  lang: Language;
  phonetic?: string;
}

export interface WordTile extends WordEntry {
  instanceId: string;
}

export type ValidationResult = 'correct' | 'incorrect' | 'partial';

export interface GrammarFeedback {
  result: ValidationResult;
  hint: string;
  errorTileIds?: string[];
}

/** POS color classes for Tailwind (requires custom theme colors) */
export const POS_COLORS: Record<PartOfSpeech, { bg: string; border: string; label: string }> = {
  noun:        { bg: 'bg-noun',        border: 'border-noun-border',        label: 'N' },
  verb:        { bg: 'bg-verb',        border: 'border-verb-border',        label: 'V' },
  adjective:   { bg: 'bg-adjective',   border: 'border-adjective-border',   label: 'Adj' },
  adverb:      { bg: 'bg-adverb',      border: 'border-adverb-border',      label: 'Adv' },
  phrase:      { bg: 'bg-phrase',       border: 'border-phrase-border',      label: 'Phr' },
  conjunction: { bg: 'bg-conjunction',  border: 'border-conjunction-border', label: 'Con' },
  particle:    { bg: 'bg-phrase',       border: 'border-phrase-border',      label: 'Ptc' },
  determiner:  { bg: 'bg-conjunction',  border: 'border-conjunction-border', label: 'Det' },
  preposition: { bg: 'bg-conjunction',  border: 'border-conjunction-border', label: 'Prep' },
  pronoun:     { bg: 'bg-noun',        border: 'border-noun-border',        label: 'Pro' },
  other:       { bg: 'bg-conjunction',  border: 'border-conjunction-border', label: '...' },
};
