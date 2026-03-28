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

export default function WordListsPage() {
  const [lists, setLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);

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
        <h1 className="text-2xl font-bold text-gray-900">Word Lists</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{list.name}</h3>
                <p className="text-sm text-gray-500">
                  {list.language === 'en' ? 'English' : list.language === 'fr' ? 'French' : 'Chinese'} &middot;{' '}
                  {list.words.length} words &middot;{' '}
                  {new Date(list.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {list.words.length} words
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
