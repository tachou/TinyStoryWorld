import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, classes, studentProfiles, users } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/classes/:id — Get class details with student list
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Get students in this class
  const students = await db
    .select({
      profileId: studentProfiles.id,
      userId: studentProfiles.userId,
      readingStage: studentProfiles.readingStage,
      currentLevel: studentProfiles.currentLevel,
      totalBooksRead: studentProfiles.totalBooksRead,
      totalStars: studentProfiles.totalStars,
      displayName: users.displayName,
      email: users.email,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(users.id, studentProfiles.userId))
    .where(eq(studentProfiles.classId, id));

  return NextResponse.json({ ...cls, students });
}

/**
 * PATCH /api/classes/:id — Update class details
 * Body: { name?, academicYear?, maxStudents? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  // Verify ownership
  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const updates: Record<string, any> = {};
  if (body.name) updates.name = body.name;
  if (body.academicYear) updates.academicYear = body.academicYear;
  if (body.maxStudents) updates.maxStudents = body.maxStudents;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const [updated] = await db
    .update(classes)
    .set(updates)
    .where(eq(classes.id, id))
    .returning();

  return NextResponse.json(updated);
}

/**
 * DELETE /api/classes/:id — Delete a class
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  // Verify ownership
  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Remove student profiles first (foreign key constraint)
  await db.delete(studentProfiles).where(eq(studentProfiles.classId, id));
  await db.delete(classes).where(eq(classes.id, id));

  return NextResponse.json({ success: true });
}
