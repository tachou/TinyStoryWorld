'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BookImportWizard } from '@/components/BookImportWizard';
import { BookGenerateWizard } from '@/components/BookGenerateWizard';

interface BookData {
  id: string;
  title: string;
  language: string;
  stage: string;
  pageCount: number;
  uniqueWordCount: number;
  genre: string;
  themes: string[];
  createdAt: string;
  isDraft?: boolean;
  creatorId?: string | null;
  sourceWordlistId?: string | null;
}

interface CoverageEntry {
  coveragePct: number;
  matchedCount: number;
  totalCount: number;
  unmatchedWords: string[];
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
  beginner: 'bg-primary-100 text-primary-700',
  in_transition: 'bg-yellow-100 text-yellow-700',
  competent: 'bg-purple-100 text-purple-700',
  experienced: 'bg-red-100 text-red-700',
};

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'French',
  'zh-Hans': 'Chinese',
};

export default function BooksPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;

  const [allBooks, setAllBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  // Row-level action state
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());
  const [confirmRegen, setConfirmRegen] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  // Coverage scores keyed by bookId
  const [coverage, setCoverage] = useState<Record<string, CoverageEntry>>({});

  // Word list names keyed by wordlistId — used to label coverage badges
  const [wordlistNames, setWordlistNames] = useState<Record<string, string>>({});

  // Filters
  const [filterLang, setFilterLang] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setAllBooks(data);
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch coverage for every unique sourceWordlistId that shows up on drafts
  useEffect(() => {
    const wordlistIds = [
      ...new Set(
        allBooks
          .filter((b) => b.sourceWordlistId)
          .map((b) => b.sourceWordlistId as string)
      ),
    ];
    if (wordlistIds.length === 0) return;

    let canceled = false;
    (async () => {
      const merged: Record<string, CoverageEntry> = {};
      await Promise.all(
        wordlistIds.map(async (wlId) => {
          try {
            const res = await fetch(`/api/books/curriculum-scores?wordlistId=${wlId}`);
            if (!res.ok) return;
            const map = (await res.json()) as Record<string, CoverageEntry>;
            for (const [bookId, entry] of Object.entries(map)) {
              merged[bookId] = entry;
            }
          } catch {
            // skip
          }
        })
      );
      if (!canceled) setCoverage((prev) => ({ ...prev, ...merged }));
    })();
    return () => {
      canceled = true;
    };
  }, [allBooks]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Fetch word list names once so we can label coverage badges
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch('/api/word-lists');
        if (!res.ok) return;
        const lists = (await res.json()) as Array<{ id: string; name: string }>;
        if (canceled) return;
        const map: Record<string, string> = {};
        for (const l of lists) map[l.id] = l.name;
        setWordlistNames(map);
      } catch {
        // skip — coverage badge will fall back to just "%"
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  const handleDelete = async (bookId: string) => {
    if (confirmDelete !== bookId) {
      setConfirmDelete(bookId);
      return;
    }

    setDeleting((prev) => new Set(prev).add(bookId));
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
      if (res.ok) {
        setAllBooks((prev) => prev.filter((b) => b.id !== bookId));
      }
    } catch (err) {
      console.error('Failed to delete book:', err);
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
    }
  };

  const handlePublishToggle = async (bookId: string, nextDraft: boolean) => {
    setPublishing((prev) => new Set(prev).add(bookId));
    setRowError((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDraft: nextDraft }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setRowError((prev) => ({ ...prev, [bookId]: body.error || 'Publish failed' }));
        return;
      }
      setAllBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, isDraft: nextDraft } : b))
      );
    } catch (err) {
      setRowError((prev) => ({ ...prev, [bookId]: (err as Error).message }));
    } finally {
      setPublishing((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
    }
  };

  const handleRegenerate = async (bookId: string) => {
    if (confirmRegen !== bookId) {
      setConfirmRegen(bookId);
      return;
    }
    setConfirmRegen(null);
    setRegenerating((prev) => new Set(prev).add(bookId));
    setRowError((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
    try {
      const res = await fetch(`/api/books/${bookId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setRowError((prev) => ({
          ...prev,
          [bookId]: body.error || 'Regenerate failed',
        }));
        return;
      }
      const { book: updated } = await res.json();
      if (updated) {
        setAllBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, ...updated } : b)));
      } else {
        fetchBooks();
      }
    } catch (err) {
      setRowError((prev) => ({ ...prev, [bookId]: (err as Error).message }));
    } finally {
      setRegenerating((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
    }
  };

  const filteredBooks = useMemo(
    () =>
      allBooks.filter((b) => {
        if (filterLang !== 'all' && b.language !== filterLang) return false;
        if (filterStage !== 'all' && b.stage !== filterStage) return false;
        return true;
      }),
    [allBooks, filterLang, filterStage]
  );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold ">Book Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Import, generate, browse, and manage books for your students
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowGenerate(true);
              setShowImport(false);
            }}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {'\u2728'} Generate Books
          </button>
          <button
            onClick={() => {
              setShowImport(!showImport);
              setShowGenerate(false);
            }}
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            {showImport ? 'Close Import' : '+ Import Books'}
          </button>
        </div>
      </div>

      {/* Import Wizard */}
      {showImport && (
        <BookImportWizard
          onClose={() => setShowImport(false)}
          onImported={fetchBooks}
        />
      )}

      {/* Generate Wizard */}
      {showGenerate && userId && (
        <BookGenerateWizard
          onClose={() => setShowGenerate(false)}
          onGenerated={fetchBooks}
          currentUserId={userId}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-500">Language:</label>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
          >
            <option value="all">All</option>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="zh-Hans">Chinese</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-500">Stage:</label>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
          >
            <option value="all">All</option>
            {Object.entries(STAGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-400 ml-auto">
          {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Book list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">{'\u{1F4DA}'}</p>
          <p className="text-gray-500 text-lg">
            {allBooks.length === 0 ? 'No books yet.' : 'No books match your filters.'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {allBooks.length === 0
              ? 'Import or generate your first books using the buttons above.'
              : 'Try adjusting your language or stage filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => {
            const isDraft = !!book.isDraft;
            const cov = coverage[book.id];
            const coveragePctInt = cov ? Math.round(cov.coveragePct * 100) : null;
            const isOwner = book.creatorId && userId && book.creatorId === userId;
            const canRegenerate = isDraft && isOwner && !!book.sourceWordlistId;
            const isRegen = regenerating.has(book.id);
            const isPublishing = publishing.has(book.id);
            return (
              <div
                key={book.id}
                className={`flex items-center justify-between p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
                  isDraft ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/dashboard/books/preview?bookId=${book.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600 truncate transition-colors"
                    >
                      {book.title}
                    </Link>
                    {isDraft && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-900"
                        title="Only visible to you until published"
                      >
                        Draft — visible only to you
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {LANG_LABELS[book.language] || book.language}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_COLORS[book.stage] || 'bg-gray-100 text-gray-600'}`}>
                      {STAGE_LABELS[book.stage] || book.stage}
                    </span>
                    <span className="text-xs text-gray-400">
                      {book.pageCount} page{book.pageCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-400">
                      {book.uniqueWordCount || '?'} unique words
                    </span>
                    {book.genre && (
                      <span className="text-xs text-gray-400 capitalize">{book.genre}</span>
                    )}
                    {coveragePctInt !== null && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full max-w-xs truncate ${
                          coveragePctInt >= 70
                            ? 'bg-green-100 text-green-700'
                            : coveragePctInt >= 40
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                        title={
                          book.sourceWordlistId && wordlistNames[book.sourceWordlistId]
                            ? `${cov!.matchedCount} of ${cov!.totalCount} words from "${wordlistNames[book.sourceWordlistId]}"`
                            : `${cov!.matchedCount} of ${cov!.totalCount} curriculum words`
                        }
                      >
                        {coveragePctInt}%
                        {book.sourceWordlistId && wordlistNames[book.sourceWordlistId]
                          ? ` of ${wordlistNames[book.sourceWordlistId]}`
                          : ' coverage'}
                      </span>
                    )}
                  </div>
                  {rowError[book.id] && (
                    <p className="text-xs text-red-600 mt-1">{rowError[book.id]}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {isDraft && isOwner && (
                    <button
                      onClick={() => handlePublishToggle(book.id, false)}
                      disabled={isPublishing || isRegen}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isPublishing ? 'Publishing…' : 'Publish'}
                    </button>
                  )}
                  {!isDraft && isOwner && (
                    <button
                      onClick={() => handlePublishToggle(book.id, true)}
                      disabled={isPublishing}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg text-gray-600 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                      title="Unpublish — hide from students"
                    >
                      {isPublishing ? 'Working…' : 'Unpublish'}
                    </button>
                  )}
                  {canRegenerate && (
                    <button
                      onClick={() => handleRegenerate(book.id)}
                      disabled={isRegen || isPublishing}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        confirmRegen === book.id
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'text-amber-700 border border-amber-300 hover:bg-amber-50'
                      } disabled:opacity-50`}
                      title="Re-run Claude with the same parameters, replacing this draft's pages"
                    >
                      {isRegen
                        ? 'Regenerating…'
                        : confirmRegen === book.id
                        ? 'Confirm?'
                        : 'Regenerate'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(book.id)}
                    disabled={deleting.has(book.id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      confirmDelete === book.id
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'text-red-500 border border-red-200 hover:bg-red-50'
                    } disabled:opacity-50`}
                  >
                    {deleting.has(book.id)
                      ? 'Deleting...'
                      : confirmDelete === book.id
                      ? 'Confirm?'
                      : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
