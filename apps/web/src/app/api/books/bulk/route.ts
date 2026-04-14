import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books, bookPages } from '@tiny-story-world/db';

const VALID_LANGUAGES = ['en', 'fr', 'zh-Hans'];
const VALID_STAGES = ['emergent', 'beginner', 'in_transition', 'competent', 'experienced'];
const MAX_BOOKS_PER_REQUEST = 50;

interface PageInput {
  text: string;
  translationEn?: string;
}

interface BookInput {
  title: string;
  language: string;
  stage: string;
  description?: string;
  genre?: string;
  themes?: string[];
  estReadingMinutes?: number;
  isBenchmark?: boolean;
  hasPinyin?: boolean;
  hasZhuyin?: boolean;
  hasRomaja?: boolean;
  scriptType?: string;
  pages: PageInput[];
}

function extractWordInventory(pagesText: string[], language: string): string[] {
  const allText = pagesText.join(' ');
  let words: string[];

  if (language === 'zh-Hans') {
    // For Chinese, split into individual characters/words (no whitespace splitting)
    words = allText.replace(/[，。！？、；：""''（）《》\s]/g, ' ').split(/\s+/).filter(Boolean);
  } else {
    // For Latin scripts, split on whitespace and strip punctuation
    words = allText
      .toLowerCase()
      .replace(/[.,!?;:'"()\-\u2014\u2013\u00ab\u00bb]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }

  return [...new Set(words)];
}

function validateBook(book: any, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Book #${index + 1}`;

  if (!book.title || typeof book.title !== 'string' || !book.title.trim()) {
    errors.push(`${prefix}: title is required`);
  }
  if (!book.language || !VALID_LANGUAGES.includes(book.language)) {
    errors.push(`${prefix}: language must be one of ${VALID_LANGUAGES.join(', ')}`);
  }
  if (!book.stage || !VALID_STAGES.includes(book.stage)) {
    errors.push(`${prefix}: stage must be one of ${VALID_STAGES.join(', ')}`);
  }
  if (!Array.isArray(book.pages) || book.pages.length === 0) {
    errors.push(`${prefix}: pages must be a non-empty array`);
  } else {
    book.pages.forEach((page: any, pi: number) => {
      if (!page.text || typeof page.text !== 'string' || !page.text.trim()) {
        errors.push(`${prefix}, Page ${pi + 1}: text is required`);
      }
    });
  }

  return errors;
}

/**
 * POST /api/books/bulk — Bulk import books
 * Body: { books: BookInput[] }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Only teachers and admins can import books' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const bookList: BookInput[] = body.books;
  if (!Array.isArray(bookList) || bookList.length === 0) {
    return NextResponse.json({ error: 'books must be a non-empty array' }, { status: 400 });
  }
  if (bookList.length > MAX_BOOKS_PER_REQUEST) {
    return NextResponse.json({ error: `Maximum ${MAX_BOOKS_PER_REQUEST} books per request` }, { status: 400 });
  }

  // Validate all books first
  const allErrors: string[] = [];
  bookList.forEach((book, i) => {
    allErrors.push(...validateBook(book, i));
  });

  if (allErrors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: allErrors }, { status: 400 });
  }

  const db = getDb();
  const imported: { id: string; title: string }[] = [];

  try {
    // Use a transaction for atomicity
    await db.transaction(async (tx) => {
      for (const bookInput of bookList) {
        const pagesText = bookInput.pages.map((p) => p.text);
        const wordInventory = extractWordInventory(pagesText, bookInput.language);

        const [newBook] = await tx
          .insert(books)
          .values({
            title: bookInput.title.trim(),
            language: bookInput.language,
            stage: bookInput.stage as any,
            description: bookInput.description || null,
            genre: bookInput.genre || 'fiction',
            themes: bookInput.themes || [],
            pageCount: bookInput.pages.length,
            estReadingMinutes: bookInput.estReadingMinutes || Math.max(1, Math.ceil(bookInput.pages.length * 0.7)),
            wordInventory,
            uniqueWordCount: wordInventory.length,
            scriptType: bookInput.scriptType || (bookInput.language === 'zh-Hans' ? 'cjk' : 'latin'),
            isBenchmark: bookInput.isBenchmark || false,
            hasPinyin: bookInput.hasPinyin || false,
            hasZhuyin: bookInput.hasZhuyin || false,
            hasRomaja: bookInput.hasRomaja || false,
          })
          .returning();

        await tx.insert(bookPages).values(
          bookInput.pages.map((page, idx) => ({
            bookId: newBook.id,
            pageNumber: idx + 1,
            textContent: page.text.trim(),
            translationEn: page.translationEn?.trim() || null,
          }))
        );

        imported.push({ id: newBook.id, title: newBook.title });
      }
    });

    return NextResponse.json({ imported: imported.length, books: imported }, { status: 201 });
  } catch (err: any) {
    console.error('Bulk import failed:', err);
    return NextResponse.json({ error: 'Import failed', message: err.message }, { status: 500 });
  }
}
