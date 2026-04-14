'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { StudentAssignments } from '@/features/portal/components/StudentAssignments';
import { ReadingHistory } from '@/features/portal/components/ReadingHistory';

interface Stats {
  xp: number;
  level: number;
  levelProgress: number;
  xpForNextLevel: number;
  readingStreak: number;
  readingDates: string[];
  reading: {
    totalSessions: number;
    totalMinutes: number;
    totalPages: number;
    uniqueBooks: number;
  };
  battle: {
    totalStories: number;
    totalRemixes: number;
    totalVotesReceived: number;
  };
  aiStory: {
    totalStories: number;
  };
  silly: {
    totalSessions: number;
    totalRounds: number;
    totalCorrect: number;
    bestStreak: number;
  };
  votesGiven: number;
  profile: {
    totalStars: number;
    totalBooksRead: number;
    readingStage: string;
    currentLevel: number;
  };
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  emergent: 'Emergent',
  beginner: 'Beginner',
  in_transition: 'In Transition',
  competent: 'Competent',
  experienced: 'Experienced',
};

function LevelBadge({ level }: { level: number }) {
  const colors = [
    'from-gray-400 to-gray-500',
    'from-green-400 to-emerald-500',
    'from-primary-400 to-primary-500',
    'from-purple-400 to-violet-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-cyan-400 to-teal-500',
  ];
  const colorClass = colors[Math.min(level - 1, colors.length - 1) % colors.length];

  return (
    <div
      className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}
    >
      <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm" />
      <span className="relative text-3xl font-black text-white drop-shadow-md">
        {level}
      </span>
    </div>
  );
}

function XPBar({ progress, xp, xpForNext }: { progress: number; xp: number; xpForNext: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>{xp} XP</span>
        <span>{xpForNext} XP to next level</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StreakDisplay({ streak, dates }: { streak: number; dates: string[] }) {
  // Show last 7 days
  const today = new Date();
  const days: { label: string; active: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      active: dates.includes(dateStr),
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">
          {'\u{1F525}'} Reading Streak
        </h3>
        <span className="text-2xl font-black text-orange-500">{streak}</span>
      </div>
      <div className="flex justify-between gap-1">
        {days.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                day.active
                  ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {day.active ? '\u2713' : '\u00B7'}
            </div>
            <span className="text-[10px] text-gray-400">{day.label}</span>
          </div>
        ))}
      </div>
      {streak > 0 && (
        <p className="text-xs text-orange-500 font-medium mt-2 text-center">
          {streak === 1
            ? 'Great start! Keep it going!'
            : streak < 7
            ? `${streak} days strong! Can you make it to 7?`
            : `Amazing! ${streak} day streak!`}
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function RecentBadges({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned);
  const display = earned.slice(0, 5);

  if (display.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
        <p className="text-2xl mb-1">{'\u{1F3C6}'}</p>
        <p className="text-sm text-gray-500">No badges earned yet</p>
        <p className="text-xs text-gray-400 mt-0.5">Keep reading and playing to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">
          {'\u{1F3C6}'} Recent Badges
        </h3>
        <Link
          href="/portal/badges"
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          View all {'\u2192'}
        </Link>
      </div>
      <div className="flex gap-3">
        {display.map((badge) => (
          <div
            key={badge.id}
            className="flex flex-col items-center gap-1"
            title={badge.description}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center border-2 border-amber-300 shadow-sm">
              <span className="text-xl">{badge.icon}</span>
            </div>
            <span className="text-[10px] text-gray-600 font-medium text-center leading-tight max-w-[60px] truncate">
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortalPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const name = session?.user?.name ?? 'Student';

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, badgesRes] = await Promise.all([
          fetch('/api/student/stats'),
          fetch('/api/student/badges'),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (badgesRes.ok) {
          const data = await badgesRes.json();
          setBadges(data.badges || []);
        }
      } catch (err) {
        console.error('Failed to fetch student data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const quickLinks = [
    {
      href: '/portal/library',
      icon: '\u{1F4D6}',
      title: 'Book Library',
      description: 'Browse and read books.',
      color: 'border-primary-200 hover:border-primary-300 bg-primary-50/50',
    },
    {
      href: '/silly-sentences',
      icon: '\u{1F9E9}',
      title: 'Silly Sentences',
      description: 'Practice grammar with fun sentences.',
      color: 'border-purple-200 hover:border-purple-300 bg-purple-50/50',
    },
    {
      href: '/battle-stories',
      icon: '\u2694\uFE0F',
      title: 'Battle Stories',
      description: 'Create and share battle stories.',
      color: 'border-red-200 hover:border-red-300 bg-red-50/50',
    },
    {
      href: '/stories',
      icon: '\u2728',
      title: 'AI Stories',
      description: 'Generate stories with AI.',
      color: 'border-amber-200 hover:border-amber-300 bg-amber-50/50',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero Section with Level */}
      <div className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center gap-5">
          {stats ? (
            <LevelBadge level={stats.level} />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 animate-pulse" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              Welcome back, {name}!
            </h1>
            {stats ? (
              <>
                <p className="text-white/80 text-sm mt-1">
                  Level {stats.level} Reader
                  {stats.profile.readingStage && (
                    <> {'\u00B7'} {STAGE_LABELS[stats.profile.readingStage] || stats.profile.readingStage} Stage</>
                  )}
                </p>
                <div className="mt-3 max-w-sm">
                  <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                    <span>{stats.xp} XP</span>
                    <span>{stats.xpForNextLevel} XP</span>
                  </div>
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/80 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(stats.levelProgress * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-4 w-40 bg-white/20 rounded mt-2 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid + Streak */}
      {!loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={'\u{1F4D6}'}
            label="Pages Read"
            value={stats.reading.totalPages}
            sub={`${stats.reading.uniqueBooks} books`}
            color="bg-primary-50 border-primary-200"
          />
          <StatCard
            icon={'\u23F1\uFE0F'}
            label="Reading Time"
            value={`${stats.reading.totalMinutes}m`}
            sub={`${stats.reading.totalSessions} sessions`}
            color="bg-green-50 border-green-200"
          />
          <StatCard
            icon={'\u2694\uFE0F'}
            label="Stories Created"
            value={stats.battle.totalStories + stats.aiStory.totalStories}
            sub={`${stats.battle.totalVotesReceived} votes received`}
            color="bg-red-50 border-red-200"
          />
          <StatCard
            icon={'\u{1F9E9}'}
            label="Grammar Score"
            value={stats.silly.totalCorrect}
            sub={`Best streak: ${stats.silly.bestStreak}`}
            color="bg-purple-50 border-purple-200"
          />
        </div>
      )}

      {/* Streak + Badges row */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <StreakDisplay streak={stats.readingStreak} dates={stats.readingDates} />
          <RecentBadges badges={badges} />
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group rounded-xl border p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all ${link.color}`}
          >
            <span className="text-2xl">{link.icon}</span>
            <h2 className="mt-2 text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {link.title}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Assignments Section */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {'\u{1F4DD}'} My Assignments
        </h2>
        <StudentAssignments />
      </section>

      {/* Reading History Section */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {'\u{1F4DA}'} Recent Reading
        </h2>
        <ReadingHistory />
      </section>
    </div>
  );
}
