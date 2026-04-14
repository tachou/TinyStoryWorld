'use client';

import { useState, useCallback } from 'react';

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

interface VocabularyCardsProps {
  words: string[];
  language: string;
  onDismiss: () => void;
}

export function VocabularyCards({ words, language, onDismiss }: VocabularyCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_MAP[language] || language;
      const voice = findBestVoice(language);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  if (words.length === 0) return null;

  const word = words[currentIndex];
  const isLast = currentIndex >= words.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {'\u{1F4DD}'} Pre-Reading Vocabulary
          </h2>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            {'\u2715'}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          These words appear in the book but aren't in your word list. Tap to hear!
        </p>

        {/* Card */}
        <div
          className="min-h-[180px] flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl border-2 border-primary-200 cursor-pointer"
          onClick={() => {
            speak(word);
            setRevealed(true);
          }}
        >
          <p className="text-4xl font-bold text-gray-900 mb-2">{word}</p>
          {!revealed && (
            <p className="text-xs text-primary-400">Tap to hear pronunciation</p>
          )}
          {revealed && (
            <p className="text-sm text-primary-600 mt-2">
              {'\u{1F50A}'} Listen again
            </p>
          )}
        </div>

        {/* Progress + Navigation */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {currentIndex + 1} of {words.length}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  setRevealed(false);
                }
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {'\u2190'} Prev
            </button>

            {isLast ? (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Start Reading {'\u2192'}
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentIndex(currentIndex + 1);
                  setRevealed(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Next {'\u2192'}
              </button>
            )}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1">
          {words.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-primary-500' : idx < currentIndex ? 'bg-primary-200' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
