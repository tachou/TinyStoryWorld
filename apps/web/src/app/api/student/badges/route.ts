import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Badge definitions — each badge has an id, name, description, icon, and a condition
 * that checks against the student stats object.
 */
export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'reading' | 'writing' | 'grammar' | 'social' | 'special';
  condition: (stats: any) => boolean;
}

const BADGE_DEFS: BadgeDef[] = [
  // --- Reading Badges ---
  {
    id: 'first_read',
    name: 'First Page',
    description: 'Read your very first book page',
    icon: '\u{1F4D6}',
    category: 'reading',
    condition: (s) => s.reading.totalPages >= 1,
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read 50 pages total',
    icon: '\u{1F41B}',
    category: 'reading',
    condition: (s) => s.reading.totalPages >= 50,
  },
  {
    id: 'super_reader',
    name: 'Super Reader',
    description: 'Read 200 pages total',
    icon: '\u{1F9B8}',
    category: 'reading',
    condition: (s) => s.reading.totalPages >= 200,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Read 5 different books',
    icon: '\u{1F30D}',
    category: 'reading',
    condition: (s) => s.reading.uniqueBooks >= 5,
  },
  {
    id: 'library_master',
    name: 'Library Master',
    description: 'Read 20 different books',
    icon: '\u{1F3DB}\uFE0F',
    category: 'reading',
    condition: (s) => s.reading.uniqueBooks >= 20,
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Read 3 days in a row',
    icon: '\u{1F525}',
    category: 'reading',
    condition: (s) => s.readingStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Read 7 days in a row',
    icon: '\u{1F4AA}',
    category: 'reading',
    condition: (s) => s.readingStreak >= 7,
  },
  {
    id: 'streak_14',
    name: 'Unstoppable',
    description: 'Read 14 days in a row',
    icon: '\u{1F680}',
    category: 'reading',
    condition: (s) => s.readingStreak >= 14,
  },
  {
    id: 'marathon',
    name: 'Reading Marathon',
    description: 'Read for 60 minutes total',
    icon: '\u23F1\uFE0F',
    category: 'reading',
    condition: (s) => s.reading.totalMinutes >= 60,
  },

  // --- Writing Badges ---
  {
    id: 'first_battle',
    name: 'Battle Beginner',
    description: 'Create your first Battle Story',
    icon: '\u2694\uFE0F',
    category: 'writing',
    condition: (s) => s.battle.totalStories >= 1,
  },
  {
    id: 'battle_veteran',
    name: 'Battle Veteran',
    description: 'Create 10 Battle Stories',
    icon: '\u{1F6E1}\uFE0F',
    category: 'writing',
    condition: (s) => s.battle.totalStories >= 10,
  },
  {
    id: 'remixer',
    name: 'Remix Artist',
    description: 'Get 3 remixes on your stories',
    icon: '\u{1F3A8}',
    category: 'writing',
    condition: (s) => s.battle.totalRemixes >= 3,
  },
  {
    id: 'first_ai_story',
    name: 'Story Creator',
    description: 'Generate your first AI Story',
    icon: '\u2728',
    category: 'writing',
    condition: (s) => s.aiStory.totalStories >= 1,
  },
  {
    id: 'ai_author',
    name: 'AI Author',
    description: 'Generate 10 AI Stories',
    icon: '\u{1F4DD}',
    category: 'writing',
    condition: (s) => s.aiStory.totalStories >= 10,
  },

  // --- Grammar Badges ---
  {
    id: 'first_sentence',
    name: 'Sentence Starter',
    description: 'Play your first Silly Sentences round',
    icon: '\u{1F9E9}',
    category: 'grammar',
    condition: (s) => s.silly.totalRounds >= 1,
  },
  {
    id: 'grammar_whiz',
    name: 'Grammar Whiz',
    description: 'Get 25 correct sentences',
    icon: '\u{1F393}',
    category: 'grammar',
    condition: (s) => s.silly.totalCorrect >= 25,
  },
  {
    id: 'grammar_master',
    name: 'Grammar Master',
    description: 'Get 100 correct sentences',
    icon: '\u{1F451}',
    category: 'grammar',
    condition: (s) => s.silly.totalCorrect >= 100,
  },
  {
    id: 'streak_5_grammar',
    name: 'Perfect Five',
    description: 'Get a streak of 5 correct in Silly Sentences',
    icon: '\u{1F31F}',
    category: 'grammar',
    condition: (s) => s.silly.bestStreak >= 5,
  },
  {
    id: 'streak_10_grammar',
    name: 'On Fire!',
    description: 'Get a streak of 10 correct in Silly Sentences',
    icon: '\u{1F525}',
    category: 'grammar',
    condition: (s) => s.silly.bestStreak >= 10,
  },

  // --- Social Badges ---
  {
    id: 'first_vote',
    name: 'Supporter',
    description: 'Vote on a classmate\'s story',
    icon: '\u{1F44D}',
    category: 'social',
    condition: (s) => s.votesGiven >= 1,
  },
  {
    id: 'fan',
    name: 'Biggest Fan',
    description: 'Vote on 20 stories',
    icon: '\u{1F389}',
    category: 'social',
    condition: (s) => s.votesGiven >= 20,
  },
  {
    id: 'popular_writer',
    name: 'Popular Writer',
    description: 'Receive 10 votes on your stories',
    icon: '\u{1F31F}',
    category: 'social',
    condition: (s) => s.battle.totalVotesReceived >= 10,
  },

  // --- Special Badges ---
  {
    id: 'level_5',
    name: 'Level 5!',
    description: 'Reach Level 5',
    icon: '\u{1F3C6}',
    category: 'special',
    condition: (s) => s.level >= 5,
  },
  {
    id: 'level_10',
    name: 'Level 10!',
    description: 'Reach Level 10',
    icon: '\u{1F48E}',
    category: 'special',
    condition: (s) => s.level >= 10,
  },
  {
    id: 'well_rounded',
    name: 'Well Rounded',
    description: 'Read a book, create a Battle Story, build a sentence, and generate an AI Story',
    icon: '\u{1F308}',
    category: 'special',
    condition: (s) =>
      s.reading.totalSessions >= 1 &&
      s.battle.totalStories >= 1 &&
      s.silly.totalRounds >= 1 &&
      s.aiStory.totalStories >= 1,
  },
];

