'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookImportWizard } from '@/components/BookImportWizard';

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
  const [allBooks, setAllBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

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

  const filteredBooks = allBooks.filter((b) => {
    if (filterLang !== 'all' && b.language !== filterLang) return false;
    if (filterStage !== 'all' && b.stage !== filterStage) return false;
    return true;
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold ">Book Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Import, browse, and manage books for your students
          </p>
        </div>
        <button
          onClick={() => setShowImport(!showImport)}
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showImport ? 'Close Import' : '+ Import Books'}
        </button>
      </div>

      {/* Import Wizard */}
      {showImport && (
        <BookImportWizard
          onClose={() => setShowImport(false)}
          onImported={fetchBooks}
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
              ? 'Import your first books using the button above.'
              : 'Try adjusting your language or stage filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/books/preview?bookId=${book.id}`}
                  className="font-semibold text-gray-900 hover:text-primary-600 truncate transition-colors"
                >
                  {book.title}
                </Link>
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
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
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
          ))}
        </div>
      )}
    </div>
  );
}
