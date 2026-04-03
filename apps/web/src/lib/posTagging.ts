import type { Language, PartOfSpeech, WordEntry } from '@tiny-story-world/types';
import { getWordList } from '@/features/silly-sentences/data';

export interface CurriculumWord {
  word: string;
  pos?: string;
  phonetic?: string;
}

export interface ResolvedWord {
  word: string;
  pos: PartOfSpeech | null;
  phonetic?: string;
  fromCurriculum: boolean;
  id: string;
}

/**
 * Resolve POS tags for curriculum words by matching them against
 * the built-in Silly Sentences word pools.
 *
 * - Latin-script languages (en, fr): case-insensitive lookup
 * - zh-Hans: exact match (no concept of case)
 */
export function resolvePos(
  curriculumWords: CurriculumWord[],
  language: Language
): ResolvedWord[] {
  const pool = getWordList(language);
  const isExactMatch = language === 'zh-Hans';

  // Build lookup map: normalized word → WordEntry
  const poolMap = new Map<string, WordEntry>();
  for (const entry of pool) {
    const key = isExactMatch ? entry.word : entry.word.toLowerCase();
    // First match wins — pool entries are authoritative
    if (!poolMap.has(key)) {
      poolMap.set(key, entry);
    }
  }

  return curriculumWords.map((cw, index): ResolvedWord => {
    const key = isExactMatch ? cw.word : cw.word.toLowerCase();
    const poolEntry = poolMap.get(key);

    return {
      word: cw.word,
      pos: poolEntry ? poolEntry.pos : null,
      phonetic: cw.phonetic ?? poolEntry?.phonetic,
      fromCurriculum: true,
      id: `curriculum-${language}-${index}`,
    };
  });
}

/**
 * Filter resolved words to only those with a known POS,
 * and convert them to WordEntry format for use in Silly Sentences.
 */
export function getResolvedWordsWithPos(words: ResolvedWord[]): WordEntry[] {
  return words
    .filter((w): w is ResolvedWord & { pos: PartOfSpeech } => w.pos !== null)
    .map((w) => ({
      id: w.id,
      word: w.word,
      pos: w.pos,
      lang: extractLangFromId(w.id),
      ...(w.phonetic !== undefined && { phonetic: w.phonetic }),
    }));
}

/** Extract the language segment from a curriculum id like "curriculum-en-0" */
function extractLangFromId(id: string): Language {
  const parts = id.split('-');
  // Handle "zh-Hans" which itself contains a hyphen: curriculum-zh-Hans-0
  if (parts[1] === 'zh') {
    return 'zh-Hans';
  }
  return parts[1] as Language;
}
