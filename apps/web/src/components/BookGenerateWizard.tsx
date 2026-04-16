'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────

type Level = 'emergent' | 'beginner' | 'in_transition' | 'competent' | 'experienced';

interface WordList {
  id: string;
  name: string;
  language: string;
  ownerId: string;
  isPublic?: boolean;
  words: Array<{ word: string; pos?: string }>;
}

interface Props {
  onClose: () => void;
  onGenerated: () => void;
  currentUserId: string;
}

type BookState =
  | { status: 'pending' }
  | { status: 'writing' }
  | { status: 'done'; bookId: string; title: string }
  | { status: 'error'; message: string };

interface DuplicateMatch {
  id: string;
  title: string;
  createdAt: string;
  isDraft: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────

const LEVELS: Array<{ value: Level; label: string; pages: number; wpp: string }> = [
  { value: 'emergent', label: 'Emergent', pages: 6, wpp: '3–6' },
  { value: 'beginner', label: 'Beginner', pages: 8, wpp: '8–15' },
  { value: 'in_transition', label: 'In Transition', pages: 10, wpp: '15–25' },
  { value: 'competent', label: 'Competent', pages: 12, wpp: '25–40' },
  { value: 'experienced', label: 'Experienced', pages: 14, wpp: '40–60' },
];

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'French',
  'zh-Hans': 'Chinese',
};

// ─── Component ──────────────────────────────────────────────────────────

