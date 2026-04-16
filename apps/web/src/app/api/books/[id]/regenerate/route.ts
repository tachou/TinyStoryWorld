import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books, curriculumWordLists } from '@tiny-story-world/db';
import { eq } from 'drizzle-orm';
import {
  callClaudeForBook,
  replaceBookContent,
  type ReadingLevel,
} from '@/lib/bookGeneration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/books/:id/regenerate — Re-run Claude on the same parameters,
 * replacing an existing draft's title/themes/pages in place.
 *
 * Only valid for drafts owned by the caller (or admin).
 *
 * Body (all optional):
 *   { emphasizedWords?: string[] }  — defaults to []
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json(
      { error: 'Only teachers and admins can regenerate books' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const db = getDb();

  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  if (!book.isDraft) {
    return NextResponse.json(
      { error: 'Only drafts can be regenerated — unpublish first' },
      { status: 400 }
    );
  }

  if (role !== 'admin' && book.creatorId !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only regenerate your own drafts' },
      { status: 403 }
    );
  }

  if (!book.sourceWordlistId) {
    return NextResponse.json(
      { error: 'This book has no source word list; regenerate is unavailable' },
      { status: 400 }
    );
  }

  const [wordList] = await db
    .select()
    .from(curriculumWordLists)
    .where(eq(curriculumWordLists.id, book.sourceWordlistId))
    .limit(1);

  if (!wordList) {
    return NextResponse.json(
      { error: 'Source word list is gone; cannot regenerate' },
      { status: 400 }
    );
  }

  let emphasizedWords: string[] = [];
  try {
    const body = await req.json();
    if (body && Array.isArray(body.emphasizedWords)) {
      emphasizedWords = body.emphasizedWords.filter(
        (w: unknown) => typeof w === 'string'
      );
    }
  } catch {
    // No body / invalid JSON — treat as no emphasis.
  }

  const wordListArr = (wordList.words || []).map((w: any) => ({
    word: w.word,
    pos: w.pos,
  }));

  try {
    const generated = await callClaudeForBook({
      language: wordList.language,
      level: book.stage as ReadingLevel,
      wordList: wordListArr,
      emphasizedWords,
      // Avoid the current title so we get a genuinely different story
      avoidTitles: [book.title],
    });

    await replaceBookContent(
      book.id,
      generated,
      wordList.language,
      book.sourceWordlistId
    );

    const [updated] = await db.select().from(books).where(eq(books.id, id)).limit(1);
    return NextResponse.json({ ok: true, book: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Regeneration failed';
    console.error('[regenerate] failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
