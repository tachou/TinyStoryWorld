'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;
}

export type ReadingMode = 'listen' | 'read';

interface AudioSyncState {
  isPlaying: boolean;
  currentWordIndex: number | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  mode: ReadingMode;
}

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

export function useAudioSync() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const alignmentsRef = useRef<WordTiming[]>([]);
  const langRef = useRef<string>('en');

  const [state, setState] = useState<AudioSyncState>({
    isPlaying: false,
    currentWordIndex: null,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
    mode: 'listen',
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const findWordIndex = useCallback((time: number): number | null => {
    const alignments = alignmentsRef.current;
    for (let i = 0; i < alignments.length; i++) {
      if (time >= alignments[i].start && time < alignments[i].end) {
        return i;
      }
    }
    return null;
  }, []);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;

    const time = audio.currentTime;
    const wordIndex = findWordIndex(time);

    setState((prev) => ({
      ...prev,
      currentTime: time,
      currentWordIndex: wordIndex,
    }));

    animFrameRef.current = requestAnimationFrame(tick);
  }, [findWordIndex]);

  const loadPage = useCallback((audioUrl: string | null, alignments: WordTiming[], language?: string) => {
    if (language) langRef.current = language;
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }

    alignmentsRef.current = alignments;

    if (!audioUrl) {
      audioRef.current = null;
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentWordIndex: null,
        currentTime: 0,
        duration: 0,
      }));
      return;
    }

    const audio = new Audio(audioUrl);
    audio.playbackRate = state.playbackRate;
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setState((prev) => ({ ...prev, duration: audio.duration }));
    });

    audio.addEventListener('ended', () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentWordIndex: null,
        currentTime: 0,
      }));
    });
  }, [state.playbackRate]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      // No audio file — use browser TTS fallback with word timings
      useTTSFallback(alignmentsRef.current, state.playbackRate, setState, langRef.current);
      return;
    }

    audio.play();
    setState((prev) => ({ ...prev, isPlaying: true }));
    animFrameRef.current = requestAnimationFrame(tick);
  }, [tick, state.playbackRate]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const setPlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
    setState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  const setMode = useCallback((mode: ReadingMode) => {
    if (mode === 'read') {
      pause();
    }
    setState((prev) => ({ ...prev, mode }));
  }, [pause]);

  const seekToWord = useCallback((index: number) => {
    const alignments = alignmentsRef.current;
    if (index < 0 || index >= alignments.length) return;

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = alignments[index].start;
      setState((prev) => ({ ...prev, currentTime: alignments[index].start, currentWordIndex: index }));
    }
  }, []);

  return {
    ...state,
    loadPage,
    play,
    pause,
    togglePlayPause,
    setPlaybackRate,
    setMode,
    seekToWord,
  };
}

/**
 * TTS fallback when no audio file is available.
 * Uses browser SpeechSynthesis with timed word highlighting.
 */
function useTTSFallback(
  alignments: WordTiming[],
  playbackRate: number,
  setState: React.Dispatch<React.SetStateAction<AudioSyncState>>,
  lang: string = 'en'
) {
  if (typeof window === 'undefined' || !window.speechSynthesis || alignments.length === 0) return;

  const separator = lang === 'zh-Hans' ? '' : ' ';
  const text = alignments.map((a) => a.word).join(separator);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_MAP[lang] || lang;
  utterance.rate = playbackRate * 0.85;
  utterance.pitch = 1.05;

  // Use a matching voice for the language
  const voice = findBestVoice(lang);
  if (voice) utterance.voice = voice;

  // Estimate per-word timing for highlighting
  const avgWordDuration = (text.length * 65) / alignments.length;
  let wordIndex = 0;

  utterance.onstart = () => {
    setState((prev) => ({ ...prev, isPlaying: true, currentWordIndex: 0 }));

    const timer = setInterval(() => {
      wordIndex++;
      if (wordIndex < alignments.length) {
        setState((prev) => ({ ...prev, currentWordIndex: wordIndex }));
      } else {
        clearInterval(timer);
      }
    }, avgWordDuration / playbackRate);

    utterance.onend = () => {
      clearInterval(timer);
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentWordIndex: null,
      }));
    };
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
