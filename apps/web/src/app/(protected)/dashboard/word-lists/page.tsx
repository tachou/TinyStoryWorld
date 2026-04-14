'use client';

import { useState, useEffect, useCallback } from 'react';

interface WordEntry {
  word: string;
  pos?: string;
  phonetic?: string;
}

interface WordList {
  id: string;
  name: string;
  language: string;
  words: WordEntry[];
  createdAt: string;
}

const POS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  noun: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'N' },
  verb: { bg: 'bg-green-100', text: 'text-green-700', label: 'V' },
  adjective: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'ADJ' },
  adverb: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'ADV' },
  phrase: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'PHR' },
  conjunction: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'CON' },
  particle: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'PRT' },
};

const INITIAL_WORD_LIMIT = 30;

function WordPill({ entry }: { entry: WordEntry }) {
  const pos = POS_COLORS[entry.pos || ''] || POS_COLORS.phrase;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white text-sm">
      <span className="font-medium text-gray-800">{entry.word}</span>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pos.bg} ${pos.text}`}>
        {pos.label}
      </span>
      {entry.phonetic && (
        <span className="text-[10px] text-gray-400 italic">{entry.phonetic}</span>
      )}
    </span>
  );
}

function PosStats({ words }: { words: WordEntry[] }) {
  const counts: Record<string, number> = {};
  words.forEach((w) => {
    const p = w.pos || 'other';
    counts[p] = (counts[p] || 0) + 1;
  });

  const order = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'conjunction', 'particle'];
  const entries = order
    .filter((p) => counts[p])
    .map((p) => ({ pos: p, count: counts[p] }));
  // Add any remaining POS types not in the order list
  Object.keys(counts)
    .filter((p) => !order.includes(p))
    .forEach((p) => entries.push({ pos: p, count: counts[p] }));

  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
      {entries.map(({ pos, count }) => {
        const style = POS_COLORS[pos];
        return (
          <span key={pos} className="flex items-center gap-1">
            {style && <span className={`w-2 h-2 rounded-full ${style.bg}`} />}
            {count} {pos}{count !== 1 ? 's' : ''}
          </span>
        );
      })}
    </div>
  );
}

export default function WordListsPage() {
  const [lists, setLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllWords, setShowAllWords] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/word-lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (err) {
      console.error('Failed to fetch word lists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleUpload = async () => {
    if (!name.trim() || !csvText.trim()) return;

    setUploading(true);
    try {
      // Parse CSV: word,pos,phonetic (pos and phonetic optional)
      const words: WordEntry[] = csvText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))
        .map((line) => {
          const parts = line.split(',').map((p) => p.trim());
          return {
            word: parts[0],
            pos: parts[1] || undefined,
            phonetic: parts[2] || undefined,
          };
        });

      const res = await fetch('/api/word-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, language, words }),
      });

      if (res.ok) {
        setShowUpload(false);
        setName('');
        setCsvText('');
        fetchLists();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold ">Word Lists</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          + New Word List
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Create Word List</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Week 5 Vocabulary"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="zh-Hans">Chinese (Simplified)</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Words (CSV: word, pos, phonetic)
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`# One word per line: word,pos,phonetic\ncat,noun\nruns,verb\nbig,adjective\nquickly,adverb`}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !name.trim() || !csvText.trim()}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Creating...' : 'Create List'}
            </button>
            <button
              onClick={() => setShowUpload(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Word lists */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : lists.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">No word lists yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Create one to customize Silly Sentences vocabulary for your students.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => {
            const isExpanded = expandedId === list.id;
            const wordsToShow = isExpanded
              ? showAllWords
                ? list.words
                : list.words.slice(0, INITIAL_WORD_LIMIT)
              : [];
            const hasMore = list.words.length > INITIAL_WORD_LIMIT;

            return (
              <div
                key={list.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${
                  isExpanded ? 'border-primary-300 shadow-md' : 'border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Header — always visible, clickable */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : list.id);
                    setShowAllWords(false);
                  }}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{list.name}</h3>
                    <p className="text-sm text-gray-500">
                      {list.language === 'en' ? 'English' : list.language === 'fr' ? 'French' : 'Chinese'} &middot;{' '}
                      {list.words.length} words &middot;{' '}
                      {new Date(list.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {list.words.length} words
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {/* Word pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {wordsToShow.map((entry, idx) => (
                        <WordPill key={idx} entry={entry} />
                      ))}
                    </div>

                    {/* Show all toggle */}
                    {hasMore && !showAllWords && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllWords(true);
                        }}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Show all ({list.words.length})
                      </button>
                    )}
                    {hasMore && showAllWords && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllWords(false);
                        }}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Show fewer
                      </button>
                    )}

                    {/* POS stats + delete */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <PosStats words={list.words} />
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Delete "${list.name}"? This cannot be undone.`)) return;
                          try {
                            const res = await fetch(`/api/word-lists/${list.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setExpandedId(null);
                              fetchLists();
                            }
                          } catch (err) {
                            console.error('Failed to delete:', err);
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete List
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
