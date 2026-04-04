import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books, bookPages, bookCurriculumScores } from '@tiny-story-world/db';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/books/:id — Get book with all pages
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

  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);
  if (!book) {
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

  // Delete related records first (pages, curriculum scores)
  await db.delete(bookPages).where(eq(bookPages.bookId, id));
  await db.delete(bookCurriculumScores).where(eq(bookCurriculumScores.bookId, id));
  await db.delete(books).where(eq(books.id, id));

  return NextResponse.json({ deleted: true, title: book.title });
}
