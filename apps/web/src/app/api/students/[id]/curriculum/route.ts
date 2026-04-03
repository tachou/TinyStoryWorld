import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, studentCurriculumConfigs } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/students/:id/curriculum
 * Teacher/admin-only: returns the student's curriculum configs for all languages.
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

  const { id } = await params;
  const db = getDb();

  const configs = await db
    .select()
    .from(studentCurriculumConfigs)
    .where(eq(studentCurriculumConfigs.studentId, id));

  return NextResponse.json(configs);
}

/**
 * PUT /api/students/:id/curriculum
 * Teacher/admin-only: assign or remove a curriculum wordlist for a student.
 * Body: { wordlistId: string | null, language: string }
 */
export async function PUT(
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

  const { id: studentId } = await params;
  const body = await req.json();
  const { wordlistId, language } = body;

  if (!language) {
    return NextResponse.json({ error: 'language is required' }, { status: 400 });
  }

  const db = getDb();

  // If wordlistId is null, remove the assignment for this student + language
  if (wordlistId === null) {
    await db
      .delete(studentCurriculumConfigs)
      .where(
        and(
          eq(studentCurriculumConfigs.studentId, studentId),
          eq(studentCurriculumConfigs.language, language)
        )
      );

    return NextResponse.json({ success: true, message: 'Curriculum assignment removed' });
  }

  // Check if a config already exists for this student + language
  const [existing] = await db
    .select()
    .from(studentCurriculumConfigs)
    .where(
      and(
        eq(studentCurriculumConfigs.studentId, studentId),
        eq(studentCurriculumConfigs.language, language)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing config
    const [updated] = await db
      .update(studentCurriculumConfigs)
      .set({
        wordlistIds: [wordlistId],
        filterEnabled: true,
      })
      .where(eq(studentCurriculumConfigs.id, existing.id))
      .returning();

    return NextResponse.json(updated);
  }

  // Insert new config
  const [created] = await db
    .insert(studentCurriculumConfigs)
    .values({
      studentId,
      wordlistIds: [wordlistId],
      language,
      filterEnabled: true,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
