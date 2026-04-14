'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FeedStory {
  id: string;
  title: string;
  matchup: {
    fighterA: string;
    numberA: number;
    fighterB: string;
    numberB: number;
    setting: string;
    twist: string;
  };
  language: string;
  voteCounts: {
    funniest: number;
    smartest: number;
    surprising: number;
    best_plan: number;
  };
  remixCount: number;
  parentStoryId: string | null;
  createdAt: string;
  studentId: string;
  authorName: string | null;
}

const TABS = [
  { key: 'recent', label: 'Recent', icon: '\u{1F195}' },
  { key: 'trending', label: 'Trending', icon: '\u{1F525}' },
  { key: 'funniest', label: 'Funny', icon: '\u{1F923}' },
  { key: 'smartest', label: 'Smart', icon: '\u{1F9E0}' },
  { key: 'surprising', label: 'Surprising', icon: '\u{1F92F}' },
];

export function ClassroomFeed() {
  const [stories, setStories] = useState<FeedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('recent');

  useEffect(() => {
    async function fetchFeed() {
      setLoading(true);
      try {
        const res = await fetch(`/api/battle-stories/feed?tab=${tab}`);
        if (res.ok) setStories(await res.json());
      } catch (err) {
        console.error('Failed to fetch feed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, [tab]);

  const totalVotes = (vc: FeedStory['voteCounts']) =>
    (vc.funniest || 0) + (vc.smartest || 0) + (vc.surprising || 0) + (vc.best_plan || 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {'\u{1F3DF}\uFE0F'} Classroom Feed
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-6 h-6 border-3 border-red-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!loading && stories.length === 0 && (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
          <p className="text-3xl mb-2">{'\u2694\uFE0F'}</p>
          <p className="text-gray-500">No stories in your classroom yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Be the first to create a battle story!
          </p>
        </div>
      )}

      {/* Story cards */}
      {!loading && stories.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {stories.map((story) => {
            const votes = totalVotes(story.voteCounts);

            return (
              <Link
                key={story.id}
                href={`/battle-stories/${story.id}`}
                className="block p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Header */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl">{'\u2694\uFE0F'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">
                      {story.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      by {story.authorName || 'Anonymous'}
                    </p>
                  </div>
                  {story.parentStoryId && (
                    <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-600">
                      {'\u{1F504}'} Remix
                    </span>
                  )}
                </div>

                {/* Matchup */}
                <p className="text-xs text-gray-500 mb-3">
                  {story.matchup.numberA} {story.matchup.fighterA} vs{' '}
                  {story.matchup.numberB} {story.matchup.fighterB} in{' '}
                  {story.matchup.setting}
                </p>

                {/* Vote badges + remix count */}
                <div className="flex items-center gap-2 flex-wrap">
                  {story.voteCounts.funniest > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      {'\u{1F923}'} {story.voteCounts.funniest}
                    </span>
                  )}
                  {story.voteCounts.smartest > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700">
                      {'\u{1F9E0}'} {story.voteCounts.smartest}
                    </span>
                  )}
                  {story.voteCounts.surprising > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {'\u{1F92F}'} {story.voteCounts.surprising}
                    </span>
                  )}
                  {story.voteCounts.best_plan > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                      {'\u{1F3AF}'} {story.voteCounts.best_plan}
                    </span>
                  )}
                  {story.remixCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      {'\u{1F504}'} {story.remixCount} remix{story.remixCount !== 1 ? 'es' : ''}
                    </span>
                  )}
                  {votes === 0 && story.remixCount === 0 && (
                    <span className="text-[10px] text-gray-400 italic">No votes yet</span>
                  )}

                  <span className="ml-auto text-[10px] text-gray-400">
                    {new Date(story.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
