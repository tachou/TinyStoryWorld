import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, studentCurriculumConfigs, curriculumWordLists } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/curriculum/active?language=fr
 * Returns the resolved active wordlist for the current student.
 * If a teacher-assigned config exists with filterEnabled, returns that wordlist.
 * Otherwise returns null so the client can use the default pool.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const language = req.nextUrl.searchParams.get('language');
  if (!language) {
    return NextResponse.json({ error: 'language query param is required' }, { status: 400 });
  }

  const db = getDb();

  // Check for a teacher-assigned config matching this student + language with filtering enabled
  const [config] = await db
    .select()
    .from(studentCurriculumConfigs)
    .where(
      and(
        eq(studentCurriculumConfigs.studentId, session.user.id),
        eq(studentCurriculumConfigs.language, language),
        eq(studentCurriculumConfigs.filterEnabled, true)
      )
    )
    .limit(1);

  if (!config || config.wordlistIds.length === 0) {
    return NextResponse.json({
      wordlist: null,
      source: 'default',
      isLocked: false,
    });
  }

  // Fetch the first wordlist from the assigned config
  const [wordlist] = await db
    .select({
      id: curriculumWordLists.id,
      name: curriculumWordLists.name,
      language: curriculumWordLists.language,
      words: curriculumWordLists.words,
    })
    .from(curriculumWordLists)
    .where(eq(curriculumWordLists.id, config.wordlistIds[0]))
    .limit(1);

  if (!wordlist) {
    return NextResponse.json({
      wordlist: null,
      source: 'default',
      isLocked: false,
    });
  }

  return NextResponse.json({
    wordlist,
    source: 'teacher',
    isLocked: true,
  });
}
