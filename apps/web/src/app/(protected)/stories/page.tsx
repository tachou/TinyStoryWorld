'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguageStore } from '@/stores/languageStore';
import { CurriculumBadge } from '@/components/CurriculumBadge';

interface GeneratedStoryPreview {
  id: string;
  title: string;
  theme: string;
  language: string;
  readingStage: string;
  coveragePct: number | null;
  generatedAt: string;
}

interface WordListOption {
  id: string;
  name: string;
  language: string;
  words: { word: string }[];
}

const THEMES = [
  { key: 'adventure', emoji: '\u{1F3D4}\uFE0F', label: 'Adventure' },
  { key: 'friendship', emoji: '\u{1F91D}', label: 'Friendship' },
  { key: 'animals', emoji: '\u{1F43E}', label: 'Animals' },
  { key: 'space', emoji: '\u{1F680}', label: 'Space' },
  { key: 'underwater', emoji: '\u{1F30A}', label: 'Underwater' },
  { key: 'magic', emoji: '\u2728', label: 'Magic' },
  { key: 'school', emoji: '\u{1F3EB}', label: 'School' },
  { key: 'sports', emoji: '\u26BD', label: 'Sports' },
  { key: 'nature', emoji: '\u{1F33F}', label: 'Nature' },
  { key: 'family', emoji: '\u{1F46A}', label: 'Family' },
  { key: 'food', emoji: '\u{1F354}', label: 'Food' },
  { key: 'seasons', emoji: '\u{1F343}', label: 'Seasons' },
];

const READING_STAGES = [
  { key: 'emergent', label: 'Emergent' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'in_transition', label: 'In Transition' },
  { key: 'competent', label: 'Competent' },
  { key: 'experienced', label: 'Experienced' },
];

export default function StoriesPage() {
  const language = useLanguageStore((s) => s.language);
  const activeWordlistId = useLanguageStore((s) => s.activeWordlistId);
  const profileReadingStage = useLanguageStore((s) => s.profileReadingStage);

  const [stories, setStories] = useState<GeneratedStoryPreview[]>([]);
  const [wordLists, setWordLists] = useState<WordListOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Generator form state
  const [selectedTheme, setSelectedTheme] = useState('adventure');
  const [readingStage, setReadingStage] = useState(profileReadingStage);
  const [wordlistId, setWordlistId] = useState('');

  // Sync reading stage from profile
  useEffect(() => {
    setReadingStage(profileReadingStage);
  }, [profileReadingStage]);

  // Auto-populate wordlist from global curriculum
  useEffect(() => {
    if (activeWordlistId) {
      setWordlistId(activeWordlistId);
    } else {
      setWordlistId('');
    }
  }, [activeWordlistId]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [storiesRes, wordListsRes] = await Promise.all([
          fetch('/api/stories'),
          fetch('/api/word-lists'),
        ]);
        if (storiesRes.ok) setStories(await storiesRes.json());
        if (wordListsRes.ok) setWordLists(await wordListsRes.json());
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          language,
          readingStage,
          wordlistId: wordlistId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate story');
        return;
      }

      const story = await res.json();
      // Add to list and navigate
      setStories((prev) => [story, ...prev]);
      window.location.href = `/stories/${story.id}`;
    } catch {
      setError('Network error — please try again');
    } finally {
      setGenerating(false);
    }
  };

  const themeEmoji = (key: string) =>
    THEMES.find((t) => t.key === key)?.emoji || '\u2728';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold ">
          {'\u2728'} AI Story Generator
        </h1>
        <p className="text-gray-500 mt-1">
          Generate personalized stories from your vocabulary words
        </p>
        <div className="mt-2">
          <CurriculumBadge />
        </div>
      </div>

      {/* Generator Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        {/* Theme Picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Choose a Theme
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.key}
                onClick={() => setSelectedTheme(theme.key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                  selectedTheme === theme.key
                    ? 'bg-primary-100 border-primary-300 text-primary-700 ring-2 ring-primary-300'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{theme.emoji}</span>
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reading Stage */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Reading Level
          </label>
          <select
            value={readingStage}
            onChange={(e) => setReadingStage(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {READING_STAGES.map((stage) => (
              <option key={stage.key} value={stage.key}>
                {stage.label}{stage.key === profileReadingStage ? ' (your level)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Word List (optional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Vocabulary Word List{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            value={wordlistId}
            onChange={(e) => setWordlistId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No word list — free generation</option>
            {wordLists.map((wl) => (
              <option key={wl.id} value={wl.id}>
                {wl.name} ({wl.words.length} words, {wl.language})
              </option>
            ))}
          </select>
          {wordlistId && (
            <p className="text-xs text-primary-500 mt-1">
              The story will incorporate vocabulary from this word list and show a
              coverage score.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full px-5 py-3 text-sm font-bold bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generating Story...
            </span>
          ) : (
            <>{'\u2728'} Generate Story</>
          )}
        </button>
      </div>

      {/* Story List */}
      {!loading && stories.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {'\u{1F4DA}'} Your Stories
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className="text-2xl">{themeEmoji(story.theme)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {story.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 capitalize">
                      {story.theme}
                    </span>
                    {story.coveragePct !== null && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          story.coveragePct >= 0.7
                            ? 'bg-green-100 text-green-700'
                            : story.coveragePct >= 0.4
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {Math.round(story.coveragePct * 100)}% coverage
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(story.generatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="text-gray-400">{'\u2192'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && stories.length === 0 && (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
          <p className="text-3xl mb-2">{'\u2728'}</p>
          <p className="text-gray-500">No stories generated yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Pick a theme above and generate your first story!
          </p>
        </div>
      )}
    </div>
  );
}
