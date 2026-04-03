'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@tiny-story-world/types';

interface WordEntry {
  word: string;
  pos?: string;
  phonetic?: string;
}

type ReadingStage = 'emergent' | 'beginner' | 'in_transition' | 'competent' | 'experienced';

interface LanguageState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Reading stage (from student profile, with local override)
  profileReadingStage: ReadingStage;
  readingStageLoading: boolean;
  loadProfileReadingStage: () => Promise<void>;

  // Curriculum
  activeWordlistId: string | null;
  activeWords: WordEntry[];
  activeWordlistName: string | null;
  wordlistSource: 'teacher' | 'student' | 'default';
  isTeacherLocked: boolean;
  curriculumLoading: boolean;

  // Curriculum actions
  setActiveWordlistId: (id: string | null) => void;
  loadCurriculum: () => Promise<void>;
  clearCurriculum: () => void;
  hydrateCurriculum: () => Promise<void>;
}

interface PersistedState {
  language: Language;
  activeWordlistId: string | null;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      // Language
      language: 'fr',
      setLanguage: (language) => {
        set({ language });
        get().loadCurriculum();
      },

      // Reading stage
      profileReadingStage: 'beginner' as ReadingStage,
      readingStageLoading: false,
      loadProfileReadingStage: async () => {
        set({ readingStageLoading: true });
        try {
          const res = await fetch('/api/student/stats');
          if (res.ok) {
            const data = await res.json();
            const stage = data?.profile?.readingStage;
            if (stage) {
              set({ profileReadingStage: stage as ReadingStage });
            }
          }
        } catch {
          // Keep default 'beginner'
        } finally {
          set({ readingStageLoading: false });
        }
      },

      // Curriculum defaults
      activeWordlistId: null,
      activeWords: [],
      activeWordlistName: null,
      wordlistSource: 'default',
      isTeacherLocked: false,
      curriculumLoading: false,

      // Curriculum actions
      setActiveWordlistId: (id) => {
        set({ activeWordlistId: id });
        if (id === null) {
          get().clearCurriculum();
          return;
        }
        get().loadCurriculum();
      },

      loadCurriculum: async () => {
        const { language, activeWordlistId } = get();
        set({ curriculumLoading: true });
        try {
          // First check for teacher-assigned curriculum
          const res = await fetch(
            `/api/curriculum/active?language=${encodeURIComponent(language)}`
          );
          if (!res.ok) {
            get().clearCurriculum();
            return;
          }
          const data = await res.json();

          if (data.wordlist) {
            // Teacher-assigned wordlist found
            set({
              activeWordlistId: data.wordlist.id,
              activeWords: data.wordlist.words ?? [],
              activeWordlistName: data.wordlist.name ?? null,
              wordlistSource: data.source ?? 'teacher',
              isTeacherLocked: data.isLocked ?? true,
            });
          } else if (activeWordlistId) {
            // No teacher assignment — try to load the student's own selected wordlist
            try {
              const wlRes = await fetch('/api/word-lists');
              if (wlRes.ok) {
                const lists = await wlRes.json();
                const match = lists.find(
                  (wl: any) => wl.id === activeWordlistId && wl.language === language
                );
                if (match) {
                  set({
                    activeWords: match.words ?? [],
                    activeWordlistName: match.name ?? null,
                    wordlistSource: 'student',
                    isTeacherLocked: false,
                  });
                } else {
                  // Active wordlist doesn't match current language — find one that does
                  const sameLang = lists.find(
                    (wl: any) => wl.language === language
                  );
                  if (sameLang) {
                    set({
                      activeWordlistId: sameLang.id,
                      activeWords: sameLang.words ?? [],
                      activeWordlistName: sameLang.name ?? null,
                      wordlistSource: 'student',
                      isTeacherLocked: false,
                    });
                  } else {
                    get().clearCurriculum();
                  }
                }
              } else {
                get().clearCurriculum();
              }
            } catch {
              get().clearCurriculum();
            }
          } else {
            get().clearCurriculum();
          }
        } catch {
          get().clearCurriculum();
        } finally {
          set({ curriculumLoading: false });
        }
      },

      clearCurriculum: () => {
        set({
          activeWordlistId: null,
          activeWords: [],
          activeWordlistName: null,
          wordlistSource: 'default',
          isTeacherLocked: false,
        });
      },

      hydrateCurriculum: async () => {
        await Promise.all([
          get().loadCurriculum(),
          get().loadProfileReadingStage(),
        ]);
      },
    }),
    {
      name: 'tsw-language',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<PersistedState>;
        if (version < 2) {
          return {
            language: state.language ?? 'fr',
            activeWordlistId: null,
          } as PersistedState;
        }
        return state as PersistedState;
      },
      partialize: (state) => ({
        language: state.language,
        activeWordlistId: state.activeWordlistId,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          state?.hydrateCurriculum();
        };
      },
    }
  )
);
