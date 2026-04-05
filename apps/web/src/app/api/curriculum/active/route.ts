import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, studentCurriculumConfigs, curriculumWordLists, classCurriculumConfigs, studentProfiles } from '@tiny-story-world/db';
import { eq, and, inArray } from 'drizzle-orm';

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

  if (config && config.wordlistIds.length > 0) {
    // Student-level assignment takes priority
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

    if (wordlist) {
      return NextResponse.json({
        wordlist,
        source: 'teacher',
        isLocked: true,
      });
    }
  }

  // Fallback: check class-level word lists
  // Find the student's class(es)
  const profiles = await db
    .select({ classId: studentProfiles.classId })
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, session.user.id));

  if (profiles.length > 0) {
    const classIds = profiles.map((p) => p.classId);

    // Get all class curriculum configs for the student's classes
    const classConfigs = await db
      .select({ wordlistId: classCurriculumConfigs.wordlistId })
      .from(classCurriculumConfigs)
      .where(inArray(classCurriculumConfigs.classId, classIds));

    if (classConfigs.length > 0) {
      const wordlistIds = classConfigs.map((c) => c.wordlistId);

      // Fetch all word lists and filter by language
      const wordlists = await db
        .select({
          id: curriculumWordLists.id,
          name: curriculumWordLists.name,
          language: curriculumWordLists.language,
          words: curriculumWordLists.words,
        })
        .from(curriculumWordLists)
        .where(
          and(
            inArray(curriculumWordLists.id, wordlistIds),
            eq(curriculumWordLists.language, language)
          )
        );

      if (wordlists.length > 0) {
        // Merge all word lists into a combined set
        const allWords: Array<{ word: string; pos?: string; phonetic?: string }> = [];
        const seen = new Set<string>();

        for (const wl of wordlists) {
          for (const w of wl.words) {
            const key = w.word.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              allWords.push(w);
            }
          }
        }

        const listNames = wordlists.map((wl) => wl.name).join(' + ');
        return NextResponse.json({
          wordlist: {
            id: wordlists[0].id, // Use first list ID as reference
            name: `${listNames} (${allWords.length} words)`,
            language,
            words: allWords,
          },
          source: 'class',
          isLocked: true,
        });
      }
    }
  }

  return NextResponse.json({
    wordlist: null,
    source: 'default',
    isLocked: false,
  });
}
