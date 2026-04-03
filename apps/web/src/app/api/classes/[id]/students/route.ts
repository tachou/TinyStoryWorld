import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, classes, studentProfiles, users } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/classes/:id/students — Add a student to the class
 * Body: { email } — looks up the student user by email
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: classId } = await params;
  const body = await req.json();
  const { email, readingStage } = body;

  if (!email) {
    return NextResponse.json({ error: 'Student email is required' }, { status: 400 });
  }

  const db = getDb();

  // Verify teacher owns this class
  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Find the student user
  const [student] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!student) {
    return NextResponse.json({ error: 'No user found with that email' }, { status: 404 });
  }

  if (student.role !== 'student') {
    return NextResponse.json({ error: 'User is not a student' }, { status: 400 });
  }

  // Check if student is already in this class
  const [existing] = await db
    .select()
    .from(studentProfiles)
    .where(and(
      eq(studentProfiles.userId, student.id),
      eq(studentProfiles.classId, classId)
    ))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: 'Student is already in this class' }, { status: 409 });
  }

  // Check class capacity
  const currentStudents = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.classId, classId));

  if (currentStudents.length >= cls.maxStudents) {
    return NextResponse.json({ error: 'Class is full' }, { status: 400 });
  }

  // Create student profile
  const [profile] = await db
    .insert(studentProfiles)
    .values({
      userId: student.id,
      classId,
      readingStage: readingStage || 'emergent',
    })
    .returning();

  return NextResponse.json({
    ...profile,
    displayName: student.displayName,
    email: student.email,
  }, { status: 201 });
}

/**
 * DELETE /api/classes/:id/students — Remove a student from the class
 * Body: { studentProfileId }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: classId } = await params;
  const body = await req.json();
  const { studentProfileId } = body;

  if (!studentProfileId) {
    return NextResponse.json({ error: 'studentProfileId is required' }, { status: 400 });
  }

  const db = getDb();

  // Verify teacher owns this class
  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  await db
    .delete(studentProfiles)
    .where(and(
      eq(studentProfiles.id, studentProfileId),
      eq(studentProfiles.classId, classId)
    ));

  return NextResponse.json({ success: true });
}
