import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, classCurriculumConfigs, curriculumWordLists, classes } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/classes/:id/curriculum
 * Returns all word lists assigned to this class.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: classId } = await params;
  const db = getDb();

  // Get all configs for this class, joined with word list details
  const configs = await db
    .select({
      configId: classCurriculumConfigs.id,
      wordlistId: classCurriculumConfigs.wordlistId,
      addedAt: classCurriculumConfigs.addedAt,
      name: curriculumWordLists.name,
      language: curriculumWordLists.language,
      words: curriculumWordLists.words,
    })
    .from(classCurriculumConfigs)
    .innerJoin(curriculumWordLists, eq(classCurriculumConfigs.wordlistId, curriculumWordLists.id))
    .where(eq(classCurriculumConfigs.classId, classId));

  return NextResponse.json(configs);
}

/**
 * POST /api/classes/:id/curriculum
 * Add a word list to this class.
 * Body: { wordlistId: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: classId } = await params;
  const body = await req.json();
  const { wordlistId } = body;

  if (!wordlistId) {
    return NextResponse.json({ error: 'wordlistId is required' }, { status: 400 });
  }

  const db = getDb();

  // Verify the class belongs to this teacher
  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: 'Class not found or not owned by you' }, { status: 404 });
  }

  // Check for duplicate
  const [existing] = await db
    .select()
    .from(classCurriculumConfigs)
    .where(
      and(
        eq(classCurriculumConfigs.classId, classId),
        eq(classCurriculumConfigs.wordlistId, wordlistId)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: 'This word list is already assigned to the class' }, { status: 409 });
  }

  const [created] = await db
    .insert(classCurriculumConfigs)
    .values({ classId, wordlistId })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

/**
 * DELETE /api/classes/:id/curriculum
 * Remove a word list from this class.
 * Body: { wordlistId: string }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: classId } = await params;
  const body = await req.json();
  const { wordlistId } = body;

  if (!wordlistId) {
    return NextResponse.json({ error: 'wordlistId is required' }, { status: 400 });
  }

  const db = getDb();

  await db
    .delete(classCurriculumConfigs)
    .where(
      and(
        eq(classCurriculumConfigs.classId, classId),
        eq(classCurriculumConfigs.wordlistId, wordlistId)
      )
    );

  return NextResponse.json({ deleted: true });
}
