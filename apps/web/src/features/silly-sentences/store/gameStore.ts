'use client';

import { create } from 'zustand';
import type { Language, WordTile, WordEntry, GrammarFeedback } from '@tiny-story-world/types';
import { generateSentences } from '@tiny-story-world/sentence-engine';
import { selectRoundWords, selectRoundWordsWithCurriculum } from '../data';
import { useLanguageStore } from '@/stores/languageStore';
import { resolvePos, getResolvedWordsWithPos } from '@/lib/posTagging';

const MAX_TRAY_SIZE = 12;

interface GameState {
  language: Language | null;
  uiLanguage: Language;
  wordPool: WordTile[];
  sentenceTray: WordTile[];
  feedback: GrammarFeedback | null;
  isPlaying: boolean;
  highlightedTileIndex: number | null;
  showPinyin: boolean;
  showPos: boolean;
  tapToHearEnabled: boolean;
  wordUsageCount: Record<string, number>;

  setLanguage: (lang: Language) => void;
  setUiLanguage: (lang: Language) => void;
  startNewRound: () => void;
  addToTray: (instanceId: string) => void;
  removeFromTray: (instanceId: string) => void;
  reorderTray: (fromIndex: number, toIndex: number) => void;
  insertTileAt: (instanceId: string, index: number) => void;
  clearTray: () => void;
  submitSentence: () => void;
  clearFeedback: () => void;
  setIsPlaying: (playing: boolean) => void;
  setHighlightedTileIndex: (index: number | null) => void;
  togglePinyin: () => void;
  togglePos: () => void;
  toggleTapToHear: () => void;
  goHome: () => void;
}

function createTileInstances(words: WordEntry[]): WordTile[] {
  return words.map((w, i) => ({
    ...w,
    instanceId: `${w.id}-${Date.now()}-${i}`,
  }));
}

function incrementUsage(
  current: Record<string, number>,
  words: { id: string }[]
): Record<string, number> {
  const updated = { ...current };
  for (const w of words) {
    updated[w.id] = (updated[w.id] || 0) + 1;
  }
  return updated;
}

