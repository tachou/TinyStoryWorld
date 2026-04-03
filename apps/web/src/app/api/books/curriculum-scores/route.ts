import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getDb,
  books,
  bookPages,
  bookCurriculumScores,
  curriculumWordLists,
} from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/books/curriculum-scores — Compute curriculum coverage scores
 * for all books against a given word list.
 *
 * Body: { wordlistId: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { wordlistId } = await req.json();
  if (!wordlistId) {
    return NextResponse.json({ error: 'wordlistId is required' }, { status: 400 });
  }

  const db = getDb();

  // Fetch the word list
  const [wordList] = await db
    .select()
    .from(curriculumWordLists)
    .where(eq(curriculumWordLists.id, wordlistId))
    .limit(1);

  if (!wordList) {
    return NextResponse.json({ error: 'Word list not found' }, { status: 404 });
  }

  const wordEntries = wordList.words;
  const language = wordList.language;

  // Fetch all books in the same language
  const allBooks = await db
    .select({ id: books.id })
    .from(books)
    .where(eq(books.language, language));

  let computed = 0;

  for (const book of allBooks) {
    // Get book text from pages
    const pages = await db
      .select({ textContent: bookPages.textContent })
      .from(bookPages)
      .where(eq(bookPages.bookId, book.id));

    const fullText = pages.map((p) => p.textContent).join(' ').toLowerCase();

    // Calculate coverage
    let matchedCount = 0;
    const unmatchedWords: string[] = [];

    for (const entry of wordEntries) {
      const word = entry.word.toLowerCase();
      let found = false;

      if (language === 'zh-Hans') {
        found = fullText.includes(word);
      } else {
        const regex = new RegExp(
          `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i'
        );
        found = regex.test(fullText);
      }

      if (found) {
        matchedCount++;
      } else {
        unmatchedWords.push(entry.word);
      }
    }

    const coveragePct = wordEntries.length > 0
      ? Math.round((matchedCount / wordEntries.length) * 100) / 100
      : 0;

    // Upsert: delete existing score for this book+wordlist, then insert
    await db
      .delete(bookCurriculumScores)
      .where(
        and(
          eq(bookCurriculumScores.bookId, book.id),
          eq(bookCurriculumScores.wordlistId, wordlistId)
        )
      );

    await db.insert(bookCurriculumScores).values({
      bookId: book.id,
      wordlistId,
      coveragePct,
      matchedCount,
      totalCount: wordEntries.length,
      unmatchedWords,
    });

    computed++;
  }

  return NextResponse.json({
    computed,
    wordlistId,
    language,
    totalWords: wordEntries.length,
  });
}

/**
 * GET /api/books/curriculum-scores?wordlistId=xxx
 * Returns all book scores for a given word list.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const wordlistId = searchParams.get('wordlistId');

  if (!wordlistId) {
    return NextResponse.json({ error: 'wordlistId is required' }, { status: 400 });
  }

  const db = getDb();
  const scores = await db
    .select({
      bookId: bookCurriculumScores.bookId,
      coveragePct: bookCurriculumScores.coveragePct,
      matchedCount: bookCurriculumScores.matchedCount,
      totalCount: bookCurriculumScores.totalCount,
      unmatchedWords: bookCurriculumScores.unmatchedWords,
    })
    .from(bookCurriculumScores)
    .where(eq(bookCurriculumScores.wordlistId, wordlistId));

  // Return as map: { bookId: score }
  const scoreMap: Record<string, {
    coveragePct: number;
    matchedCount: number;
    totalCount: number;
    unmatchedWords: string[];
  }> = {};

  for (const s of scores) {
    scoreMap[s.bookId] = {
      coveragePct: s.coveragePct,
      matchedCount: s.matchedCount,
      totalCount: s.totalCount,
      unmatchedWords: s.unmatchedWords || [],
    };
  }

  return NextResponse.json(scoreMap);
}
