import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, battleStories, studentProfiles, users } from '@tiny-story-world/db';
import { eq, desc, inArray, sql } from 'drizzle-orm';

/**
 * GET /api/battle-stories/feed — Classroom-scoped battle story feed
 *
 * Query params:
 *   tab: 'recent' | 'trending' | 'funniest' | 'smartest' | 'surprising' (default: recent)
 *   limit: number (default: 20)
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get('tab') || 'recent';
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);

  const db = getDb();

  // Find all classmates: get the student's classId(s), then all students in those classes
  const myProfiles = await db
    .select({ classId: studentProfiles.classId })
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, session.user.id));

  let classmateIds: string[] = [session.user.id];

  if (myProfiles.length > 0) {
    const classIds = myProfiles.map((p) => p.classId);
    const classmates = await db
      .select({ userId: studentProfiles.userId })
      .from(studentProfiles)
      .where(inArray(studentProfiles.classId, classIds));
    classmateIds = [...new Set(classmates.map((c) => c.userId))];
  }

  // Build ORDER BY based on tab
  let orderBy;
  switch (tab) {
    case 'trending':
      // Weighted score: sum of all vote categories, biased toward recency
      orderBy = sql`(
        COALESCE((${battleStories.voteCounts}->>'funniest')::int, 0) +
        COALESCE((${battleStories.voteCounts}->>'smartest')::int, 0) +
        COALESCE((${battleStories.voteCounts}->>'surprising')::int, 0) +
        COALESCE((${battleStories.voteCounts}->>'best_plan')::int, 0)
      ) DESC, ${battleStories.createdAt} DESC`;
      break;
    case 'funniest':
      orderBy = sql`COALESCE((${battleStories.voteCounts}->>'funniest')::int, 0) DESC, ${battleStories.createdAt} DESC`;
      break;
    case 'smartest':
      orderBy = sql`COALESCE((${battleStories.voteCounts}->>'smartest')::int, 0) DESC, ${battleStories.createdAt} DESC`;
      break;
    case 'surprising':
      orderBy = sql`COALESCE((${battleStories.voteCounts}->>'surprising')::int, 0) DESC, ${battleStories.createdAt} DESC`;
      break;
    default:
      orderBy = desc(battleStories.createdAt);
  }

  const stories = await db
    .select({
      id: battleStories.id,
      title: battleStories.title,
      matchup: battleStories.matchup,
      language: battleStories.language,
      voteCounts: battleStories.voteCounts,
      remixCount: battleStories.remixCount,
      parentStoryId: battleStories.parentStoryId,
      createdAt: battleStories.createdAt,
      studentId: battleStories.studentId,
      authorName: users.displayName,
    })
    .from(battleStories)
    .leftJoin(users, eq(users.id, battleStories.studentId))
    .where(
      inArray(battleStories.studentId, classmateIds)
    )
    .orderBy(orderBy)
    .limit(limit);

  return NextResponse.json(stories);
}
