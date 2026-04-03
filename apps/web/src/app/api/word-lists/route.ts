import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, curriculumWordLists, studentProfiles, classes } from '@tiny-story-world/db';
import { eq, and, or, inArray } from 'drizzle-orm';
import { autoTagWords } from '@/lib/posLookup';

/**
 * GET /api/word-lists — List word lists for the current user
 * Teachers see their own lists.
 * Students see their own lists + lists owned by their class teachers.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const role = (session.user as any).role;

  if (role === 'student') {
    // Find teacher IDs from the student's classes
    const myProfiles = await db
      .select({ classId: studentProfiles.classId })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, session.user.id));

    const teacherIds: string[] = [];
    if (myProfiles.length > 0) {
      const classIds = myProfiles.map((p) => p.classId);
      const teacherClasses = await db
        .select({ teacherId: classes.teacherId })
        .from(classes)
        .where(inArray(classes.id, classIds));
      teacherIds.push(...teacherClasses.map((c) => c.teacherId));
    }

    // Get own lists + teacher lists
    const ownerIds = [...new Set([session.user.id, ...teacherIds])];
    const lists = await db
      .select()
      .from(curriculumWordLists)
      .where(inArray(curriculumWordLists.ownerId, ownerIds));

    return NextResponse.json(lists);
  }

  // Teachers/parents/admins see their own lists
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

  // Auto-detect POS for words missing a pos field
  const taggedWords = autoTagWords(words, language);

  const db = getDb();
  const [list] = await db
    .insert(curriculumWordLists)
    .values({
      ownerId: session.user.id,
      ownerType: role === 'parent' ? 'parent' : 'teacher',
      name,
      language,
      words: taggedWords,
      scriptType: scriptType || (language === 'zh-Hans' ? 'cjk' : 'latin'),
    })
    .returning();

  return NextResponse.json(list, { status: 201 });
}
