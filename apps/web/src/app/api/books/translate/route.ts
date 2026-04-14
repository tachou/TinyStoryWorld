import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books, bookPages } from '@tiny-story-world/db';
import { eq, isNull, and } from 'drizzle-orm';

/**
 * POST /api/books/translate
 * Body: { bookId: string }
 * Generates English translations for pages that lack them (non-English books).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { bookId } = await req.json();
  if (!bookId) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  const db = getDb();

  // Fetch the book to check language
  const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  if (book.language === 'en') {
    return NextResponse.json({ translated: 0, reason: 'english_book' });
  }

  // Fetch pages missing translations
  const pages = await db
    .select()
    .from(bookPages)
    .where(and(eq(bookPages.bookId, bookId), isNull(bookPages.translationEn)))
    .orderBy(bookPages.pageNumber);

  if (pages.length === 0) {
    return NextResponse.json({ translated: 0, reason: 'all_translated' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length <= 10) {
    return NextResponse.json({ translated: 0, reason: 'no_api_key' });
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const langName = book.language === 'fr' ? 'French' : book.language === 'zh-Hans' ? 'Chinese' : book.language;
    const pageTexts = pages.map((p) => p.textContent);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a translator for a children's reading platform. Translate ${langName} text to natural English appropriate for young readers (ages 4-8). Return ONLY a JSON array of strings, one translation per input text. No markdown, no explanation.`,
      messages: [
        {
          role: 'user',
          content: `Translate these ${pages.length} page texts to English:\n${JSON.stringify(pageTexts)}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text in Claude response');
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const translations: string[] = JSON.parse(jsonStr);

    // Write translations back to DB
    let translated = 0;
    for (let i = 0; i < pages.length && i < translations.length; i++) {
      if (translations[i]) {
        await db
          .update(bookPages)
          .set({ translationEn: translations[i] })
          .where(eq(bookPages.id, pages[i].id));
        translated++;
      }
    }

    return NextResponse.json({ translated, total: pages.length });
  } catch (err: any) {
    console.error('Translation API error:', err);
    return NextResponse.json(
      { translated: 0, reason: 'api_error', message: err.message },
      { status: 500 }
    );
  }
}
