import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books, bookPages } from '@tiny-story-world/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/books — List all books (with optional language/stage filters)
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const language = searchParams.get('language');
  const stage = searchParams.get('stage');

  const db = getDb();
  let query = db.select().from(books);

  // Apply filters if provided
  const conditions = [];
  if (language) conditions.push(eq(books.language, language));
  if (stage) conditions.push(eq(books.stage, stage as any));

  let result;
  if (conditions.length === 1) {
    result = await query.where(conditions[0]);
  } else if (conditions.length === 2) {
    const { and } = await import('drizzle-orm');
    result = await query.where(and(conditions[0], conditions[1]));
  } else {
    result = await query;
  }

  return NextResponse.json(result);
}
