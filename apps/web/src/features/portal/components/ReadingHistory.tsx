'use client';

import { useState, useEffect } from 'react';

interface ReadingSession {
  id: string;
  bookId: string;
  mode: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  pagesRead: number | null;
  bookTitle?: string;
}

export function ReadingHistory() {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/reading-sessions');
        if (res.ok) setSessions(await res.json());
      } catch (err) {
        console.error('Failed to fetch reading history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
        <p className="text-3xl mb-2">{'\u{1F4DA}'}</p>
        <p className="text-gray-500">No reading sessions yet.</p>
        <p className="text-gray-400 text-xs mt-1">Start reading to build your history!</p>
      </div>
    );
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const MODE_ICONS: Record<string, string> = {
    listen: '\u{1F50A}',
    read: '\u{1F440}',
    record: '\u{1F3A4}',
    'co-read': '\u{1F91D}',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-2.5 px-4 font-medium text-gray-500">Book</th>
            <th className="text-left py-2.5 px-4 font-medium text-gray-500">Mode</th>
            <th className="text-left py-2.5 px-4 font-medium text-gray-500">Pages</th>
            <th className="text-left py-2.5 px-4 font-medium text-gray-500">Duration</th>
            <th className="text-left py-2.5 px-4 font-medium text-gray-500">Date</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2.5 px-4 font-medium text-gray-900">
                {s.bookTitle || 'Unknown Book'}
              </td>
              <td className="py-2.5 px-4 text-gray-600">
                {MODE_ICONS[s.mode] || ''} {s.mode}
              </td>
              <td className="py-2.5 px-4 text-gray-600">{s.pagesRead ?? '--'}</td>
              <td className="py-2.5 px-4 text-gray-600">{formatDuration(s.durationSeconds)}</td>
              <td className="py-2.5 px-4 text-gray-400">{formatDate(s.startedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
