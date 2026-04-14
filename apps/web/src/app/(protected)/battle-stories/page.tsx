'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BattleBuilder } from '@/features/battle/components/BattleBuilder';
import { ClassroomFeed } from '@/features/battle/components/ClassroomFeed';
import { CurriculumBadge } from '@/components/CurriculumBadge';

interface BattleStoryPreview {
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
  createdAt: string;
}

function BattleStoriesContent() {
  const searchParams = useSearchParams();
  const [stories, setStories] = useState<BattleStoryPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'build' | 'feed'>('build');

  // Check if arriving from a remix link
  const remixId = searchParams.get('remix');
  const prefill = remixId
    ? {
        parentStoryId: remixId,
        fighterA: searchParams.get('fighterA') || '',
        numberA: Number(searchParams.get('numberA') || '3'),
        fighterB: searchParams.get('fighterB') || '',
        numberB: Number(searchParams.get('numberB') || '1'),
        setting: searchParams.get('setting') || '',
        twist: searchParams.get('twist') || '',
      }
    : undefined;

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await fetch('/api/battle-stories');
        if (res.ok) setStories(await res.json());
      } catch (err) {
        console.error('Failed to fetch battle stories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold ">
          {'\u2694\uFE0F'} Battle Story Builder
        </h1>
        <p className="text-gray-500 mt-1">
          Pick your fighters, choose a setting, and generate an epic story!
        </p>
        <div className="mt-2">
          <CurriculumBadge />
        </div>
      </div>

      {/* Tabs: Build / Classroom Feed */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-md mx-auto">
        <button
          onClick={() => setTab('build')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'build'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {'\u{1F528}'} Build
        </button>
        <button
          onClick={() => setTab('feed')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'feed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {'\u{1F3DF}\uFE0F'} Classroom Feed
        </button>
      </div>

      {/* Build Tab */}
      {tab === 'build' && (
        <>
          {/* Remix banner */}
          {prefill && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
              <p className="text-sm text-orange-700 font-medium">
                {'\u{1F504}'} Show Your Version! Remix this battle with your own twist.
              </p>
            </div>
          )}

          <BattleBuilder prefill={prefill} />

          {/* Previous Stories */}
          {!loading && stories.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {'\u{1F4DA}'} Your Battle Stories
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    href={`/battle-stories/${story.id}`}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <span className="text-2xl">{'\u2694\uFE0F'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {story.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {story.matchup.numberA} {story.matchup.fighterA} vs{' '}
                        {story.matchup.numberB} {story.matchup.fighterB}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(story.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="text-gray-400">{'\u2192'}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Feed Tab */}
      {tab === 'feed' && <ClassroomFeed />}
    </div>
  );
}

export default function BattleStoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <BattleStoriesContent />
    </Suspense>
  );
}
