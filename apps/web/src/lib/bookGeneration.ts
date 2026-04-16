/**
 * Leveled-reader book generation helpers.
 * Shared by `/api/books/generate` (batch) and `/api/books/[id]/regenerate`.
 */

import {
  getDb,
  books,
  bookPages,
  bookCurriculumScores,
  curriculumWordLists,
} from '@tiny-story-world/db';
import { and, eq } from 'drizzle-orm';

export type ReadingLevel =
  | 'emergent'
  | 'beginner'
  | 'in_transition'
  | 'competent'
  | 'experienced';

interface LevelTarget {
  pageCount: number;
  wordsPerPageMin: number;
  wordsPerPageMax: number;
  uniqueWordMin: number;
  uniqueWordMax: number;
}

/** Level → page/word targets (see docs/prd-book-generation.md §7) */
export const LEVEL_TARGETS: Record<ReadingLevel, LevelTarget> = {
  emergent: { pageCount: 6, wordsPerPageMin: 3, wordsPerPageMax: 6, uniqueWordMin: 20, uniqueWordMax: 35 },
  beginner: { pageCount: 8, wordsPerPageMin: 8, wordsPerPageMax: 15, uniqueWordMin: 50, uniqueWordMax: 80 },
  in_transition: { pageCount: 10, wordsPerPageMin: 15, wordsPerPageMax: 25, uniqueWordMin: 100, uniqueWordMax: 150 },
  competent: { pageCount: 12, wordsPerPageMin: 25, wordsPerPageMax: 40, uniqueWordMin: 180, uniqueWordMax: 250 },
  experienced: { pageCount: 14, wordsPerPageMin: 40, wordsPerPageMax: 60, uniqueWordMin: 300, uniqueWordMax: 400 },
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'French',
  'zh-Hans': 'Simplified Chinese',
};

export interface GeneratedPage {
  pageNumber: number;
  textContent: string;
  vocabWords?: string[];
}

export interface GeneratedBook {
  title: string;
  themes: string[];
  pages: GeneratedPage[];
}

// ─── Text helpers ────────────────────────────────────────────────────────

