'use client';

import { useState, useEffect, useCallback } from 'react';

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
  beginner: 'bg-blue-100 text-blue-700',
  in_transition: 'bg-yellow-100 text-yellow-700',
  competent: 'bg-purple-100 text-purple-700',
  experienced: 'bg-red-100 text-red-700',
};

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'French',
  'zh-Hans': 'Chinese',
};

const SAMPLE_JSON = `{
  "books": [
    {
      "title": "The Big Cat",
      "language": "en",
      "stage": "emergent",
      "description": "A story about a big cat.",
      "genre": "fiction",
      "themes": ["animals"],
      "pages": [
        { "text": "The cat is big." },
        { "text": "The cat can run." },
        { "text": "The big cat is happy!" }
      ]
    },
    {
      "title": "Le petit chien",
      "language": "fr",
      "stage": "beginner",
      "description": "Un petit chien dans le jardin.",
      "genre": "fiction",
      "themes": ["animaux"],
      "pages": [
        { "text": "Le petit chien est dans le jardin." },
        { "text": "Il court vite!" },
        { "text": "Le chien est content." }
      ]
    }
  ]
}`;

export default function BooksPage() {
  const [allBooks, setAllBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonText(ev.target?.result as string);
      setImportError(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!jsonText.trim()) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setImportError('Invalid JSON. Please check the format and try again.');
        setImporting(false);
        return;
      }

      const res = await fetch('/api/books/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult(`Successfully imported ${data.imported} book${data.imported > 1 ? 's' : ''}!`);
        setJsonText('');
        fetchBooks();
      } else {
        const details = data.details ? '\n' + data.details.join('\n') : '';
        setImportError(`${data.error}${details}`);
      }
    } catch (err) {
      setImportError('Network error. Please try again.');
    } finally {
      setImporting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Book Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Import, browse, and manage books for your students
          </p>
        </div>
        <button
          onClick={() => { setShowImport(!showImport); setImportError(null); setImportResult(null); }}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showImport ? 'Close Import' : '+ Import Books'}
        </button>
      </div>

      {/* Import Form */}
      {showImport && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Bulk Import Books</h2>
          <p className="text-sm text-gray-500 mb-4">
            Paste JSON or upload a .json file. Each book needs a title, language, stage, and pages.
          </p>

          {/* Sample format toggle */}
          <button
            onClick={() => setShowSample(!showSample)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-3"
          >
            {showSample ? 'Hide sample format' : 'Show sample format'}
          </button>

          {showSample && (
            <div className="mb-4 relative">
              <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto max-h-80">
                {SAMPLE_JSON}
              </pre>
              <button
                onClick={() => setJsonText(SAMPLE_JSON)}
                className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
              >
                Use Sample
              </button>
            </div>
          )}

          {/* File upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload .json file
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {/* JSON textarea */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Or paste JSON
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setImportError(null); }}
              placeholder='{"books": [{"title": "...", "language": "en", "stage": "emergent", "pages": [{"text": "..."}]}]}'
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Import result / error */}
          {importResult && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
              {importResult}
            </div>
          )}
          {importError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 whitespace-pre-wrap">
              {importError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing || !jsonText.trim()}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importing...' : 'Import Books'}
            </button>
            <button
              onClick={() => { setShowImport(false); setImportError(null); setImportResult(null); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
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
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
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
                <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
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
