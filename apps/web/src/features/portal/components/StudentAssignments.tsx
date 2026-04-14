'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Assignment {
  id: string;
  type: string;
  assignedTo: string;
  dueDate: string | null;
  createdAt: string;
  bookId: string | null;
  bookTitle: string | null;
  bookLanguage: string | null;
  bookStage: string | null;
  curriculumFilterEnabled: boolean;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; href: (a: Assignment) => string }> = {
  book: {
    icon: '\u{1F4D6}',
    label: 'Read',
    color: 'bg-primary-100 text-primary-700 border-primary-200',
    href: (a) => `/portal/library/read?bookId=${a.bookId}`,
  },
  'silly-sentences': {
    icon: '\u{1F9E9}',
    label: 'Silly Sentences',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    href: () => '/silly-sentences',
  },
  'battle-story': {
    icon: '\u2694\uFE0F',
    label: 'Battle Story',
    color: 'bg-red-100 text-red-700 border-red-200',
    href: () => '/battle-stories',
  },
  'ai-story': {
    icon: '\u2728',
    label: 'AI Story',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    href: () => '/stories',
  },
};

export function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch('/api/assignments');
        if (res.ok) setAssignments(await res.json());
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
        <p className="text-3xl mb-2">{'\u2705'}</p>
        <p className="text-gray-500">No assignments right now!</p>
        <p className="text-gray-400 text-xs mt-1">Your teacher will assign work soon.</p>
      </div>
    );
  }

  const formatDue = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: 'Overdue', className: 'text-red-600 font-semibold' };
    if (days === 0) return { text: 'Due today', className: 'text-orange-600 font-semibold' };
    if (days === 1) return { text: 'Due tomorrow', className: 'text-orange-500' };
    return { text: `Due in ${days} days`, className: 'text-gray-500' };
  };

  return (
    <div className="space-y-3">
      {assignments.map((a) => {
        const config = TYPE_CONFIG[a.type] || TYPE_CONFIG.book;
        const due = formatDue(a.dueDate);

        return (
          <Link
            key={a.id}
            href={config.href(a)}
            className={`flex items-center gap-4 p-4 bg-white rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all ${config.color}`}
          >
            <span className="text-2xl">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {a.bookTitle || config.label}
                </span>
                {a.curriculumFilterEnabled && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                    Curriculum
                  </span>
                )}
              </div>
              {due && (
                <p className={`text-xs mt-0.5 ${due.className}`}>{due.text}</p>
              )}
            </div>
            <span className="text-gray-400 text-sm">{'\u2192'}</span>
          </Link>
        );
      })}
    </div>
  );
}
