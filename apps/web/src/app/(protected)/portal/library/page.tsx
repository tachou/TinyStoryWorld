'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguageStore } from '@/stores/languageStore';
import { CurriculumBadge } from '@/components/CurriculumBadge';

interface Book {
  id: string;
  title: string;
  language: string;
  stage: string;
  description?: string;
  pageCount: number;
  coverImageUrl?: string;
  genre?: string;
}

interface CoverageScore {
  coveragePct: number;
  matchedCount: number;
  totalCount: number;
  unmatchedWords: string[];
}

interface WordListOption {
  id: string;
  name: string;
  language: string;
  words: { word: string }[];
}

const STAGE_LABELS: Record<string, string> = {
  emergent: 'Emergent',
  beginner: 'Beginner',
  in_transition: 'In Transition',
  competent: 'Competent',
  experienced: 'Experienced',
};

const STAGE_COLORS: Record<string, string> = {
  emergent: 'bg-green-100 text-green-700',
  beginner: 'bg-blue-100 text-blue-700',
  in_transition: 'bg-yellow-100 text-yellow-700',
  competent: 'bg-purple-100 text-purple-700',
  experienced: 'bg-red-100 text-red-700',
};

function CoverageBadge({ pct }: { pct: number }) {
  const percent = Math.round(pct * 100);
  let colorClass: string;
  if (percent >= 90) colorClass = 'bg-green-100 text-green-700';
  else if (percent >= 80) colorClass = 'bg-emerald-100 text-emerald-700';
  else if (percent >= 70) colorClass = 'bg-yellow-100 text-yellow-700';
  else colorClass = 'bg-red-100 text-red-700';

  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colorClass}`}>
      {percent}%
    </span>
  );
}

function BookCard({
  book,
  score,
}: {
  book: Book;
  score?: CoverageScore;
}) {
  return (
    <Link
      href={`/portal/library/read?bookId=${book.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
    >
      {/* Cover */}
      <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl opacity-60">{'\u{1F4D6}'}</span>
        )}
        {/* Coverage badge overlay */}
        {score && (
          <div className="absolute top-2 right-2">
            <CoverageBadge pct={score.coveragePct} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
          {book.title}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              STAGE_COLORS[book.stage] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {STAGE_LABELS[book.stage] || book.stage}
          </span>
          <span className="text-xs text-gray-400">{book.pageCount} pages</span>
        </div>
        {score && (
          <p className="text-[10px] text-gray-400 mt-1">
            {score.matchedCount}/{score.totalCount} words matched
          </p>
        )}
        {book.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {book.description}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const globalLanguage = useLanguageStore((s) => s.language);
  const globalWordlistId = useLanguageStore((s) => s.activeWordlistId);
  const [stageFilter, setStageFilter] = useState<string>('');

  // Curriculum filtering
  const [wordLists, setWordLists] = useState<WordListOption[]>([]);
  const [selectedWordlistId, setSelectedWordlistId] = useState('');
  const [scores, setScores] = useState<Record<string, CoverageScore>>({});
  const [threshold, setThreshold] = useState(0.8);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [computing, setComputing] = useState(false);

  // Sync from global curriculum store
  useEffect(() => {
    if (globalWordlistId) {
      setSelectedWordlistId(globalWordlistId);
      setFilterEnabled(true);
    } else {
      setSelectedWordlistId('');
      setFilterEnabled(false);
    }
  }, [globalWordlistId]);

  // Fetch books
  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('language', globalLanguage);
        if (stageFilter) params.set('stage', stageFilter);

        const res = await fetch(`/api/books?${params}`);
        if (res.ok) setBooks(await res.json());
      } catch (err) {
        console.error('Failed to load books:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [globalLanguage, stageFilter]);

  // Fetch word lists
  useEffect(() => {
    async function fetchWordLists() {
      try {
        const res = await fetch('/api/word-lists');
        if (res.ok) setWordLists(await res.json());
      } catch (err) {
        console.error('Failed to fetch word lists:', err);
      }
    }
    fetchWordLists();
  }, []);

  // Fetch scores when word list changes
  useEffect(() => {
    if (!selectedWordlistId) {
      setScores({});
      return;
    }

    async function fetchScores() {
      try {
        const res = await fetch(
          `/api/books/curriculum-scores?wordlistId=${selectedWordlistId}`
        );
        if (res.ok) setScores(await res.json());
      } catch (err) {
        console.error('Failed to fetch scores:', err);
      }
    }
    fetchScores();
  }, [selectedWordlistId]);

  // Compute scores for selected word list
  const handleCompute = async () => {
    if (!selectedWordlistId) return;
    setComputing(true);
    try {
      const res = await fetch('/api/books/curriculum-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordlistId: selectedWordlistId }),
      });
      if (res.ok) {
        // Refresh scores
        const scoresRes = await fetch(
          `/api/books/curriculum-scores?wordlistId=${selectedWordlistId}`
        );
        if (scoresRes.ok) setScores(await scoresRes.json());
      }
    } catch (err) {
      console.error('Failed to compute scores:', err);
    } finally {
      setComputing(false);
    }
  };

  // Filtered books
  const { mainBooks, stretchBooks } = useMemo(() => {
    if (!filterEnabled || !selectedWordlistId || Object.keys(scores).length === 0) {
      return { mainBooks: books, stretchBooks: [] };
    }

    const main: Book[] = [];
    const stretch: Book[] = [];
    const stretchLower = Math.max(threshold - 0.15, 0);

    for (const book of books) {
      const score = scores[book.id];
      if (!score) continue;

      if (score.coveragePct >= threshold) {
        main.push(book);
      } else if (score.coveragePct >= stretchLower) {
        stretch.push(book);
      }
    }

    return { mainBooks: main, stretchBooks: stretch };
  }, [books, scores, threshold, filterEnabled, selectedWordlistId]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {'\u{1F4D6}'} Book Library
          </h1>
          <CurriculumBadge />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Stages</option>
          <option value="emergent">Emergent</option>
          <option value="beginner">Beginner</option>
          <option value="in_transition">In Transition</option>
          <option value="competent">Competent</option>
          <option value="experienced">Experienced</option>
        </select>
      </div>

      {/* Curriculum Filter Panel */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterEnabled}
                onChange={(e) => setFilterEnabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-semibold text-gray-700">
                {'\u{1F4CB}'} Curriculum Filter
              </span>
            </label>
          </div>
        </div>

        {filterEnabled && (
          <div className="space-y-3">
            {/* Word list selector */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Word List
                </label>
                <select
                  value={selectedWordlistId}
                  onChange={(e) => setSelectedWordlistId(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select a word list...</option>
                  {wordLists.map((wl) => (
                    <option key={wl.id} value={wl.id}>
                      {wl.name} ({wl.words.length} words)
                    </option>
                  ))}
                </select>
              </div>
              {selectedWordlistId && (
                <button
                  onClick={handleCompute}
                  disabled={computing}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {computing ? 'Computing...' : '\u{1F504} Scan Books'}
                </button>
              )}
            </div>

            {/* Threshold slider */}
            {selectedWordlistId && Object.keys(scores).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500">
                    Coverage Threshold
                  </label>
                  <span className="text-xs font-bold text-indigo-600">
                    {Math.round(threshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={threshold * 100}
                  onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Stats summary */}
            {selectedWordlistId && Object.keys(scores).length > 0 && (
              <p className="text-xs text-gray-400">
                Showing {mainBooks.length} book{mainBooks.length !== 1 ? 's' : ''} above{' '}
                {Math.round(threshold * 100)}% coverage
                {stretchBooks.length > 0 && (
                  <> + {stretchBooks.length} stretch book{stretchBooks.length !== 1 ? 's' : ''}</>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Book Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : mainBooks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-5xl mb-4">{'\u{1F4DA}'}</p>
          <p className="text-gray-500 text-lg">
            {filterEnabled && selectedWordlistId
              ? 'No books match your curriculum filter.'
              : 'No books available yet.'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {filterEnabled
              ? 'Try lowering the coverage threshold or selecting a different word list.'
              : 'Your teacher will add books soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mainBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              score={scores[book.id]}
            />
          ))}
        </div>
      )}

      {/* Stretch Books Section */}
      {filterEnabled && stretchBooks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              {'\u{1F4AA}'} Stretch Books
            </h2>
            <span className="text-xs text-gray-400">
              ({Math.round((threshold - 0.15) * 100)}%–{Math.round(threshold * 100)}%
              coverage)
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            These books are slightly below your threshold — great for challenging
            yourself with a few new words!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stretchBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                score={scores[book.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
