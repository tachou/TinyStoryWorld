'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────

interface PageInput {
  text: string;
  translationEn?: string;
}

interface BookInput {
  title: string;
  language: string;
  stage: string;
  description?: string;
  genre?: string;
  themes?: string[];
  pages: PageInput[];
}

interface WordList {
  id: string;
  name: string;
  language: string;
  words: { word: string }[];
}

interface ImportedBook {
  id: string;
  title: string;
}

type Step = 1 | 2 | 3 | 4;

interface Props {
  onClose: () => void;
  onImported: () => void;
}

// ─── Sample JSON ────────────────────────────────────────────────────────

const SAMPLE_JSON = `{
  "books": [
    {
      "title": "Le petit chien",
      "language": "fr",
      "stage": "beginner",
      "description": "Un petit chien dans le jardin.",
      "genre": "fiction",
      "pages": [
        { "text": "Le petit chien est dans le jardin.", "translationEn": "The little dog is in the garden." },
        { "text": "Il court vite!" },
        { "text": "Le chien est content.", "translationEn": "The dog is happy." }
      ]
    }
  ]
}`;

// ─── Helpers ────────────────────────────────────────────────────────────

const STEP_LABELS = ['JSON Input', 'Page Images', 'Curriculum', 'Review & Import'];

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '...' : s;
}

// ─── Component ──────────────────────────────────────────────────────────

