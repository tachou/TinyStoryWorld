import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getDb,
  classes,
  studentProfiles,
  users,
  readingSessions,
  battleStories,
  generatedStories,
  sillySentencesSessions,
} from '@tiny-story-world/db';
import { eq, sql, and, gte, desc, inArray } from 'drizzle-orm';

/**
 * GET /api/classes/[id]/progress — Get progress data for all students in a class.
 * Returns per-student stats for the teacher analytics dashboard.
 *
 * Query params:
 *   period: '7d' | '30d' | 'all' (default '30d')
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: classId } = await params;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';

  const db = getDb();

  // Verify this teacher owns the class
  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Get all students in this class
  const profiles = await db
    .select({
      profileId: studentProfiles.id,
      userId: studentProfiles.userId,
      readingStage: studentProfiles.readingStage,
      currentLevel: studentProfiles.currentLevel,
      totalBooksRead: studentProfiles.totalBooksRead,
      totalStars: studentProfiles.totalStars,
      staminaBand: studentProfiles.staminaBand,
    })
    .from(studentProfiles)
    .where(eq(studentProfiles.classId, classId));

  if (profiles.length === 0) {
    return NextResponse.json({ className: cls.name, students: [] });
  }

  const studentIds = profiles.map((p) => p.userId);

  // Get user names
  const studentUsers = await db
    .select({ id: users.id, displayName: users.displayName, email: users.email })
    .from(users)
    .where(inArray(users.id, studentIds));

  const nameMap = new Map(studentUsers.map((u) => [u.id, { name: u.displayName, email: u.email }]));

  // Time filter
  const periodFilter =
    period === '7d'
      ? sql`now() - interval '7 days'`
      : period === '30d'
      ? sql`now() - interval '30 days'`
      : sql`'1970-01-01'::timestamptz`;

  // Aggregate stats per student
  const [readingAgg, battleAgg, aiAgg, sillyAgg, recentActivity] = await Promise.all([
    // Reading sessions per student
    db
      .select({
        studentId: readingSessions.studentId,
        totalSessions: sql<number>`count(*)::int`,
        totalMinutes: sql<number>`coalesce(sum(${readingSessions.durationSeconds}), 0)::int / 60`,
        totalPages: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)::int`,
        uniqueBooks: sql<number>`count(distinct ${readingSessions.bookId})::int`,
        lastSessionAt: sql<string>`max(${readingSessions.startedAt})`,
      })
      .from(readingSessions)
      .where(
        and(
          inArray(readingSessions.studentId, studentIds),
          gte(readingSessions.startedAt, periodFilter)
        )
      )
      .groupBy(readingSessions.studentId),

    // Battle stories per student
    db
      .select({
        studentId: battleStories.studentId,
        totalStories: sql<number>`count(*)::int`,
      })
      .from(battleStories)
      .where(
        and(
          inArray(battleStories.studentId, studentIds),
          gte(battleStories.createdAt, periodFilter)
        )
      )
      .groupBy(battleStories.studentId),

    // AI stories per student
    db
      .select({
        studentId: generatedStories.studentId,
        totalStories: sql<number>`count(*)::int`,
      })
      .from(generatedStories)
      .where(
        and(
          inArray(generatedStories.studentId, studentIds),
          gte(generatedStories.generatedAt, periodFilter)
        )
      )
      .groupBy(generatedStories.studentId),

    // Silly sentences per student
    db
      .select({
        studentId: sillySentencesSessions.studentId,
        totalRounds: sql<number>`coalesce(sum(${sillySentencesSessions.roundsPlayed}), 0)::int`,
        totalCorrect: sql<number>`coalesce(sum(${sillySentencesSessions.correctCount}), 0)::int`,
        bestStreak: sql<number>`coalesce(max(${sillySentencesSessions.streakBest}), 0)::int`,
      })
      .from(sillySentencesSessions)
      .where(
        and(
          inArray(sillySentencesSessions.studentId, studentIds),
          gte(sillySentencesSessions.startedAt, periodFilter)
        )
      )
      .groupBy(sillySentencesSessions.studentId),

    // Class-wide daily activity (for chart) — reading sessions per day
    db
      .select({
        day: sql<string>`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')`,
        sessions: sql<number>`count(*)::int`,
        minutes: sql<number>`coalesce(sum(${readingSessions.durationSeconds}), 0)::int / 60`,
        activeStudents: sql<number>`count(distinct ${readingSessions.studentId})::int`,
      })
      .from(readingSessions)
      .where(
        and(
          inArray(readingSessions.studentId, studentIds),
          gte(readingSessions.startedAt, periodFilter)
        )
      )
      .groupBy(sql`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')`)
      .orderBy(sql`date(${readingSessions.startedAt} AT TIME ZONE 'UTC')`),
  ]);

  // Build lookup maps
  const readingMap = new Map(readingAgg.map((r) => [r.studentId, r]));
  const battleMap = new Map(battleAgg.map((b) => [b.studentId, b]));
  const aiMap = new Map(aiAgg.map((a) => [a.studentId, a]));
  const sillyMap = new Map(sillyAgg.map((s) => [s.studentId, s]));

  // Build per-student response
  const students = profiles.map((p) => {
    const user = nameMap.get(p.userId);
    const reading = readingMap.get(p.userId);
    const battle = battleMap.get(p.userId);
    const ai = aiMap.get(p.userId);
    const silly = sillyMap.get(p.userId);

    return {
      id: p.userId,
      name: user?.name || 'Unknown',
      email: user?.email || '',
      readingStage: p.readingStage,
      currentLevel: p.currentLevel,
      totalBooksRead: p.totalBooksRead,
      totalStars: p.totalStars,
      staminaBand: p.staminaBand,
      reading: {
        totalSessions: reading?.totalSessions ?? 0,
        totalMinutes: reading?.totalMinutes ?? 0,
        totalPages: reading?.totalPages ?? 0,
        uniqueBooks: reading?.uniqueBooks ?? 0,
        lastSessionAt: reading?.lastSessionAt ?? null,
      },
      battle: {
        totalStories: battle?.totalStories ?? 0,
      },
      aiStories: {
        totalStories: ai?.totalStories ?? 0,
      },
      silly: {
        totalRounds: silly?.totalRounds ?? 0,
        totalCorrect: silly?.totalCorrect ?? 0,
        bestStreak: silly?.bestStreak ?? 0,
      },
    };
  });

  // Class-wide aggregates
  const classStats = {
    totalStudents: students.length,
    activeStudents: students.filter((s) => s.reading.totalSessions > 0).length,
    totalReadingSessions: students.reduce((sum, s) => sum + s.reading.totalSessions, 0),
    totalReadingMinutes: students.reduce((sum, s) => sum + s.reading.totalMinutes, 0),
    totalPages: students.reduce((sum, s) => sum + s.reading.totalPages, 0),
    totalBattleStories: students.reduce((sum, s) => sum + s.battle.totalStories, 0),
    totalAiStories: students.reduce((sum, s) => sum + s.aiStories.totalStories, 0),
    totalGrammarCorrect: students.reduce((sum, s) => sum + s.silly.totalCorrect, 0),
  };

  // Stage distribution
  const stageDistribution: Record<string, number> = {};
  for (const s of students) {
    stageDistribution[s.readingStage] = (stageDistribution[s.readingStage] || 0) + 1;
  }

  return NextResponse.json({
    className: cls.name,
    period,
    classStats,
    stageDistribution,
    dailyActivity: recentActivity,
    students: students.sort((a, b) => a.name.localeCompare(b.name)),
  });
}
