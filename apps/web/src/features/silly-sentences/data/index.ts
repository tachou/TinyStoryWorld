import type { Language, WordEntry } from '@tiny-story-world/types';
import { englishWords } from './en';
import { frenchWords } from './fr';
import { chineseWords } from './zh';

const wordLists: Record<Language, WordEntry[]> = {
  en: englishWords,
  fr: frenchWords,
  'zh-Hans': chineseWords,
};

export function getWordList(lang: Language): WordEntry[] {
  return wordLists[lang];
}

/**
 * Anchor words — always included in every round to guarantee
 * the child can form at least 4 valid sentences.
 */
const ANCHOR_WORDS: Record<Language, string[]> = {
  en: ['the', 'a', 'and', 'is', 'I', 'my', 'to the', 'has'],
  fr: ['est', 'un', 'une', 'et', 'le', 'la', 'a', 'dans'],
  'zh-Hans': ['\u7684', '\u662f', '\u5728', '\u5f88', '\u4e86', '\u548c', '\u6211', '\u4e00\u4e2a'],
};

function weightedPick(
  arr: WordEntry[],
  n: number,
  usageCounts: Record<string, number>
): WordEntry[] {
  if (arr.length <= n) return [...arr];

  const weighted = arr.map((w) => ({
    entry: w,
    weight: 1 / (1 + (usageCounts[w.id] || 0)),
  }));

  const picked: WordEntry[] = [];
  const remaining = [...weighted];

  for (let i = 0; i < n && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;

    let chosen = 0;
    for (let j = 0; j < remaining.length; j++) {
      rand -= remaining[j].weight;
      if (rand <= 0) {
        chosen = j;
        break;
      }
    }

    picked.push(remaining[chosen].entry);
    remaining.splice(chosen, 1);
  }

  return picked;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resolveAnchors(wordList: WordEntry[], anchorWords: string[]): WordEntry[] {
  const anchors: WordEntry[] = [];
  for (const word of anchorWords) {
    const entry = wordList.find((w) => w.word === word);
    if (entry) anchors.push(entry);
  }
  return anchors;
}

export function selectRoundWords(
  lang: Language,
  count: number = 20,
  usageCounts: Record<string, number> = {}
): WordEntry[] {
  const all = getWordList(lang);
  const anchorWords = ANCHOR_WORDS[lang] || [];
  const anchors = resolveAnchors(all, anchorWords);
  return selectFromPool(all, count, usageCounts, anchors);
}

export function selectRoundWordsWithCurriculum(
  lang: Language,
  count: number = 20,
  usageCounts: Record<string, number> = {},
  curriculumEntries: WordEntry[]
): WordEntry[] {
  const all = getWordList(lang);
  const anchorWords = ANCHOR_WORDS[lang] || [];
  const anchors = resolveAnchors(all, anchorWords);
  const anchorIds = new Set(anchors.map((w) => w.id));
  const curriculumWordSet = new Set(curriculumEntries.map((w) => w.word.toLowerCase()));

  // Tag anchors — mark as curriculum if they appear in the curriculum, otherwise leave untagged (they're structural)
  const selected: WordEntry[] = anchors.map((w) => ({ ...w, fromCurriculum: true }));
  const remainingCount = count - anchors.length;

  // Separate curriculum entries by POS
  const currByPos = {
    noun: curriculumEntries.filter((w) => w.pos === 'noun'),
    verb: curriculumEntries.filter((w) => w.pos === 'verb'),
    adjective: curriculumEntries.filter((w) => w.pos === 'adjective'),
    adverb: curriculumEntries.filter((w) => w.pos === 'adverb'),
    phrase: curriculumEntries.filter((w) => w.pos === 'phrase' || w.pos === 'particle'),
    conjunction: curriculumEntries.filter((w) => w.pos === 'conjunction'),
  };

  // Pool words excluding anchors
  const pool = all.filter((w) => !anchorIds.has(w.id));
  const poolByPos = {
    noun: pool.filter((w) => w.pos === 'noun'),
    verb: pool.filter((w) => w.pos === 'verb'),
    adjective: pool.filter((w) => w.pos === 'adjective'),
    adverb: pool.filter((w) => w.pos === 'adverb'),
    phrase: pool.filter((w) => w.pos === 'phrase' || w.pos === 'particle'),
    conjunction: pool.filter((w) => w.pos === 'conjunction'),
  };

  const targets: [keyof typeof currByPos, number][] = [
    ['noun', 4], ['verb', 3], ['adjective', 2],
    ['adverb', 1], ['phrase', 1], ['conjunction', 0],
  ];

  const randomSelected: WordEntry[] = [];
  const usedIds = new Set<string>(anchorIds);

  for (const [pos, desired] of targets) {
    // Pick from curriculum first (prioritized via weighted pick)
    const currAvailable = currByPos[pos].filter((w) => !usedIds.has(w.id));
    const fromCurr = weightedPick(currAvailable, desired, usageCounts);
    for (const w of fromCurr) usedIds.add(w.id);
    // Tag curriculum words
    const taggedCurr = fromCurr.map((w) => ({ ...w, fromCurriculum: true }));

    // Pad remaining slots from pool
    const needed = desired - fromCurr.length;
    if (needed > 0) {
      const poolAvailable = poolByPos[pos].filter((w) => !usedIds.has(w.id));
      const fromPool = weightedPick(poolAvailable, needed, usageCounts);
      for (const w of fromPool) usedIds.add(w.id);
      // Tag pool words as non-curriculum
      const taggedPool = fromPool.map((w) => ({ ...w, fromCurriculum: false }));
      randomSelected.push(...taggedCurr, ...taggedPool);
    } else {
      randomSelected.push(...taggedCurr);
    }
  }

  // Fill any remaining count from pool words not already selected
  const totalNeeded = remainingCount - randomSelected.length;
  if (totalNeeded > 0) {
    const remaining = pool.filter((w) => !usedIds.has(w.id));
    const taggedRemaining = weightedPick(remaining, totalNeeded, usageCounts)
      .map((w) => ({ ...w, fromCurriculum: false }));
    randomSelected.push(...taggedRemaining);
  }

  selected.push(...randomSelected);
  return shuffle(selected);
}

function selectFromPool(
  all: WordEntry[],
  count: number,
  usageCounts: Record<string, number>,
  anchors: WordEntry[] = []
): WordEntry[] {
  const anchorIds = new Set(anchors.map((w) => w.id));
  const selected: WordEntry[] = [...anchors];
  const remainingCount = count - anchors.length;

  const pool = all.filter((w) => !anchorIds.has(w.id));

  if (pool.length <= remainingCount) {
    selected.push(...pool);
    return shuffle(selected);
  }

  const byPos = {
    noun: pool.filter((w) => w.pos === 'noun'),
    verb: pool.filter((w) => w.pos === 'verb'),
    adjective: pool.filter((w) => w.pos === 'adjective'),
    adverb: pool.filter((w) => w.pos === 'adverb'),
    phrase: pool.filter((w) => w.pos === 'phrase' || w.pos === 'particle'),
    conjunction: pool.filter((w) => w.pos === 'conjunction'),
  };

  const targets: [keyof typeof byPos, number][] = [
    ['noun', 4], ['verb', 3], ['adjective', 2],
    ['adverb', 1], ['phrase', 1], ['conjunction', 0],
  ];

  const randomSelected: WordEntry[] = [];
  for (const [pos, desired] of targets) {
    const available = byPos[pos];
    if (available.length > 0) {
      randomSelected.push(...weightedPick(available, Math.min(desired, available.length), usageCounts));
    }
  }

  const usedIds = new Set([...anchorIds, ...randomSelected.map((w) => w.id)]);
  const remaining = pool.filter((w) => !usedIds.has(w.id));
  const needed = remainingCount - randomSelected.length;

  if (needed > 0) {
    randomSelected.push(...weightedPick(remaining, needed, usageCounts));
  }

  selected.push(...randomSelected);
  return shuffle(selected);
}