export const useGameStore = create<GameState>((set, get) => ({
  language: null,
  uiLanguage: 'en',
  wordPool: [],
  sentenceTray: [],
  feedback: null,
  isPlaying: false,
  highlightedTileIndex: null,
  showPinyin: true,
  showPos: true,
  tapToHearEnabled: true,
  wordUsageCount: {},

  setLanguage: (lang) => {
    const state = get();
    const { activeWords } = useLanguageStore.getState();
    let words: WordEntry[];
    if (activeWords.length > 0) {
      const resolved = resolvePos(activeWords, lang);
      const currEntries = getResolvedWordsWithPos(resolved);
      words = selectRoundWordsWithCurriculum(lang, 20, state.wordUsageCount, currEntries);
    } else {
      words = selectRoundWords(lang, 20, state.wordUsageCount);
    }
    const newUsage = incrementUsage(state.wordUsageCount, words);
    set({
      language: lang,
      wordPool: createTileInstances(words),
      sentenceTray: [],
      feedback: null,
      wordUsageCount: newUsage,
    });
  },

  setUiLanguage: (lang) => set({ uiLanguage: lang }),

  startNewRound: () => {
    const state = get();
    if (!state.language) return;
    const { activeWords } = useLanguageStore.getState();
    let words: WordEntry[];
    if (activeWords.length > 0) {
      const resolved = resolvePos(activeWords, state.language);
      const currEntries = getResolvedWordsWithPos(resolved);
      words = selectRoundWordsWithCurriculum(state.language, 20, state.wordUsageCount, currEntries);
    } else {
      words = selectRoundWords(state.language, 20, state.wordUsageCount);
    }
    const newUsage = incrementUsage(state.wordUsageCount, words);
    set({
      wordPool: createTileInstances(words),
      sentenceTray: [],
      feedback: null,
      wordUsageCount: newUsage,
    });
  },

  addToTray: (instanceId) => {
    const { wordPool, sentenceTray } = get();
    if (sentenceTray.length >= MAX_TRAY_SIZE) return;
    const tile = wordPool.find((t) => t.instanceId === instanceId);
    if (!tile) return;
    set({
      wordPool: wordPool.filter((t) => t.instanceId !== instanceId),
      sentenceTray: [...sentenceTray, tile],
      feedback: null,
    });
  },

  removeFromTray: (instanceId) => {
    const { wordPool, sentenceTray } = get();
    const tile = sentenceTray.find((t) => t.instanceId === instanceId);
    if (!tile) return;
    set({
      sentenceTray: sentenceTray.filter((t) => t.instanceId !== instanceId),
      wordPool: [...wordPool, tile],
      feedback: null,
    });
  },

  reorderTray: (fromIndex, toIndex) => {
    const { sentenceTray } = get();
    const newTray = [...sentenceTray];
    const [moved] = newTray.splice(fromIndex, 1);
    newTray.splice(toIndex, 0, moved);
    set({ sentenceTray: newTray, feedback: null });
  },

  insertTileAt: (instanceId, index) => {
    const { wordPool, sentenceTray } = get();
    if (sentenceTray.length >= MAX_TRAY_SIZE) return;
    const tile = wordPool.find((t) => t.instanceId === instanceId);
    if (!tile) return;
    const newTray = [...sentenceTray];
    newTray.splice(index, 0, tile);
    set({
      wordPool: wordPool.filter((t) => t.instanceId !== instanceId),
      sentenceTray: newTray,
      feedback: null,
    });
  },

  clearTray: () => {
    const { wordPool, sentenceTray } = get();
    set({
      wordPool: [...wordPool, ...sentenceTray],
      sentenceTray: [],
      feedback: null,
    });
  },

  submitSentence: () => {
    const { sentenceTray, language, uiLanguage } = get();
    if (!language || sentenceTray.length < 2) return;

    // Use the sentence engine to validate
    const validSentences = generateSentences(sentenceTray, language);
    const joiner = language === 'zh-Hans' ? '' : ' ';
    const currentSentence = sentenceTray.map((t) => t.word).join(joiner);

    const isValid = validSentences.some(
      (s) => s.words.join(joiner) === currentSentence
    );

    if (isValid) {
      set({
        feedback: {
          result: 'correct',
          hint: language === 'fr' ? 'Superbe phrase !' : language === 'zh-Hans' ? '\u592a\u68d2\u4e86\uff01' : 'Awesome sentence!',
        },
      });
      // Auto-advance after correct answer
      setTimeout(() => {
        get().startNewRound();
      }, 2000);
    } else {
      // Check if at least a noun and verb are present
      const hasNoun = sentenceTray.some((t) => t.pos === 'noun');
      const hasVerb = sentenceTray.some((t) => t.pos === 'verb');

      let hint: string;
      if (!hasNoun && !hasVerb) {
        hint = language === 'fr' ? 'Une phrase a besoin d\u2019un nom et d\u2019un verbe !' : language === 'zh-Hans' ? '\u53e5\u5b50\u9700\u8981\u540d\u8bcd\u548c\u52a8\u8bcd\uff01' : 'A sentence needs a naming word and an action word!';
      } else if (!hasNoun) {
        hint = language === 'fr' ? 'Ajoute un nom !' : language === 'zh-Hans' ? '\u8bd5\u8bd5\u52a0\u4e00\u4e2a\u540d\u8bcd\uff01' : 'Try adding a naming word!';
      } else if (!hasVerb) {
        hint = language === 'fr' ? 'Ajoute un verbe !' : language === 'zh-Hans' ? '\u8bd5\u8bd5\u52a0\u4e00\u4e2a\u52a8\u8bcd\uff01' : 'Try adding an action word!';
      } else {
        hint = language === 'fr' ? "Essaie de changer l'ordre." : language === 'zh-Hans' ? '\u8bd5\u8bd5\u8c03\u6362\u987a\u5e8f\uff01' : 'Hmm, try moving the action word.';
      }

      set({
        feedback: {
          result: 'incorrect',
          hint,
        },
      });
    }
  },

  clearFeedback: () => set({ feedback: null }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setHighlightedTileIndex: (index) => set({ highlightedTileIndex: index }),
  togglePinyin: () => set((s) => ({ showPinyin: !s.showPinyin })),
  togglePos: () => set((s) => ({ showPos: !s.showPos })),
  toggleTapToHear: () => set((s) => ({ tapToHearEnabled: !s.tapToHearEnabled })),

  goHome: () =>
    set({
      language: null,
      wordPool: [],
      sentenceTray: [],
      feedback: null,
      isPlaying: false,
      highlightedTileIndex: null,
    }),
}));
