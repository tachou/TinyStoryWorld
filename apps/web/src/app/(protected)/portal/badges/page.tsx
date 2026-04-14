'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'reading' | 'writing' | 'grammar' | 'social' | 'special';
  earned: boolean;
}

interface Stats {
  xp: number;
  level: number;
  levelProgress: number;
  readingStreak: number;
  reading: { totalPages: number; uniqueBooks: number; totalMinutes: number; totalSessions: number };
  battle: { totalStories: number; totalRemixes: number; totalVotesReceived: number };
  aiStory: { totalStories: number };
  silly: { totalCorrect: number; bestStreak: number; totalRounds: number };
  votesGiven: number;
}

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  reading: { label: 'Reading', icon: '\u{1F4D6}', color: 'text-primary-600' },
  writing: { label: 'Writing', icon: '\u270D\uFE0F', color: 'text-red-600' },
  grammar: { label: 'Grammar', icon: '\u{1F9E9}', color: 'text-purple-600' },
  social: { label: 'Social', icon: '\u{1F91D}', color: 'text-green-600' },
  special: { label: 'Special', icon: '\u{1F31F}', color: 'text-amber-600' },
};

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div
      className={`relative rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${
        badge.earned
          ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white shadow-md'
          : 'border-gray-200 bg-gray-50 opacity-50'
      }`}
    >
      {/* Badge icon */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
          badge.earned
            ? 'bg-gradient-to-br from-amber-200 to-yellow-300 border-2 border-amber-400 shadow-lg'
            : 'bg-gray-200 border-2 border-gray-300'
        }`}
      >
        <span className={`text-3xl ${badge.earned ? '' : 'grayscale filter'}`}>
          {badge.earned ? badge.icon : '\u{1F512}'}
        </span>
      </div>

      {/* Badge name */}
      <h3 className={`text-sm font-bold ${badge.earned ? 'text-gray-900' : 'text-gray-400'}`}>
        {badge.name}
      </h3>

      {/* Badge description */}
      <p className={`text-xs mt-1 ${badge.earned ? 'text-gray-600' : 'text-gray-400'}`}>
        {badge.description}
      </p>

      {/* Earned checkmark */}
      {badge.earned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold">{'\u2713'}</span>
        </div>
      )}
    </div>
  );
}

function StatsOverview({ stats }: { stats: Stats }) {
  const statItems = [
    { label: 'Total XP', value: stats.xp.toLocaleString(), icon: '\u26A1' },
    { label: 'Level', value: stats.level, icon: '\u{1F396}\uFE0F' },
    { label: 'Pages Read', value: stats.reading.totalPages, icon: '\u{1F4D6}' },
    { label: 'Books Read', value: stats.reading.uniqueBooks, icon: '\u{1F4DA}' },
    { label: 'Reading Time', value: `${stats.reading.totalMinutes}m`, icon: '\u23F1\uFE0F' },
    { label: 'Reading Streak', value: `${stats.readingStreak} days`, icon: '\u{1F525}' },
    { label: 'Battle Stories', value: stats.battle.totalStories, icon: '\u2694\uFE0F' },
    { label: 'AI Stories', value: stats.aiStory.totalStories, icon: '\u2728' },
    { label: 'Grammar Correct', value: stats.silly.totalCorrect, icon: '\u{1F9E9}' },
    { label: 'Best Streak', value: stats.silly.bestStreak, icon: '\u{1F31F}' },
    { label: 'Votes Given', value: stats.votesGiven, icon: '\u{1F44D}' },
    { label: 'Votes Received', value: stats.battle.totalVotesReceived, icon: '\u{1F389}' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900 mb-3">
        {'\u{1F4CA}'} Your Stats
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <span className="text-lg">{item.icon}</span>
            <p className="text-lg font-bold text-gray-900">{item.value}</p>
            <p className="text-[10px] text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const [badgesRes, statsRes] = await Promise.all([
          fetch('/api/student/badges'),
          fetch('/api/student/stats'),
        ]);

        if (badgesRes.ok) {
          const data = await badgesRes.json();
          setBadges(data.badges || []);
          setEarnedCount(data.earnedCount || 0);
          setTotalCount(data.totalCount || 0);
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch badges:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredBadges =
    filter === 'all'
      ? badges
      : filter === 'earned'
      ? badges.filter((b) => b.earned)
      : filter === 'locked'
      ? badges.filter((b) => !b.earned)
      : badges.filter((b) => b.category === filter);

  // Group by category
  const categories = ['reading', 'writing', 'grammar', 'social', 'special'];
  const groupedByCategory = filter === 'all' || !['reading', 'writing', 'grammar', 'social', 'special', 'earned', 'locked'].includes(filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold ">
            {'\u{1F3C6}'} My Badges
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {earnedCount} of {totalCount} badges earned
          </p>
        </div>
        <Link
          href="/portal"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {'\u2190'} Back to Portal
        </Link>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Badge Progress</span>
          <span className="font-bold text-primary-600">
            {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
          </span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000"
            style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">{earnedCount} earned</span>
          <span className="text-xs text-gray-400">{totalCount - earnedCount} remaining</span>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && <StatsOverview stats={stats} />}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 my-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'earned', label: `Earned (${earnedCount})` },
          { key: 'locked', label: `Locked (${totalCount - earnedCount})` },
          ...categories.map((c) => ({
            key: c,
            label: `${CATEGORY_INFO[c].icon} ${CATEGORY_INFO[c].label}`,
          })),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      {groupedByCategory && filter === 'all' ? (
        // Grouped view
        categories.map((cat) => {
          const catBadges = badges.filter((b) => b.category === cat);
          if (catBadges.length === 0) return null;
          const info = CATEGORY_INFO[cat];
          const catEarned = catBadges.filter((b) => b.earned).length;

          return (
            <div key={cat} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-lg ${info.color}`}>{info.icon}</span>
                <h2 className="text-lg font-bold text-gray-900">{info.label}</h2>
                <span className="text-xs text-gray-400 ml-1">
                  {catEarned}/{catBadges.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {catBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // Flat view for filters
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}

      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">{'\u{1F50D}'}</p>
          <p className="text-gray-500">No badges found for this filter.</p>
        </div>
      )}
    </div>
  );
}
