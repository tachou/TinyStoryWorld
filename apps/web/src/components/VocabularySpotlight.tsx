'use client';

interface VocabularySpotlightProps {
  curriculumWords: string[];
  storyText: string;
  language: string;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordAppearsInStory(
  word: string,
  storyText: string,
  language: string
): boolean {
  if (language === 'zh-Hans') {
    return storyText.toLowerCase().includes(word.toLowerCase());
  }
  const escaped = escapeRegExp(word);
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(storyText);
}

export function VocabularySpotlight({
  curriculumWords,
  storyText,
  language,
}: VocabularySpotlightProps) {
  if (curriculumWords.length === 0) {
    return null;
  }

  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const word of curriculumWords) {
    if (wordAppearsInStory(word, storyText, language)) {
      matched.push(word);
    } else {
      unmatched.push(word);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mb-2 text-sm font-bold">📚 Vocabulary Spotlight</h3>
      <div className="mb-2 flex flex-wrap gap-x-1 text-sm">
        {matched.map((word, i) => (
          <span key={word} className="text-green-600">
            ✅ {word}
            {i < matched.length - 1 || unmatched.length > 0 ? ' ·' : ''}
          </span>
        ))}
        {unmatched.map((word, i) => (
          <span key={word} className="text-gray-400">
            ❌ {word}
            {i < unmatched.length - 1 ? ' ·' : ''}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {matched.length} of {curriculumWords.length} curriculum words used!
      </p>
    </div>
  );
}
