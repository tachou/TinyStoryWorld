import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getDb,
  readingSessions,
  battleStories,
  generatedStories,
  sillySentencesSessions,
  studentProfiles,
  battleVotes,
} from '@tiny-story-world/db';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

/**
 * GET /api/student/stats — Aggregated gamification stats for the current student
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const userId = session.user.id;

  // Run all queries in parallel
  const [
    readingStats,
    battleStats,
    aiStoryStats,
    sillyStats,
    voteStats,
    profileRows,
    streakData,
  ] = await Promise.all([
    // Reading sessions aggregate
    db
      .select({
        totalSessions: sql<number>`count(*)::int`,
        totalMinutes: sql<number>`coalesce(sum(${readingSessions.durationSeconds}), 0)::int / 60`,
        totalPages: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)::int`,
        uniqueBooks: sql<number>`count(distinct ${readingSessions.bookId})::int`,
      })
      .from(readingSessions)
      .where(eq(readingSessions.studentId, userId)),

    // Battle stories aggregate
    db
      .select({
        totalStories: sql<number>`count(*)::int`,
        totalRemixes: sql<number>`coalesce(sum(${battleStories.remixCount}), 0)::int`,
        totalVotesReceived: sql<number>`coalesce(
          sum(
            (${battleStories.voteCounts}->>'funniest')::int +
            (${battleStories.voteCounts}->>'smartest')::int +
            (${battleStories.voteCounts}->>'surprising')::int +
            (${battleStories.voteCounts}->>'best_plan')::int
          ), 0)::int`,
      })
      .from(battleStories)
      .where(eq(battleStories.studentId, userId)),

    // AI stories aggregate
    db
      .select({
        totalStories: sql<number>`count(*)::int`,
      })
      .from(generatedStories)
      .where(eq(generatedStories.studentId, userId)),

    // Silly sentences aggregate
    db
      .select({
        totalSessions: sql<number>`count(*)::int`,
        totalRounds: sql<number>`coalesce(sum(${sillySentencesSessions.roundsPlayed}), 0)::int`,
        totalCorrect: sql<number>`coalesce(sum(${sillySentencesSessions.correctCount}), 0)::int`,
        bestStreak: sql<number>`coalesce(max(${sillySentencesSessions.streakBest}), 0)::int`,
      })
      .from(sillySentencesSessions)
      .where(eq(sillySentencesSessions.studentId, userId)),

    // Votes given to others
    db
      .select({
        totalVotesGiven: sql<number>`count(*)::int`,
      })
      .from(battleVotes)
      .where(eq(battleVotes.voterId, userId)),

    // Student profile
    db
      .select({
        totalStars: studentProfiles.totalStars,
        totalBooksRead: studentProfiles.totalBooksRead,
        readingStage: studentProfiles.readingStage,
        currentLevel: studentProfiles.currentLevel,
      })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1),

    // Reading streak — get distinct dates with reading sessions in last 30 days
    db
      .select({
        sessionDate: sql<string>`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')`,
      })
      .from(readingSessions)
      .where(
        and(
          eq(readingSessions.studentId, userId),
          gte(readingSessions.startedAt, sql`now() - interval '30 days'`)
        )
      )
      .groupBy(sql`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')`)
      .orderBy(desc(sql`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')`)),
  ]);

  // Calculate reading streak
  const readingDates = streakData.map((d) => d.sessionDate);
  const currentStreak = calculateStreak(readingDates);

  const reading = readingStats[0] ?? { totalSessions: 0, totalMinutes: 0, totalPages: 0, uniqueBooks: 0 };
  const battle = battleStats[0] ?? { totalStories: 0, totalRemixes: 0, totalVotesReceived: 0 };
  const aiStory = aiStoryStats[0] ?? { totalStories: 0 };
  const silly = sillyStats[0] ?? { totalSessions: 0, totalRounds: 0, totalCorrect: 0, bestStreak: 0 };
  const votes = voteStats[0] ?? { totalVotesGiven: 0 };
  const profile = profileRows[0] ?? { totalStars: 0, totalBooksRead: 0, readingStage: 'emergent', currentLevel: 1 };

  // Calculate XP (experience points)
  const xp =
    reading.totalPages * 5 +
    reading.totalMinutes * 2 +
    battle.totalStories * 50 +
    aiStory.totalStories * 30 +
    silly.totalCorrect * 10 +
    battle.totalVotesReceived * 5 +
    votes.totalVotesGiven * 3 +
    currentStreak * 20;

  // Calculate level from XP
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const xpForCurrentLevel = ((level - 1) * (level - 1)) * 100;
  const xpForNextLevel = (level * level) * 100;
  const levelProgress = xpForNextLevel > xpForCurrentLevel
    ? (xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)
    : 0;

  return NextResponse.json({
    xp,
    level,
    levelProgress,
    xpForNextLevel,
    readingStreak: currentStreak,
    readingDates,
    reading,
    battle,
    aiStory,
    silly,
    votesGiven: votes.totalVotesGiven,
    profile,
  });
}

/**
 * Calculate consecutive day streak from an array of date strings (most recent first)
 */
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Streak must include today or yesterday
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
