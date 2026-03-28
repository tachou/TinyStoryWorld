import type { Language, WordTile } from '@tiny-story-world/types';

export type { Language, WordTile } from '@tiny-story-world/types';

// ─── Language → BCP 47 mapping ──────────────────────────────────────────

const LANG_MAP: Record<Language, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  'zh-Hans': 'zh-CN',
};

// ─── Voice cache ────────────────────────────────────────────────────────

const voiceCache: Partial<Record<Language, SpeechSynthesisVoice>> = {};

function findBestVoice(lang: Language): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const prefix = LANG_MAP[lang].split('-')[0];

  const localVoices = voices.filter(
    (v) => v.lang.startsWith(prefix) && v.localService !== false
  );
  const remoteVoices = voices.filter((v) => v.lang.startsWith(prefix));

  return localVoices[0] || remoteVoices[0];
}

/**
 * Pre-select the best voice for each language.
 * Call once on mount + when `voiceschanged` fires.
 */
export function preloadVoices(): void {
  const langs: Language[] = ['en', 'fr', 'zh-Hans'];
  for (const lang of langs) {
    const voice = findBestVoice(lang);
    if (voice) voiceCache[lang] = voice;
  }
}

// ─── TTS callbacks (replaces gameStore coupling) ────────────────────────

export interface TTSCallbacks {
  /** Called when playback starts */
  onStart?: () => void;
  /** Called when playback ends (or errors) */
  onEnd?: () => void;
  /** Called during karaoke highlighting with the active tile index */
  onHighlight?: (index: number | null) => void;
}

// ─── Speak a full sentence with karaoke highlighting ────────────────────

let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speak an array of word tiles as a sentence using the browser TTS API.
 * Provides karaoke-style highlighting via `callbacks.onHighlight`.
 */
export function speakSentence(
  tiles: WordTile[],
  lang: Language,
  callbacks: TTSCallbacks = {}
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis || tiles.length === 0) return;

  window.speechSynthesis.cancel();

  const separator = lang === 'zh-Hans' ? '' : ' ';
  const text = tiles.map((t) => t.word).join(separator);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_MAP[lang];
  utterance.rate = 0.85;
  utterance.pitch = 1.1;

  const cachedVoice = voiceCache[lang];
  if (cachedVoice) utterance.voice = cachedVoice;

  activeUtterance = utterance;

  // Compute character offsets for karaoke word boundaries
  const wordBoundaries: number[] = [];
  let charPos = 0;
  for (const tile of tiles) {
    wordBoundaries.push(charPos);
    charPos += tile.word.length + (lang === 'zh-Hans' ? 0 : 1);
  }

  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      const charIndex = event.charIndex;
      for (let i = wordBoundaries.length - 1; i >= 0; i--) {
        if (charIndex >= wordBoundaries[i]) {
          callbacks.onHighlight?.(i);
          break;
        }
      }
    }
  };

  utterance.onstart = () => {
    callbacks.onStart?.();
    callbacks.onHighlight?.(0);

    // Fallback timer for browsers that don't fire onboundary
    const avgDuration = (text.length * 80) / tiles.length;
    let fallbackIndex = 0;
    const fallbackTimer = setInterval(() => {
      fallbackIndex++;
      if (fallbackIndex < tiles.length) {
        callbacks.onHighlight?.(fallbackIndex);
      } else {
        clearInterval(fallbackTimer);
      }
    }, avgDuration);

    utterance.onend = () => {
      clearInterval(fallbackTimer);
      callbacks.onEnd?.();
      callbacks.onHighlight?.(null);
    };

    utterance.onerror = () => {
      clearInterval(fallbackTimer);
      callbacks.onEnd?.();
      callbacks.onHighlight?.(null);
    };
  };

  window.speechSynthesis.speak(utterance);
}

// ─── Speak a single word (tap-to-hear) ──────────────────────────────────

/**
 * Speak a single word aloud. Does NOT interrupt sentence-level TTS
 * when `isPlaying` is true.
 */
export function speakWord(
  word: string,
  lang: Language,
  isPlaying = false
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (isPlaying) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = LANG_MAP[lang];
  utterance.rate = 0.9;
  utterance.pitch = 1.1;

  const cachedVoice = voiceCache[lang];
  if (cachedVoice) utterance.voice = cachedVoice;

  window.speechSynthesis.speak(utterance);
}

// ─── Stop all TTS ───────────────────────────────────────────────────────

/**
 * Cancel all in-progress speech synthesis.
 */
export function stopSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  activeUtterance = null;
}