/**
 * GET /api/student/badges — Returns all badges with earned status.
 *
 * The client fetches /api/student/stats and /api/student/badges in parallel,
 * so we keep this endpoint lightweight. The client passes the stats it already
 * has as a query param, or we compute a minimal version here.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Compute stats inline (lightweight version) to evaluate badge conditions
  const stats = await computeStatsForBadges(session.user.id);

  const badges = BADGE_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    category: def.category,
    earned: def.condition(stats),
  }));

  const earnedCount = badges.filter((b) => b.earned).length;

  return NextResponse.json({
    badges,
    earnedCount,
    totalCount: badges.length,
  });
}

async function computeStatsForBadges(userId: string) {
  const { getDb, readingSessions, battleStories, generatedStories, sillySentencesSessions, battleVotes } = await import('@tiny-story-world/db');
  const { eq, sql, and, gte, desc } = await import('drizzle-orm');

  const db = getDb();

  const [readingStats, battleStats, aiStats, sillyStats, voteStats, streakData] = await Promise.all([
    db.select({
      totalSessions: sql<number>`count(*)::int`,
      totalMinutes: sql<number>`coalesce(sum(${readingSessions.durationSeconds}), 0)::int / 60`,
      totalPages: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)::int`,
      uniqueBooks: sql<number>`count(distinct ${readingSessions.bookId})::int`,
    }).from(readingSessions).where(eq(readingSessions.studentId, userId)),

    db.select({
      totalStories: sql<number>`count(*)::int`,
      totalRemixes: sql<number>`coalesce(sum(${battleStories.remixCount}), 0)::int`,
      totalVotesReceived: sql<number>`coalesce(sum((${battleStories.voteCounts}->>'funniest')::int + (${battleStories.voteCounts}->>'smartest')::int + (${battleStories.voteCounts}->>'surprising')::int + (${battleStories.voteCounts}->>'best_plan')::int), 0)::int`,
    }).from(battleStories).where(eq(battleStories.studentId, userId)),

    db.select({ totalStories: sql<number>`count(*)::int` }).from(generatedStories).where(eq(generatedStories.studentId, userId)),

    db.select({
      totalSessions: sql<number>`count(*)::int`,
      totalRounds: sql<number>`coalesce(sum(${sillySentencesSessions.roundsPlayed}), 0)::int`,
      totalCorrect: sql<number>`coalesce(sum(${sillySentencesSessions.correctCount}), 0)::int`,
      bestStreak: sql<number>`coalesce(max(${sillySentencesSessions.streakBest}), 0)::int`,
    }).from(sillySentencesSessions).where(eq(sillySentencesSessions.studentId, userId)),

    db.select({ totalVotesGiven: sql<number>`count(*)::int` }).from(battleVotes).where(eq(battleVotes.voterId, userId)),

    db.select({ sessionDate: sql<string>`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')` })
      .from(readingSessions)
      .where(and(eq(readingSessions.studentId, userId), gte(readingSessions.startedAt, sql`now() - interval '30 days'`)))
      .groupBy(sql`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')`)
      .orderBy(desc(sql`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')`)),
  ]);

  const reading = readingStats[0] ?? { totalSessions: 0, totalMinutes: 0, totalPages: 0, uniqueBooks: 0 };
  const battle = battleStats[0] ?? { totalStories: 0, totalRemixes: 0, totalVotesReceived: 0 };
  const aiStory = aiStats[0] ?? { totalStories: 0 };
  const silly = sillyStats[0] ?? { totalSessions: 0, totalRounds: 0, totalCorrect: 0, bestStreak: 0 };
  const votes = voteStats[0] ?? { totalVotesGiven: 0 };

  // Calculate streak
  const dates = streakData.map((d) => d.sessionDate);
  const readingStreak = calculateStreak(dates);

  // Calculate XP and level
  const xp = reading.totalPages * 5 + reading.totalMinutes * 2 + battle.totalStories * 50 + aiStory.totalStories * 30 + silly.totalCorrect * 10 + battle.totalVotesReceived * 5 + votes.totalVotesGiven * 3 + readingStreak * 20;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

  return { xp, level, readingStreak, reading, battle, aiStory, silly, votesGiven: votes.totalVotesGiven };
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}
