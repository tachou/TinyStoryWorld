'use client';
import { useLanguageStore } from '@/stores/languageStore';

export function CurriculumBadge() {
  const activeWordlistName = useLanguageStore((s) => s.activeWordlistName);
  const activeWords = useLanguageStore((s) => s.activeWords);

  if (!activeWordlistName) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-xs">
      📚 {activeWordlistName} · {activeWords.length} words
    </span>
  );
}
