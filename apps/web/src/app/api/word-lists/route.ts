import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, curriculumWordLists } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/word-lists — List word lists for the current user
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const lists = await db
    .select()
    .from(curriculumWordLists)
    .where(eq(curriculumWordLists.ownerId, session.user.id));

  return NextResponse.json(lists);
}

/**
 * POST /api/word-lists — Create a new word list
 * Body: { name, language, words: [{ word, pos?, phonetic? }], scriptType? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'parent' && role !== 'admin') {
    return NextResponse.json({ error: 'Only teachers and parents can create word lists' }, { status: 403 });
  }

  const body = await req.json();
  const { name, language, words, scriptType } = body;

  if (!name || !language || !Array.isArray(words) || words.length === 0) {
    return NextResponse.json({ error: 'name, language, and words are required' }, { status: 400 });
  }

  const db = getDb();
  const [list] = await db
    .insert(curriculumWordLists)
    .values({
      ownerId: session.user.id,
      ownerType: role === 'parent' ? 'parent' : 'teacher',
      name,
      language,
      words,
      scriptType: scriptType || (language === 'zh-Hans' ? 'cjk' : 'latin'),
    })
    .returning();

  return NextResponse.json(list, { status: 201 });
}