export function BookGenerateWizard({ onClose, onGenerated, currentUserId }: Props) {
  // Lists
  const [lists, setLists] = useState<WordList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);

  // Form fields
  const [wordlistId, setWordlistId] = useState<string>('');
  const [level, setLevel] = useState<Level>('beginner');
  const [count, setCount] = useState<number>(3);
  const [emphasized, setEmphasized] = useState<string[]>([]);
  const [hasPictures, setHasPictures] = useState(false);

  // Generation phase
  const [phase, setPhase] = useState<'form' | 'running' | 'done'>('form');
  const [bookStates, setBookStates] = useState<BookState[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Duplicate warning
  const [dupMatches, setDupMatches] = useState<DuplicateMatch[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load word lists once
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch('/api/word-lists');
        if (!res.ok) throw new Error('Failed to load word lists');
        const data = (await res.json()) as WordList[];
        if (canceled) return;
        setLists(data);
        // Pick the first list the user owns as default
        const firstOwned = data.find((l) => l.ownerId === currentUserId) || data[0];
        if (firstOwned) setWordlistId(firstOwned.id);
      } catch {
        // non-critical — empty state handled below
      } finally {
        if (!canceled) setListsLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [currentUserId]);

  const selectedList = useMemo(
    () => lists.find((l) => l.id === wordlistId) || null,
    [lists, wordlistId]
  );

  const selectedLevel = useMemo(
    () => LEVELS.find((l) => l.value === level)!,
    [level]
  );

  const canGenerate = !!selectedList && phase === 'form';

  const toggleEmphasized = useCallback((word: string) => {
    setEmphasized((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  }, []);

  // Reset emphasized when list changes (words may not exist in new list)
  useEffect(() => {
    setEmphasized([]);
  }, [wordlistId]);

  const handleGenerate = useCallback(
    async (allowDuplicate: boolean) => {
      if (!selectedList) return;
      setDupMatches(null);
      setBatchError(null);
      setBookStates(Array.from({ length: count }, () => ({ status: 'pending' }) as BookState));
      setPhase('running');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/books/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wordlistId: selectedList.id,
            level,
            count,
            emphasizedWords: emphasized,
            hasPictures,
            allowDuplicate,
          }),
          signal: controller.signal,
        });

        if (!res.body) {
          setBatchError('Stream not supported');
          setPhase('done');
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let sawBatchDone = false;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by double newlines
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';

          for (const frame of frames) {
            const line = frame.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            const payload = line.slice(6);
            let evt: any;
            try {
              evt = JSON.parse(payload);
            } catch {
              continue;
            }

            if (evt.type === 'duplicate_warning') {
              setDupMatches(evt.matches || []);
              setPhase('form');
              return;
            }
            if (evt.type === 'error') {
              setBatchError(evt.message || 'Generation failed');
            }
            if (evt.type === 'book_start') {
              setBookStates((prev) =>
                prev.map((s, i) => (i === evt.bookIndex ? { status: 'writing' } : s))
              );
            }
            if (evt.type === 'book_done') {
              setBookStates((prev) =>
                prev.map((s, i) =>
                  i === evt.bookIndex
                    ? { status: 'done', bookId: evt.bookId, title: evt.title }
                    : s
                )
              );
            }
            if (evt.type === 'book_error') {
              setBookStates((prev) =>
                prev.map((s, i) =>
                  i === evt.bookIndex ? { status: 'error', message: evt.message } : s
                )
              );
            }
            if (evt.type === 'batch_done') {
              sawBatchDone = true;
            }
          }
        }

        if (sawBatchDone) setPhase('done');
        else if (!batchError) setPhase('done');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setBatchError(err.message || 'Stream failed');
          setPhase('done');
        }
      } finally {
        abortRef.current = null;
        onGenerated();
      }
    },
    [selectedList, level, count, emphasized, hasPictures, onGenerated, batchError]
  );

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────

  const ownedLists = lists.filter((l) => l.ownerId === currentUserId);
  const publicLists = lists.filter((l) => l.isPublic && l.ownerId !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800">
            {phase === 'form' && 'Generate Books'}
            {phase === 'running' && `Generating ${count} book${count > 1 ? 's' : ''}…`}
            {phase === 'done' && 'Generation complete'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            {'\u00D7'}
          </button>
        </header>

        {/* ─── Form phase ─── */}
        {phase === 'form' && (
          <div className="p-6 space-y-6">
            {dupMatches && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900 mb-2">
                  You already have {dupMatches.length} book
                  {dupMatches.length > 1 ? 's' : ''} with these settings
                </p>
                <ul className="text-sm text-amber-800 mb-3 space-y-1 list-disc list-inside">
                  {dupMatches.map((m) => (
                    <li key={m.id}>
                      {m.title}
                      {m.isDraft && ' (draft)'} — {new Date(m.createdAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDupMatches(null)}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg text-gray-600 border border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleGenerate(true)}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Generate anyway
                  </button>
                </div>
              </div>
            )}

            {/* Word list */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source word list
              </label>
              {listsLoading ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : lists.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No word lists available. Create one in{' '}
                  <Link href="/dashboard/word-lists" className="text-primary-600 underline">
                    Word Lists
                  </Link>{' '}
                  first.
                </p>
              ) : (
                <select
                  value={wordlistId}
                  onChange={(e) => setWordlistId(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="" disabled>
                    Select a word list
                  </option>
                  {ownedLists.length > 0 && (
                    <optgroup label="My lists">
                      {ownedLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({LANG_LABELS[l.language] || l.language}, {l.words.length} words)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {publicLists.length > 0 && (
                    <optgroup label="Public lists">
                      {publicLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({LANG_LABELS[l.language] || l.language}, {l.words.length} words)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
              {selectedList && (
                <p className="text-xs text-gray-400 mt-1">
                  Language: <span className="font-medium">{LANG_LABELS[selectedList.language] || selectedList.language}</span>
                </p>
              )}
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reading level</label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {LEVELS.map((lv) => (
                  <button
                    key={lv.value}
                    type="button"
                    onClick={() => setLevel(lv.value)}
                    className={`text-xs font-medium px-2 py-2 rounded-lg border transition-colors ${
                      level === lv.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {lv.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {selectedLevel.pages} pages · {selectedLevel.wpp} words per page
              </p>
            </div>

            {/* Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of books</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                      count === n
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Emphasized words */}
            {selectedList && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emphasized words / phrases{' '}
                  <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                {selectedList.words.length === 0 ? (
                  <p className="text-xs text-gray-400">This word list is empty.</p>
                ) : (
                  <div
                    key={selectedList.id}
                    data-debug-count={selectedList.words.length}
                    className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    {selectedList.words.map((w) => {
                      const on = emphasized.includes(w.word);
                      return (
                        <button
                          key={w.word}
                          type="button"
                          onClick={() => toggleEmphasized(w.word)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border transition-colors ${
                            on
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50'
                          }`}
                        >
                          {w.word}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to let the AI pick from the full list.
                </p>
              </div>
            )}

            {/* Pictures */}
            <div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasPictures}
                  onChange={(e) => setHasPictures(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-gray-700">Each page has a picture</span>
                  <span className="block text-xs text-gray-400">
                    Turns on image upload slots on each page after generation.
                  </span>
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={onClose}
                className="text-sm font-medium px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerate(false)}
                disabled={!canGenerate}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate {count} book{count > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* ─── Running phase ─── */}
        {phase === 'running' && (
          <div className="p-6 space-y-3">
            <p className="text-sm text-gray-500 mb-3">
              Generating from <strong>{selectedList?.name}</strong> · {selectedLevel.label}
            </p>
            {bookStates.map((s, i) => (
              <BookRow key={i} index={i} state={s} />
            ))}
            <div className="flex justify-end pt-3">
              <button
                onClick={handleCancel}
                className="text-sm font-medium px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ─── Done phase ─── */}
        {phase === 'done' && (
          <div className="p-6 space-y-3">
            {batchError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {batchError}
              </p>
            )}
            {bookStates.map((s, i) => (
              <BookRow key={i} index={i} state={s} />
            ))}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={onClose}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookRow({ index, state }: { index: number; state: BookState }) {
  if (state.status === 'pending') {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="w-6 text-gray-400">{index + 1}.</span>
        <span className="flex-1 text-gray-400 italic">Waiting…</span>
      </div>
    );
  }
  if (state.status === 'writing') {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="w-6 text-gray-500">{index + 1}.</span>
        <span className="flex-1 text-gray-700">Writing…</span>
        <span className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (state.status === 'done') {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="w-6 text-green-600">{'\u2713'}</span>
        <Link
          href={`/dashboard/books/preview?bookId=${state.bookId}`}
          className="flex-1 font-medium text-primary-700 hover:underline truncate"
        >
          {state.title}
        </Link>
        <span className="text-xs text-gray-400">draft</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-6 text-red-600">{'\u26A0'}</span>
      <div className="flex-1">
        <p className="text-red-700 font-medium">Failed</p>
        <p className="text-xs text-red-500 break-words">{state.message}</p>
      </div>
    </div>
  );
}
