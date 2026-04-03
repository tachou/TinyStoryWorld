import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books, bookPages } from '@tiny-story-world/db';
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