export function BookImportWizard({ onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1: JSON
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedBooks, setParsedBooks] = useState<BookInput[]>([]);
  const [showSample, setShowSample] = useState(false);

  // Step 2: Images (bookIndex -> pageIndex -> File)
  const [pageImages, setPageImages] = useState<Map<string, File>>(new Map());

  // Step 3: Curriculum
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [selectedWordlistId, setSelectedWordlistId] = useState<string>('');
  const [wlLoading, setWlLoading] = useState(false);

  // Step 4: Import progress
  const [importPhase, setImportPhase] = useState<string>('');
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);
  const [importSummary, setImportSummary] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // ─── Step 1: Parse JSON ─────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonText(ev.target?.result as string);
      setParseError(null);
    };
    reader.readAsText(file);
  };

  const handleParseAndNext = () => {
    setParseError(null);
    try {
      const parsed = JSON.parse(jsonText);
      const books: BookInput[] = parsed.books;
      if (!Array.isArray(books) || books.length === 0) {
        setParseError('"books" must be a non-empty array');
        return;
      }
      if (books.length > 50) {
        setParseError('Maximum 50 books per import');
        return;
      }
      // Basic validation
      const errors: string[] = [];
      books.forEach((b, i) => {
        if (!b.title?.trim()) errors.push(`Book #${i + 1}: title required`);
        if (!['en', 'fr', 'zh-Hans'].includes(b.language)) errors.push(`Book #${i + 1}: invalid language`);
        if (!b.pages?.length) errors.push(`Book #${i + 1}: pages required`);
        b.pages?.forEach((p, pi) => {
          if (!p.text?.trim()) errors.push(`Book #${i + 1}, Page ${pi + 1}: text required`);
        });
      });
      if (errors.length > 0) {
        setParseError(errors.join('\n'));
        return;
      }
      setParsedBooks(books);
      setStep(2);
    } catch {
      setParseError('Invalid JSON. Please check the format.');
    }
  };

  // ─── Step 2: Image helpers ──────────────────────────────────────────

  const imageKey = (bookIdx: number, pageIdx: number) => `${bookIdx}-${pageIdx}`;

  const handleImageSelect = (bookIdx: number, pageIdx: number, file: File | null) => {
    setPageImages((prev) => {
      const next = new Map(prev);
      const key = imageKey(bookIdx, pageIdx);
      if (file) {
        next.set(key, file);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  // ─── Step 3: Fetch word lists ───────────────────────────────────────

  useEffect(() => {
    if (step === 3 && wordLists.length === 0) {
      setWlLoading(true);
      fetch('/api/word-lists')
        .then((r) => r.json())
        .then((data) => setWordLists(data))
        .catch(() => {})
        .finally(() => setWlLoading(false));
    }
  }, [step, wordLists.length]);

  // Filter word lists to match book languages
  const bookLanguages = new Set(parsedBooks.map((b) => b.language));
  const filteredWordLists = wordLists.filter((wl) => bookLanguages.has(wl.language));

  // ─── Step 4: Import ─────────────────────────────────────────────────

  const runImport = async () => {
    setIsImporting(true);
    setImportError(null);
    setImportDone(false);
    const summary: string[] = [];

    try {
      // Phase A: Bulk import books
      setImportPhase('Importing books...');
      setImportProgress(0);
      setImportTotal(4);

      const res = await fetch('/api/books/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: parsedBooks }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data.details ? '\n' + data.details.join('\n') : '';
        throw new Error(`Import failed: ${data.error}${details}`);
      }
      const importedBooks: ImportedBook[] = data.books;
      summary.push(`Imported ${importedBooks.length} book${importedBooks.length > 1 ? 's' : ''}`);
      setImportProgress(1);

      // Phase B: Translate missing pages
      setImportPhase('Translating pages...');
      let totalTranslated = 0;
      const nonEnBooks = importedBooks.filter((_, i) => parsedBooks[i].language !== 'en');
      // Only translate books where some pages lack translationEn
      const booksNeedingTranslation = nonEnBooks.filter((_, i) => {
        const origIdx = importedBooks.indexOf(nonEnBooks[i]);
        return parsedBooks[origIdx]?.pages.some((p) => !p.translationEn);
      });

      for (const book of booksNeedingTranslation) {
        try {
          const tRes = await fetch('/api/books/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId: book.id }),
          });
          const tData = await tRes.json();
          totalTranslated += tData.translated || 0;
          if (tData.reason === 'no_api_key') {
            summary.push('Translation skipped (no API key configured)');
            break;
          }
        } catch {
          // Non-fatal
        }
      }
      if (totalTranslated > 0) {
        summary.push(`Translated ${totalTranslated} page${totalTranslated > 1 ? 's' : ''}`);
      }
      setImportProgress(2);

      // Phase C: Upload images
      setImportPhase('Uploading images...');
      let imagesUploaded = 0;
      const imageEntries = Array.from(pageImages.entries());

      // Upload in batches of 3
      for (let i = 0; i < imageEntries.length; i += 3) {
        const batch = imageEntries.slice(i, i + 3);
        await Promise.all(
          batch.map(async ([key, file]) => {
            const [bookIdx, pageIdx] = key.split('-').map(Number);
            const bookId = importedBooks[bookIdx]?.id;
            if (!bookId) return;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('bookId', bookId);
            formData.append('pageNumber', String(pageIdx + 1));

            try {
              const uRes = await fetch('/api/books/upload-image', {
                method: 'POST',
                body: formData,
              });
              if (uRes.ok) imagesUploaded++;
            } catch {
              // Non-fatal
            }
          })
        );
      }
      if (imagesUploaded > 0) {
        summary.push(`Uploaded ${imagesUploaded} image${imagesUploaded > 1 ? 's' : ''}`);
      }
      setImportProgress(3);

      // Phase D: Compute curriculum scores
      if (selectedWordlistId) {
        setImportPhase('Computing curriculum scores...');
        try {
          await fetch('/api/books/curriculum-scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wordlistId: selectedWordlistId }),
          });
          const wl = wordLists.find((w) => w.id === selectedWordlistId);
          summary.push(`Scored against "${wl?.name || 'word list'}"`);
        } catch {
          // Non-fatal
        }
      }
      setImportProgress(4);

      setImportPhase('');
      setImportSummary(summary);
      setImportDone(true);
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Computed stats ─────────────────────────────────────────────────

  const totalPages = parsedBooks.reduce((sum, b) => sum + b.pages.length, 0);
  const totalImages = pageImages.size;
  const pagesWithTranslation = parsedBooks.reduce(
    (sum, b) => sum + b.pages.filter((p) => p.translationEn).length,
    0
  );
  const nonEnPages = parsedBooks
    .filter((b) => b.language !== 'en')
    .reduce((sum, b) => sum + b.pages.length, 0);
  const pagesNeedingTranslation = nonEnPages - pagesWithTranslation;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1
                  ? 'bg-green-500 text-white'
                  : step === i + 1
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > i + 1 ? '\u2713' : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-primary-700' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && <div className="w-6 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* ─── Step 1: JSON Input ──────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Import Books (JSON)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Paste JSON or upload a .json file. Each page can optionally include <code className="bg-gray-100 px-1 rounded">translationEn</code>.
          </p>

          <button
            onClick={() => setShowSample(!showSample)}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium mb-3"
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload .json file</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Or paste JSON</label>
            <textarea
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setParseError(null); }}
              placeholder='{"books": [{"title": "...", "language": "fr", "stage": "beginner", "pages": [{"text": "...", "translationEn": "..."}]}]}'
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {parseError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 whitespace-pre-wrap">
              {parseError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleParseAndNext}
              disabled={!jsonText.trim()}
              className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Per-Page Images ─────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Page Images (Optional)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Attach an illustration for each page. Max 5MB per image. You can skip this step.
          </p>

          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {parsedBooks.map((book, bi) => (
              <div key={bi} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-gray-800 mb-2">
                  {book.title} <span className="text-gray-400 font-normal">({book.pages.length} pages)</span>
                </h3>
                <div className="space-y-2">
                  {book.pages.map((page, pi) => {
                    const key = imageKey(bi, pi);
                    const file = pageImages.get(key);
                    return (
                      <div key={pi} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400 w-8 shrink-0">P{pi + 1}</span>
                        <span className="text-gray-600 flex-1 truncate">{truncate(page.text, 50)}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(bi, pi, e.target.files?.[0] || null)}
                          className="text-xs w-48 shrink-0"
                        />
                        {file && (
                          <span className="text-green-600 text-xs shrink-0">{truncate(file.name, 15)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              {totalImages > 0 ? `Next (${totalImages} image${totalImages > 1 ? 's' : ''})` : 'Skip'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Curriculum ──────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Curriculum Word List (Optional)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Associate these books with a word list to auto-compute curriculum coverage scores.
          </p>

          {wlLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full" />
              Loading word lists...
            </div>
          ) : filteredWordLists.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">
              No word lists found for {Array.from(bookLanguages).join(', ')}. You can create one in the Word Lists section.
            </p>
          ) : (
            <div className="mb-4">
              <select
                value={selectedWordlistId}
                onChange={(e) => setSelectedWordlistId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-md"
              >
                <option value="">None (skip)</option>
                {filteredWordLists.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name} ({wl.words.length} words, {wl.language})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              {selectedWordlistId ? 'Next' : 'Skip'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Review & Import ─────────────────────────────────── */}
      {step === 4 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Review & Import</h2>

          {!importDone && !isImporting && (
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-40">Books:</span>
                <span className="font-medium">{parsedBooks.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-40">Total pages:</span>
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-40">Images attached:</span>
                <span className="font-medium">{totalImages}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-40">Translations provided:</span>
                <span className="font-medium">{pagesWithTranslation} of {nonEnPages} non-English pages</span>
              </div>
              {pagesNeedingTranslation > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-40">Will auto-translate:</span>
                  <span className="font-medium text-amber-600">{pagesNeedingTranslation} page{pagesNeedingTranslation > 1 ? 's' : ''} (via Claude)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-40">Curriculum:</span>
                <span className="font-medium">
                  {selectedWordlistId
                    ? wordLists.find((w) => w.id === selectedWordlistId)?.name || 'Selected'
                    : 'None'}
                </span>
              </div>
            </div>
          )}

          {/* Progress */}
          {isImporting && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full" />
                <span className="text-sm text-gray-600">{importPhase}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {importError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 whitespace-pre-wrap">
              {importError}
            </div>
          )}

          {/* Success */}
          {importDone && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold mb-1">Import complete!</p>
              {importSummary.map((line, i) => (
                <p key={i} className="text-sm text-green-600">{line}</p>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            {!importDone && (
              <button
                onClick={() => setStep(3)}
                disabled={isImporting}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Back
              </button>
            )}
            {!importDone ? (
              <button
                onClick={runImport}
                disabled={isImporting}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            ) : (
              <button
                onClick={() => { onImported(); onClose(); }}
                className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Done
              </button>
            )}
            {!importDone && (
              <button onClick={onClose} disabled={isImporting} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
