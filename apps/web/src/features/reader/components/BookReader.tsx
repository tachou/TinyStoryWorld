'use client';

import { useState, useEffect, useCallback } from 'react';
import { speakWord } from '@tiny-story-world/audio';
import type { Language } from '@tiny-story-world/types';
import { useAudioSync, type WordTiming, type ReadingMode } from '../hooks/useAudioSync';

interface BookPage {
  id: string;
  pageNumber: number;
  textContent: string;
  translationEn?: string | null;
  illustrationUrl?: string | null;
  wordAlignments?: WordTiming[] | null;
  audioSegment?: { start: number; end: number } | null;
}

interface BookData {
  id: string;
  title: string;
  language: string;
  pageCount: number;
  audioUrl?: string | null;
  pages: BookPage[];
}

interface BookReaderProps {
  book: BookData;
  onClose?: () => void;
  onSessionComplete?: (pagesRead: number, durationSeconds: number) => void;
  showTranslationToggle?: boolean;
  backLabel?: string;
}

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25];

export function BookReader({ book, onClose, onSessionComplete, showTranslationToggle, backLabel }: BookReaderProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sessionStart] = useState(() => Date.now());
  const [showTranslation, setShowTranslation] = useState(false);
  const lang = book.language as Language;
  const isEnglishBook = book.language === 'en';

  const {
    isPlaying,
    currentWordIndex,
    playbackRate,
    mode,
    loadPage,
    play,
    pause,
    togglePlayPause,
    setPlaybackRate,
    setMode,
  } = useAudioSync();

  const currentPage = book.pages[currentPageIndex];
  const totalPages = book.pages.length;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;

  // Load audio alignment when page changes
  useEffect(() => {
    if (!currentPage) return;

    const alignments = currentPage.wordAlignments || generateFallbackAlignments(currentPage.textContent, lang);

    // Use page-level audio segment from the book's main audio file
    let audioUrl: string | null = null;
    if (book.audioUrl && currentPage.audioSegment) {
      // For MVP, we use the full audio URL — proper segment seeking would need Media Source Extensions
      audioUrl = book.audioUrl;
    }

    loadPage(audioUrl, alignments, lang);
  }, [currentPageIndex, currentPage, book.audioUrl, loadPage, lang]);

  const goToPage = useCallback((index: number) => {
    if (index >= 0 && index < totalPages) {
      pause();
      setCurrentPageIndex(index);
    }
  }, [totalPages, pause]);

  const handlePrevPage = useCallback(() => goToPage(currentPageIndex - 1), [currentPageIndex, goToPage]);
  const handleNextPage = useCallback(() => goToPage(currentPageIndex + 1), [currentPageIndex, goToPage]);

  const handleClose = useCallback(() => {
    pause();
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    onSessionComplete?.(currentPageIndex + 1, duration);
    onClose?.();
  }, [pause, sessionStart, currentPageIndex, onSessionComplete, onClose]);

  const handleWordClick = useCallback((word: string) => {
    if (!isPlaying) {
      const ttsLang: Language = (showTranslation && currentPage?.translationEn) ? 'en' : lang;
      speakWord(word, ttsLang, false);
    }
  }, [isPlaying, showTranslation, currentPage, lang]);

  // Auto-play in Listen mode when page changes
  useEffect(() => {
    if (mode === 'listen' && currentPage) {
      const timer = setTimeout(() => play(), 300);
      return () => clearTimeout(timer);
    }
  }, [mode, currentPageIndex, play, currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevPage();
          break;
        case 'ArrowRight':
          handleNextPage();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrevPage, handleNextPage, togglePlayPause, handleClose]);

  if (!currentPage) return null;

  // When translation toggle is on, show English text and use English for TTS
  const displayingTranslation = showTranslation && !!currentPage.translationEn;
  const displayText = displayingTranslation ? currentPage.translationEn! : currentPage.textContent;
  const displayLang: Language = displayingTranslation ? 'en' : lang;

  // Split text into words for rendering
  const words = splitIntoWords(displayText, displayLang);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
        <button
          onClick={handleClose}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          {'\u2190'} {backLabel || 'Back to Library'}
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-800 truncate max-w-md">{book.title}</h2>
          {showTranslationToggle && !isEnglishBook && (
            currentPage.translationEn ? (
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                  showTranslation
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                }`}
                title="Toggle English translation"
              >
                {showTranslation ? 'English' : 'Original'}
              </button>
            ) : (
              <span className="text-xs text-gray-400 italic">No translation</span>
            )
          )}
        </div>
        <span className="text-sm text-gray-400">
          {currentPageIndex + 1} / {totalPages}
        </span>
      </header>

      {/* Page content */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-8">
        <div className="max-w-2xl w-full">
          {/* Illustration */}
          {currentPage.illustrationUrl && (
            <div className="mb-6 rounded-xl overflow-hidden shadow-md">
              <img
                src={currentPage.illustrationUrl}
                alt={`Page ${currentPage.pageNumber} illustration`}
                className="w-full h-auto max-h-64 object-cover"
              />
            </div>
          )}

          {/* Text with word highlighting */}
          <div className="text-xl md:text-2xl leading-relaxed text-gray-800 font-serif">
            {words.map((word, i) => {
              const isHighlighted = !displayingTranslation && currentWordIndex === i;
              const isWhitespace = /^\s+$/.test(word);

              if (isWhitespace) {
                return <span key={i}>{word}</span>;
              }

              return (
                <span
                  key={i}
                  onClick={() => handleWordClick(word)}
                  className={`
                    cursor-pointer rounded px-0.5 transition-all duration-100
                    ${isHighlighted
                      ? 'bg-yellow-300 text-gray-900 scale-105 inline-block'
                      : 'hover:bg-blue-50 hover:text-blue-800'
                    }
                  `}
                  role="button"
                  aria-label={`Word: ${word}`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <footer className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={isFirstPage}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {'\u2190'} Prev
            </button>

            {/* Page dots (for short books) */}
            {totalPages <= 20 && (
              <div className="flex gap-1">
                {book.pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentPageIndex ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleNextPage}
              disabled={isLastPage}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next {'\u2192'}
            </button>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-3">
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
              <button
                onClick={() => setMode('listen')}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  mode === 'listen' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Listen
              </button>
              <button
                onClick={() => setMode('read')}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  mode === 'read' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Read
              </button>
            </div>

            {/* Play/Pause */}
            {mode === 'listen' && (
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
              >
                {isPlaying ? '\u23F8' : '\u25B6'}
              </button>
            )}

            {/* Speed control */}
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-600"
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function splitIntoWords(text: string, lang: Language): string[] {
  if (lang === 'zh-Hans') {
    // Chinese: split every character (simplified approach)
    return text.split('').filter((c) => c.trim().length > 0);
  }
  // Latin languages: split on whitespace, preserving spaces for rendering
  const parts: string[] = [];
  const tokens = text.split(/(\s+)/);
  for (const token of tokens) {
    if (token.length > 0) parts.push(token);
  }
  return parts;
}

/**
 * Generate fallback word alignments when none exist in DB.
 * Assumes uniform timing across words — used for TTS fallback.
 */
function generateFallbackAlignments(text: string, lang: Language): WordTiming[] {
  const words = splitIntoWords(text, lang).filter((w) => !/^\s+$/.test(w));
  const avgDuration = 0.4; // seconds per word estimate
  return words.map((word, i) => ({
    word,
    start: i * avgDuration,
    end: (i + 1) * avgDuration,
  }));
}