/** Extract unique words from a collection of page texts. Mirrors bulk import. */
export function extractWordInventory(pagesText: string[], language: string): string[] {
  const allText = pagesText.join(' ');
  let words: string[];

  if (language === 'zh-Hans') {
    words = allText
      .replace(/[，。！？、；：""''（）《》\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  } else {
    words = allText
      .toLowerCase()
      .replace(/[.,!?;:'"()\-\u2014\u2013\u00ab\u00bb]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }

  return [...new Set(words)];
}

// ─── Prompt building ─────────────────────────────────────────────────────

export interface BuildPromptArgs {
  language: string;
  level: ReadingLevel;
  wordList: Array<{ word: string; pos?: string }>;
  emphasizedWords: string[];
  avoidTitles: string[];
}

export function buildLeveledReaderPrompt(args: BuildPromptArgs): string {
  const { language, level, wordList, emphasizedWords, avoidTitles } = args;
  const target = LEVEL_TARGETS[level];
  const langLabel = LANGUAGE_LABELS[language] || language;

  const wordsForPrompt = wordList.map((w) => w.word).slice(0, 150); // cap for token budget

  return [
    `You are an expert children's literacy author writing a level-${level} leveled reader in ${langLabel} for the Tiny Story World platform.`,
    '',
    'Return STRICT JSON only — no markdown, no commentary — with this exact shape:',
    '{',
    '  "title": "string",',
    '  "themes": ["string", ...],',
    '  "pages": [{ "pageNumber": 1, "textContent": "string", "vocabWords": ["string"] }, ...]',
    '}',
    '',
    'Constraints:',
    `- Exactly ${target.pageCount} pages, numbered 1..${target.pageCount}.`,
    `- Each page: ${target.wordsPerPageMin}-${target.wordsPerPageMax} words.`,
    `- Target ${target.uniqueWordMin}-${target.uniqueWordMax} unique words across the whole book.`,
    `- Use words from this curriculum list wherever natural: ${JSON.stringify(wordsForPrompt)}.`,
    emphasizedWords.length > 0
      ? `- These words/phrases MUST appear at least once (preferably repeated): ${JSON.stringify(emphasizedWords)}.`
      : '- No specific words are required — pick naturally from the curriculum list.',
    level === 'emergent' || level === 'beginner'
      ? '- Use predictable, repetitive sentence patterns (2-3 sentence stems repeated).'
      : '- Sentences should increase in complexity across the book.',
    '- Structure: beginning -> small problem -> resolution. Age-appropriate, warm tone.',
    '- No dialogue tags beyond "said".',
    '- No lists, no meta-commentary, no facts blurbs.',
    '- `vocabWords` on each page = up to 3 content words from that page that appear in the curriculum list.',
    avoidTitles.length > 0
      ? `- Your title MUST be different from these already-generated sibling titles in this batch: ${JSON.stringify(avoidTitles)}.`
      : '',
    '',
    'Return JSON only, no code fences.',
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── Mock generator (dev-only) ────────────────────────────────────────────

/**
 * Build a canned leveled-reader book without calling Claude. Used when
 * MOCK_LLM=1 is set in the environment — lets us exercise the SSE stream,
 * DB writes, coverage scoring, and UI end-to-end without burning tokens.
 */
function buildMockBook(args: BuildPromptArgs): GeneratedBook {
  const target = LEVEL_TARGETS[args.level];
  const wordPool = args.wordList.map((w) => w.word).filter(Boolean);
  const emphasis = args.emphasizedWords.filter(Boolean);
  const hasEmphasis = emphasis.length > 0;

  // Pick a deterministic-ish title seeded by avoidTitles count + pool.
  const titleSeed = args.avoidTitles.length;
  const pool = [...emphasis, ...wordPool];
  const pickTitleWord = (offset: number) => pool[(titleSeed + offset) % Math.max(pool.length, 1)] || 'Story';
  const candidates = [
    `The Little ${pickTitleWord(0)}`,
    `A ${pickTitleWord(1)} Tale`,
    `${pickTitleWord(0)} and ${pickTitleWord(2)}`,
    `The ${pickTitleWord(1)} Adventure`,
    `My ${pickTitleWord(0)}`,
    `Finding the ${pickTitleWord(2)}`,
  ];
  const title = candidates.find((t) => !args.avoidTitles.includes(t)) || `Mock Story ${titleSeed + 1}`;

  // Build pages. For Chinese we join without spaces; for Latin we join with spaces.
  const joiner = args.language === 'zh-Hans' ? '' : ' ';

  const pages: GeneratedPage[] = [];
  const wordsPerPage = Math.max(target.wordsPerPageMin, Math.ceil((target.wordsPerPageMin + target.wordsPerPageMax) / 2));
  let cursor = 0;
  for (let i = 0; i < target.pageCount; i++) {
    const tokens: string[] = [];
    // First word of each page cycles through emphasized words (when present).
    if (hasEmphasis) tokens.push(emphasis[i % emphasis.length]);
    while (tokens.length < wordsPerPage) {
      const w = wordPool[cursor % Math.max(wordPool.length, 1)] || 'the';
      tokens.push(w);
      cursor++;
    }
    const text =
      args.language === 'zh-Hans'
        ? tokens.join(joiner) + '。'
        : tokens.join(joiner).replace(/^./, (c) => c.toUpperCase()) + '.';
    pages.push({
      pageNumber: i + 1,
      textContent: text,
      vocabWords: tokens.slice(0, 3),
    });
  }

  return {
    title,
    themes: hasEmphasis ? ['mock', ...emphasis.slice(0, 2)] : ['mock'],
    pages,
  };
}

/** Returns true when the runtime should return a canned book instead of calling Claude. */
function isMockMode(): boolean {
  const v = (process.env.MOCK_LLM || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

// ─── Claude call ─────────────────────────────────────────────────────────

/**
 * Call Claude once to generate a single leveled-reader book as JSON.
 * Throws on API error or unparseable response.
 *
 * If MOCK_LLM=1 is set, returns a canned book instead (no network call).
 */
export async function callClaudeForBook(args: BuildPromptArgs): Promise<GeneratedBook> {
  if (isMockMode()) {
    // Small artificial delay so the SSE stream still shows a writing phase.
    await new Promise((r) => setTimeout(r, 600));
    return buildMockBook(args);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const prompt = buildLeveledReaderPrompt(args);

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const target = LEVEL_TARGETS[args.level];
  // Give generous room: ~6 tokens/word + JSON overhead, bounded.
  const maxTokens = Math.min(8000, 1500 + target.pageCount * target.wordsPerPageMax * 6);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text block');
  }

  // Strip possible code fences just in case
  const raw = textBlock.text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: GeneratedBook;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Claude returned unparseable JSON: ${(err as Error).message}. First 200 chars: ${raw.slice(0, 200)}`
    );
  }

  if (
    !parsed.title ||
    !Array.isArray(parsed.pages) ||
    parsed.pages.length === 0
  ) {
    throw new Error('Claude response missing title or pages');
  }

  // Normalize page numbers
  parsed.pages = parsed.pages
    .sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0))
    .map((p, i) => ({
      pageNumber: i + 1,
      textContent: String(p.textContent || '').trim(),
      vocabWords: Array.isArray(p.vocabWords) ? p.vocabWords.slice(0, 10) : [],
    }))
    .filter((p) => p.textContent.length > 0);

  if (parsed.pages.length === 0) {
    throw new Error('Claude returned no usable pages');
  }

  return parsed;
}

// ─── Coverage scoring ─────────────────────────────────────────────────────

/**
 * Compute + upsert curriculum coverage score for a single (book, wordlist) pair.
 * Mirrors the logic in /api/books/curriculum-scores for consistency.
 */
export async function recomputeCoverageScore(bookId: string, wordlistId: string) {
  const db = getDb();

  const [wl] = await db
    .select()
    .from(curriculumWordLists)
    .where(eq(curriculumWordLists.id, wordlistId))
    .limit(1);
  if (!wl) return;

  const pages = await db
    .select({ textContent: bookPages.textContent })
    .from(bookPages)
    .where(eq(bookPages.bookId, bookId));

  const fullText = pages.map((p) => p.textContent).join(' ').toLowerCase();

  const wordEntries = wl.words;
  const language = wl.language;
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
    if (found) matchedCount++;
    else unmatchedWords.push(entry.word);
  }

  const coveragePct =
    wordEntries.length > 0
      ? Math.round((matchedCount / wordEntries.length) * 100) / 100
      : 0;

  await db
    .delete(bookCurriculumScores)
    .where(eq(bookCurriculumScores.bookId, bookId));

  await db.insert(bookCurriculumScores).values({
    bookId,
    wordlistId,
    coveragePct,
    matchedCount,
    totalCount: wordEntries.length,
    unmatchedWords,
  });
}

// ─── Duplicate-batch check ────────────────────────────────────────────────

/**
 * Normalize emphasized-words for duplicate comparison: lowercase + sorted.
 * So `["Cat","Dog"]` and `["dog","cat"]` collide as the same batch.
 */
export function normalizeEmphasized(words: string[]): string[] {
  return [...new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean))].sort();
}

/**
 * Find existing books by this teacher matching (wordlistId, level, emphasizedWords).
 * Used to warn about duplicate batches. Comparison:
 *   - wordlistId exact
 *   - stage exact
 *   - creatorId == teacherId
 *   - emphasizedWords[]: we don't store this on books, so we compare against
 *     wordInventory overlap — any book whose inventory contains ALL the
 *     emphasized words counts as a match. Empty emphasized list matches any
 *     book with the same (wordlist, level, creator).
 *
 * Returns up to 5 most recent matches.
 */
export async function findDuplicateBatch(args: {
  teacherId: string;
  wordlistId: string;
  level: ReadingLevel;
  emphasizedWords: string[];
}): Promise<Array<{ id: string; title: string; createdAt: Date; isDraft: boolean }>> {
  const db = getDb();
  const emphasizedNormalized = normalizeEmphasized(args.emphasizedWords);

  const candidates = await db
    .select({
      id: books.id,
      title: books.title,
      createdAt: books.createdAt,
      isDraft: books.isDraft,
      wordInventory: books.wordInventory,
    })
    .from(books)
    .where(
      and(
        eq(books.creatorId, args.teacherId),
        eq(books.sourceWordlistId, args.wordlistId),
        eq(books.stage, args.level as any)
      )
    );

  const matches = candidates.filter((b) => {
    if (emphasizedNormalized.length === 0) return true;
    const inventory = new Set(
      (b.wordInventory || []).map((w) => w.toLowerCase())
    );
    return emphasizedNormalized.every((w) => inventory.has(w));
  });

  matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return matches.slice(0, 5).map((m) => ({
    id: m.id,
    title: m.title,
    createdAt: m.createdAt,
    isDraft: m.isDraft,
  }));
}

// ─── Persist generated book ───────────────────────────────────────────────

export interface SaveGeneratedBookArgs {
  generated: GeneratedBook;
  language: string;
  level: ReadingLevel;
  creatorId: string;
  sourceWordlistId: string;
}

/**
 * Insert a new draft book + its pages. Returns the book row.
 */
export async function saveGeneratedBook(args: SaveGeneratedBookArgs) {
  const { generated, language, level, creatorId, sourceWordlistId } = args;
  const db = getDb();

  const pagesText = generated.pages.map((p) => p.textContent);
  const wordInventory = extractWordInventory(pagesText, language);
  const pageCount = generated.pages.length;

  const [book] = await db
    .insert(books)
    .values({
      title: generated.title.trim().slice(0, 200),
      language,
      scriptType: language === 'zh-Hans' ? 'cjk' : 'latin',
      stage: level as any,
      description: null,
      genre: 'fiction',
      themes: generated.themes || [],
      pageCount,
      estReadingMinutes: Math.max(1, Math.ceil(pageCount * 0.7)),
      wordInventory,
      uniqueWordCount: wordInventory.length,
      creatorId,
      isDraft: true,
      sourceWordlistId,
    })
    .returning();

  await db.insert(bookPages).values(
    generated.pages.map((p) => ({
      bookId: book.id,
      pageNumber: p.pageNumber,
      textContent: p.textContent,
      vocabWords: p.vocabWords || [],
    }))
  );

  // Populate curriculum coverage score so the draft card shows % immediately.
  try {
    await recomputeCoverageScore(book.id, sourceWordlistId);
  } catch (err) {
    // Scoring failure shouldn't block the book save.
    console.error('Failed to compute coverage score', err);
  }

  return book;
}

// ─── Replace pages (regenerate) ───────────────────────────────────────────

/**
 * Replace an existing book's pages + refresh derived fields in place.
 * Only valid for drafts. Does NOT change creatorId / sourceWordlistId.
 */
export async function replaceBookContent(
  bookId: string,
  generated: GeneratedBook,
  language: string,
  sourceWordlistId: string
) {
  const db = getDb();

  const pagesText = generated.pages.map((p) => p.textContent);
  const wordInventory = extractWordInventory(pagesText, language);
  const pageCount = generated.pages.length;

  // Wipe old pages
  await db.delete(bookPages).where(eq(bookPages.bookId, bookId));

  // Update the book metadata
  await db
    .update(books)
    .set({
      title: generated.title.trim().slice(0, 200),
      themes: generated.themes || [],
      pageCount,
      estReadingMinutes: Math.max(1, Math.ceil(pageCount * 0.7)),
      wordInventory,
      uniqueWordCount: wordInventory.length,
    })
    .where(eq(books.id, bookId));

  // Insert new pages
  await db.insert(bookPages).values(
    generated.pages.map((p) => ({
      bookId,
      pageNumber: p.pageNumber,
      textContent: p.textContent,
      vocabWords: p.vocabWords || [],
    }))
  );

  try {
    await recomputeCoverageScore(bookId, sourceWordlistId);
  } catch (err) {
    console.error('Failed to recompute coverage score', err);
  }
}
