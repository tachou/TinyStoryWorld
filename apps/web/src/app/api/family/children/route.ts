import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getDb,
  parentLinks,
  users,
  studentProfiles,
  classes,
  readingSessions,
  battleStories,
  generatedStories,
  sillySentencesSessions,
  books,
} from '@tiny-story-world/db';
import { eq, sql, and, inArray, desc } from 'drizzle-orm';

/**
 * GET /api/family/children — Get linked children's profiles + progress for the parent portal
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  // Get linked children
  const links = await db
    .select({ studentId: parentLinks.studentId })
    .from(parentLinks)
    .where(eq(parentLinks.parentId, session.user.id));

  if (links.length === 0) {
    return NextResponse.json([]);
  }

  const childIds = links.map((l) => l.studentId);

  // Get user info for each child
  const childUsers = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.id, childIds));

  // Get student profiles
  const profiles = await db
    .select({
      userId: studentProfiles.userId,
      readingStage: studentProfiles.readingStage,
      currentLevel: studentProfiles.currentLevel,
      totalBooksRead: studentProfiles.totalBooksRead,
      totalStars: studentProfiles.totalStars,
      staminaBand: studentProfiles.staminaBand,
      classId: studentProfiles.classId,
    })
    .from(studentProfiles)
    .where(inArray(studentProfiles.userId, childIds));

  // Get class names
  const classIds = [...new Set(profiles.map((p) => p.classId))];
  const classData = classIds.length > 0
    ? await db
        .select({ id: classes.id, name: classes.name })
        .from(classes)
        .where(inArray(classes.id, classIds))
    : [];
  const classMap = new Map(classData.map((c) => [c.id, c.name]));

  // Reading stats per child (last 30 days)
  const readingStats = await db
    .select({
      studentId: readingSessions.studentId,
      totalSessions: sql<number>`count(*)::int`,
      totalMinutes: sql<number>`coalesce(sum(${readingSessions.durationSeconds}), 0)::int / 60`,
      totalPages: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)::int`,
      uniqueBooks: sql<number>`count(distinct ${readingSessions.bookId})::int`,
      lastSessionAt: sql<string>`max(${readingSessions.startedAt})`,
    })
    .from(readingSessions)
    .where(inArray(readingSessions.studentId, childIds))
    .groupBy(readingSessions.studentId);

  // Recent books per child (last 5)
  const recentBooks = await db
    .select({
      studentId: readingSessions.studentId,
      bookTitle: books.title,
      bookStage: books.stage,
      completedAt: readingSessions.completedAt,
    })
    .from(readingSessions)
    .leftJoin(books, eq(books.id, readingSessions.bookId))
    .where(inArray(readingSessions.studentId, childIds))
    .orderBy(desc(readingSessions.startedAt))
    .limit(20);

  // Battle + AI story counts
  const battleCounts = await db
    .select({
      studentId: battleStories.studentId,
      count: sql<number>`count(*)::int`,
    })
    .from(battleStories)
    .where(inArray(battleStories.studentId, childIds))
    .groupBy(battleStories.studentId);

  const aiCounts = await db
    .select({
      studentId: generatedStories.studentId,
      count: sql<number>`count(*)::int`,
    })
    .from(generatedStories)
    .where(inArray(generatedStories.studentId, childIds))
    .groupBy(generatedStories.studentId);

  // Reading streak per child (consecutive days)
  const streakData = await db
    .select({
      studentId: readingSessions.studentId,
      dates: sql<string[]>`array_agg(distinct date(${readingSessions.startedAt} AT TIME ZONE 'UTC'))`,
    })
    .from(readingSessions)
    .where(inArray(readingSessions.studentId, childIds))
    .groupBy(readingSessions.studentId);

  // Compute streaks
  function computeStreak(dates: string[]): number {
    if (!dates || dates.length === 0) return 0;
    const sorted = [...new Set(dates)].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff =
        (new Date(sorted[i - 1]).getTime() - new Date(sorted[i]).getTime()) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }

  // Build maps
  const readMap = new Map(readingStats.map((r) => [r.studentId, r]));
  const battleMap = new Map(battleCounts.map((b) => [b.studentId, b.count]));
  const aiMap = new Map(aiCounts.map((a) => [a.studentId, a.count]));
  const streakMap = new Map(streakData.map((s) => [s.studentId, computeStreak(s.dates)]));
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  // Group recent books by student
  const booksByStudent = new Map<string, typeof recentBooks>();
  for (const b of recentBooks) {
    const list = booksByStudent.get(b.studentId) || [];
    if (list.length < 5) list.push(b);
    booksByStudent.set(b.studentId, list);
  }

  const children = childUsers.map((child) => {
    const profile = profileMap.get(child.id);
    const reading = readMap.get(child.id);

    return {
      id: child.id,
      name: child.displayName,
      email: child.email,
      className: profile?.classId ? classMap.get(profile.classId) || null : null,
      readingStage: profile?.readingStage || 'emergent',
      currentLevel: profile?.currentLevel || 1,
      totalBooksRead: profile?.totalBooksRead || 0,
      totalStars: profile?.totalStars || 0,
      staminaBand: profile?.staminaBand || '2-5 min',
      readingStreak: streakMap.get(child.id) || 0,
      reading: {
        totalSessions: reading?.totalSessions ?? 0,
        totalMinutes: reading?.totalMinutes ?? 0,
        totalPages: reading?.totalPages ?? 0,
        uniqueBooks: reading?.uniqueBooks ?? 0,
        lastSessionAt: reading?.lastSessionAt ?? null,
      },
      storiesCreated: (battleMap.get(child.id) || 0) + (aiMap.get(child.id) || 0),
      recentBooks: (booksByStudent.get(child.id) || []).map((b) => ({
        title: b.bookTitle,
        stage: b.bookStage,
        completedAt: b.completedAt,
      })),
    };
  });

  return NextResponse.json(children);
}
