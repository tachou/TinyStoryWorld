'use client';
import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/stores/languageStore';

interface WordlistRaw {
  id: string;
  name: string;
  language: string;
  words: { word: string }[];
}

interface Wordlist {
  id: string;
  name: string;
  language: string;
  wordCount: number;
}

export function CurriculumSelector() {
  const language = useLanguageStore((s) => s.language);
  const activeWordlistId = useLanguageStore((s) => s.activeWordlistId);
  const isTeacherLocked = useLanguageStore((s) => s.isTeacherLocked);
  const activeWords = useLanguageStore((s) => s.activeWords);
  const setActiveWordlistId = useLanguageStore((s) => s.setActiveWordlistId);

  const [wordlists, setWordlists] = useState<Wordlist[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchWordlists() {
      try {
        const res = await fetch('/api/word-lists');
        if (!res.ok) return;
        const data: WordlistRaw[] = await res.json();
        if (!cancelled) {
          setWordlists(
            data
              .filter((wl) => wl.language === language)
              .map((wl) => ({ id: wl.id, name: wl.name, language: wl.language, wordCount: wl.words?.length ?? 0 }))
          );
        }
      } catch {
        // silently ignore fetch errors
      }
    }

    fetchWordlists();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <div className="shrink-0 px-4 py-3 border-t border-gray-200">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">
        Curriculum
      </h3>

      <div className="relative">
        <select
          value={activeWordlistId ?? ''}
          onChange={(e) => setActiveWordlistId(e.target.value || null)}
          disabled={isTeacherLocked}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Default word pool</option>
          {wordlists.map((wl) => (
            <option key={wl.id} value={wl.id}>
              {wl.name} ({wl.wordCount} words)
            </option>
          ))}
        </select>

        {isTeacherLocked && (
          <span
            className="absolute right-8 top-1/2 -translate-y-1/2 cursor-default"
            title="Set by your teacher"
          >
            🔒
          </span>
        )}
      </div>

      {activeWordlistId && (
        <p className="mt-1.5 px-1 text-xs text-gray-400">
          {activeWords.length} words · {language.toUpperCase()}
        </p>
      )}
    </div>
  );
}
