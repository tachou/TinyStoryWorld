import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books } from '@tiny-story-world/db';
import { and, eq, or } from 'drizzle-orm';

/**
 * GET /api/books — List books (with optional language/stage filters).
 * Drafts are hidden from everyone except their creator (and admins).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const language = searchParams.get('language');
  const stage = searchParams.get('stage');

  const db = getDb();

  // Base visibility: non-drafts + creator's own drafts. Admins see everything.
  const conditions = [];
  if (role !== 'admin') {
    conditions.push(
      or(eq(books.isDraft, false), eq(books.creatorId, session.user.id))
    );
  }
  if (language) conditions.push(eq(books.language, language));
  if (stage) conditions.push(eq(books.stage, stage as any));

  const query = db.select().from(books);
  const result =
    conditions.length === 0
      ? await query
      : conditions.length === 1
      ? await query.where(conditions[0])
      : await query.where(and(...conditions));

  return NextResponse.json(result);
}
