'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ChildData {
  id: string;
  name: string;
  email: string;
  className: string | null;
  readingStage: string;
  currentLevel: number;
  totalBooksRead: number;
  totalStars: number;
  staminaBand: string;
  readingStreak: number;
  reading: {
    totalSessions: number;
    totalMinutes: number;
    totalPages: number;
    uniqueBooks: number;
    lastSessionAt: string | null;
  };
  storiesCreated: number;
  recentBooks: { title: string | null; stage: string | null; completedAt: string | null }[];
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

function ChildCard({ child }: { child: ChildData }) {
  const lastActive = child.reading.lastSessionAt
    ? (() => {
        const d = new Date(child.reading.lastSessionAt);
        const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      })()
    : 'No activity yet';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
            {child.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold">{child.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {child.className && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {child.className}
                </span>
              )}
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                Level {child.currentLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-black text-primary-600">{child.reading.totalPages}</p>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Pages Read</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-green-600">{child.reading.totalMinutes}m</p>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Reading Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-500">{child.totalStars}</p>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Stars</p>
          </div>
        </div>

        {/* Reading stage & streak */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              STAGE_COLORS[child.readingStage] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {STAGE_LABELS[child.readingStage] || child.readingStage}
          </span>
          {child.readingStreak > 0 && (
            <span className="text-xs font-bold text-orange-500">
              {'\u{1F525}'} {child.readingStreak} day streak
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">Last active: {lastActive}</span>
        </div>

        {/* Activity summary */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-xs text-primary-600 font-medium">{'\u{1F4D6}'} Books Read</p>
            <p className="text-lg font-bold text-primary-800">{child.reading.uniqueBooks}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium">{'\u270D\uFE0F'} Stories Created</p>
            <p className="text-lg font-bold text-purple-800">{child.storiesCreated}</p>
          </div>
        </div>

        {/* Recent books */}
        {child.recentBooks.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Recent Books
            </h3>
            <div className="space-y-1.5">
              {child.recentBooks.map((book, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span>{'\u{1F4D6}'}</span>
                  <span className="text-gray-700 font-medium truncate flex-1">
                    {book.title || 'Untitled'}
                  </span>
                  {book.stage && (
                    <span className="text-[10px] text-gray-400 capitalize">
                      {book.stage.replace('_', ' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {child.recentBooks.length === 0 && child.reading.totalSessions === 0 && (
          <div className="text-center py-4 bg-gray-50 rounded-xl">
            <p className="text-2xl mb-1">{'\u{1F4DA}'}</p>
            <p className="text-sm text-gray-500">No reading activity yet</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Encourage your child to start a book today!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FamilyPage() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);

  const name = session?.user?.name ?? 'Parent';

  useEffect(() => {
    async function fetchChildren() {
      try {
        const res = await fetch('/api/family/children');
        if (res.ok) setChildren(await res.json());
      } catch (err) {
        console.error('Failed to fetch children:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChildren();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold ">
        {'\u{1F468}\u200D\u{1F469}\u200D\u{1F467}'} Family Dashboard
      </h1>
      <p className="mt-1 text-gray-600">Welcome, {name}!</p>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && children.length === 0 && (
        <div className="mt-8 text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-4xl mb-3">{'\u{1F46A}'}</p>
          <h2 className="text-lg font-bold text-gray-900">No linked children yet</h2>
          <p className="text-gray-500 mt-1 max-w-md mx-auto">
            Ask your child's teacher to link your account. Once linked, you'll see
            their reading progress and achievements here.
          </p>
        </div>
      )}

      {!loading && children.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}
