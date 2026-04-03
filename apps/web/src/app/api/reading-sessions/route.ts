import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, readingSessions, books } from '@tiny-story-world/db';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/reading-sessions — Get reading history for the current student
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const result = await db
    .select({
      id: readingSessions.id,
      bookId: readingSessions.bookId,
      mode: readingSessions.mode,
      startedAt: readingSessions.startedAt,
      completedAt: readingSessions.completedAt,
      durationSeconds: readingSessions.durationSeconds,
      pagesRead: readingSessions.pagesRead,
      bookTitle: books.title,
    })
    .from(readingSessions)
    .leftJoin(books, eq(books.id, readingSessions.bookId))
    .where(eq(readingSessions.studentId, session.user.id))
    .orderBy(desc(readingSessions.startedAt))
    .limit(20);

  return NextResponse.json(result);
}

/**
 * POST /api/reading-sessions — Log a reading session
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { bookId, pagesRead, durationSeconds, mode } = body;

  if (!bookId) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  const db = getDb();
  const [record] = await db
    .insert(readingSessions)
    .values({
      studentId: session.user.id,
      bookId,
      pagesRead: pagesRead ?? 0,
      durationSeconds: durationSeconds ?? 0,
      mode: mode ?? 'read',
      completedAt: new Date(),
    })
    .returning();

  return NextResponse.json(record, { status: 201 });
}
