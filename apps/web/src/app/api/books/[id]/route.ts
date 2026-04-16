import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books, bookPages, bookCurriculumScores } from '@tiny-story-world/db';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/books/:id — Get book with all pages.
 * Drafts are only visible to their creator (or admin).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const role = (session.user as any).role;

  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  if (book.isDraft && role !== 'admin' && book.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const pages = await db
    .select()
    .from(bookPages)
    .where(eq(bookPages.bookId, id))
    .orderBy(asc(bookPages.pageNumber));

  return NextResponse.json({ ...book, pages });
}

/**
 * PATCH /api/books/:id — Update mutable fields on a book.
 * Currently only `isDraft` is supported (teacher/admin, creator-owned).
 * Body: { isDraft: boolean }
 */
export async function PATCH(
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
      { error: 'Only teachers and admins can update books' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.isDraft !== 'boolean') {
    return NextResponse.json(
      { error: 'Body must be { isDraft: boolean }' },
      { status: 400 }
    );
  }

  const db = getDb();

  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  if (role !== 'admin' && book.creatorId !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only update books you created' },
      { status: 403 }
    );
  }

  const [updated] = await db
    .update(books)
    .set({ isDraft: body.isDraft })
    .where(eq(books.id, id))
    .returning();

  return NextResponse.json(updated);
}

/**
 * DELETE /api/books/:id — Delete a book and its pages
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Only teachers and admins can delete books' }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();

  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // Drafts can only be deleted by their creator (or admin)
  if (book.isDraft && role !== 'admin' && book.creatorId !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only delete drafts you created' },
      { status: 403 }
    );
  }

  // Delete related records first (pages, curriculum scores)
  await db.delete(bookPages).where(eq(bookPages.bookId, id));
  await db.delete(bookCurriculumScores).where(eq(bookCurriculumScores.bookId, id));
  await db.delete(books).where(eq(books.id, id));

  return NextResponse.json({ deleted: true, title: book.title });
}
