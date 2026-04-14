'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguageStore } from '@/stores/languageStore';
import { VotingPanel } from '@/features/battle/components/VotingPanel';
import { VocabularySpotlight } from '@/components/VocabularySpotlight';

/* ------------------------------------------------------------------ */
/*  TTS helpers                                                        */
/* ------------------------------------------------------------------ */

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  'zh-Hans': 'zh-CN',
};

function findBestVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const bcp47 = LANG_MAP[lang] || lang;
  const prefix = bcp47.split('-')[0];
  const localVoices = voices.filter(
    (v) => v.lang.startsWith(prefix) && v.localService !== false
  );
  const remoteVoices = voices.filter((v) => v.lang.startsWith(prefix));
  return localVoices[0] || remoteVoices[0];
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BattleStory {
  id: string;
  title: string;
  language: string;
  matchup: {
    fighterA: string;
    numberA: number;
    fighterB: string;
    numberB: number;
    setting: string;
    twist: string;
  };
  pagesJson: { pageNumber: number; text: string }[];
  storyText: string;
  parentStoryId: string | null;
  remixCount: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Battle Story Reader                                                */
/* ------------------------------------------------------------------ */

export default function BattleStoryReaderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const language = useLanguageStore((s) => s.language);
  const activeWords = useLanguageStore((s) => s.activeWords);

  const [story, setStory] = useState<BattleStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch story
  useEffect(() => {
    async function fetchStory() {
      try {
        const res = await fetch(`/api/battle-stories/${id}`);
        if (!res.ok) {
          setError('Story not found');
          return;
        }
        setStory(await res.json());
      } catch {
        setError('Failed to load story');
      } finally {
        setLoading(false);
      }
    }
    fetchStory();
  }, [id]);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const pages = story?.pagesJson ?? [];
  const page = pages[currentPage];
  const storyLang = story?.language || language;

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_MAP[storyLang] || storyLang;
      const voice = findBestVoice(storyLang);
      if (voice) utterance.voice = voice;
      utterance.rate = playbackRate;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [storyLang, playbackRate]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const goToPage = useCallback(
    (idx: number) => {
      stopSpeaking();
      setCurrentPage(idx);
    },
    [stopSpeaking]
  );

  const handleRemix = useCallback(() => {
    if (!story) return;
    const params = new URLSearchParams({
      remix: story.id,
      fighterA: story.matchup.fighterA,
      numberA: String(story.matchup.numberA),
      fighterB: story.matchup.fighterB,
      numberB: String(story.matchup.numberB),
      setting: story.matchup.setting,
      twist: story.matchup.twist,
    });
    router.push(`/battle-stories?${params.toString()}`);
  }, [story, router]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' && currentPage > 0) {
        goToPage(currentPage - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (speaking) {
          stopSpeaking();
        } else if (page) {
          speak(page.text);
        }
      } else if (e.key === 'Escape') {
        router.push('/battle-stories');
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, pages.length, speaking, page, speak, stopSpeaking, goToPage, router]);

  /* ---- Loading / Error states ---- */

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading your battle story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-4xl mb-3">{'\u{1F61E}'}</p>
          <p className="text-gray-700 font-medium">{error || 'Story not found'}</p>
          <button
            onClick={() => router.push('/battle-stories')}
            className="mt-4 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Builder
          </button>
        </div>
      </div>
    );
  }

  /* ---- Main Reader ---- */

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/battle-stories')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {'\u2190'} Back
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold ">{story.title}</h1>
          <p className="text-xs text-gray-400">
            {story.matchup.numberA} {story.matchup.fighterA} vs{' '}
            {story.matchup.numberB} {story.matchup.fighterB} in{' '}
            {story.matchup.setting}
          </p>
          {story.parentStoryId && (
            <p className="text-xs text-orange-500 mt-0.5">
              {'\u{1F504}'} Remix of another story
            </p>
          )}
        </div>
        <button
          onClick={handleRemix}
          className="shrink-0 px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
          title="Show Your Version"
        >
          {'\u{1F504}'} Remix
        </button>
      </div>

      {/* Page Display */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
        {/* Page content */}
        <div className="p-8 md:p-12 min-h-[300px] flex items-center justify-center">
          <p className="text-xl md:text-2xl leading-relaxed text-gray-800 text-center font-serif">
            {page?.text || 'No content'}
          </p>
        </div>

        {/* Page indicator */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Page {currentPage + 1} of {pages.length}
          </span>
          <div className="flex gap-1">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  idx === currentPage
                    ? 'bg-red-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
        {/* Left: playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              speaking ? stopSpeaking() : page && speak(page.text)
            }
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              speaking
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
          >
            {speaking ? '\u23F9 Stop' : '\u{1F50A} Listen'}
          </button>
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x</option>
            <option value={1.25}>1.25x</option>
          </select>
        </div>

        {/* Right: navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {'\u2190'} Prev
          </button>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pages.length - 1}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next {'\u2192'}
          </button>
        </div>
      </div>

      {/* Voting */}
      <VotingPanel storyId={story.id} />

      {/* Vocabulary Spotlight */}
      {activeWords.length > 0 && story && (
        <VocabularySpotlight
          curriculumWords={activeWords.map(w => w.word)}
          storyText={story.storyText}
          language={story.language}
        />
      )}

      {/* Remix stats */}
      {story.remixCount > 0 && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            {'\u{1F504}'} This story has been remixed {story.remixCount} time
            {story.remixCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Keyboard hints */}
      <p className="text-center text-xs text-gray-400">
        Use {'\u2190'}{'\u2192'} arrow keys to navigate, Space to listen, Esc to
        go back
      </p>
    </div>
  );
}
