import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, assignments, books, classes, studentProfiles } from '@tiny-story-world/db';
import { eq, and, or, desc } from 'drizzle-orm';

/**
 * GET /api/assignments — List assignments
 * Teachers see assignments they created; students see assignments for their classes
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  const db = getDb();

  if (role === 'teacher' || role === 'admin') {
    // Teacher: get all assignments they created, with book info
    const result = await db
      .select({
        id: assignments.id,
        type: assignments.type,
        assignedTo: assignments.assignedTo,
        dueDate: assignments.dueDate,
        createdAt: assignments.createdAt,
        classId: assignments.classId,
        bookId: assignments.bookId,
        assignedStudentId: assignments.assignedStudentId,
        curriculumFilterEnabled: assignments.curriculumFilterEnabled,
        requiredModes: assignments.requiredModes,
        bookTitle: books.title,
        bookLanguage: books.language,
        bookStage: books.stage,
      })
      .from(assignments)
      .leftJoin(books, eq(books.id, assignments.bookId))
      .where(eq(assignments.teacherId, session.user.id))
      .orderBy(desc(assignments.createdAt));

    return NextResponse.json(result);
  }

  // Student: find their class(es), then get assignments for those classes + direct assignments
  const profiles = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, session.user.id));

  const classIds = profiles.map((p) => p.classId);

  if (classIds.length === 0) {
    // No class — only direct assignments
    const direct = await db
      .select({
        id: assignments.id,
        type: assignments.type,
        assignedTo: assignments.assignedTo,
        dueDate: assignments.dueDate,
        createdAt: assignments.createdAt,
        classId: assignments.classId,
        bookId: assignments.bookId,
        curriculumFilterEnabled: assignments.curriculumFilterEnabled,
        requiredModes: assignments.requiredModes,
        bookTitle: books.title,
        bookLanguage: books.language,
        bookStage: books.stage,
      })
      .from(assignments)
      .leftJoin(books, eq(books.id, assignments.bookId))
      .where(eq(assignments.assignedStudentId, session.user.id))
      .orderBy(desc(assignments.createdAt));

    return NextResponse.json(direct);
  }

  // Get class-level + individual assignments
  const conditions = classIds.map((cid) => eq(assignments.classId, cid));
  conditions.push(eq(assignments.assignedStudentId, session.user.id));

  const result = await db
    .select({
      id: assignments.id,
      type: assignments.type,
      assignedTo: assignments.assignedTo,
      dueDate: assignments.dueDate,
      createdAt: assignments.createdAt,
      classId: assignments.classId,
      bookId: assignments.bookId,
      curriculumFilterEnabled: assignments.curriculumFilterEnabled,
      requiredModes: assignments.requiredModes,
      bookTitle: books.title,
      bookLanguage: books.language,
      bookStage: books.stage,
    })
    .from(assignments)
    .leftJoin(books, eq(books.id, assignments.bookId))
    .where(or(...conditions))
    .orderBy(desc(assignments.createdAt));

  return NextResponse.json(result);
}

/**
 * POST /api/assignments — Create an assignment
 * Body: { classId, type, bookId?, assignedTo, assignedStudentId?, dueDate?, requiredModes?, curriculumFilterEnabled? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Only teachers can create assignments' }, { status: 403 });
  }

  const body = await req.json();
  const {
    classId,
    type,
    bookId,
    assignedTo,
    assignedStudentId,
    dueDate,
    requiredModes,
    curriculumFilterEnabled,
  } = body;

  if (!type || !assignedTo) {
    return NextResponse.json({ error: 'type and assignedTo are required' }, { status: 400 });
  }

  if (type === 'book' && !bookId) {
    return NextResponse.json({ error: 'bookId is required for book assignments' }, { status: 400 });
  }

  if (assignedTo === 'student' && !assignedStudentId) {
    return NextResponse.json({ error: 'assignedStudentId is required for individual assignments' }, { status: 400 });
  }

  if (assignedTo === 'class' && !classId) {
    return NextResponse.json({ error: 'classId is required for class assignments' }, { status: 400 });
  }

  const db = getDb();

  const [assignment] = await db
    .insert(assignments)
    .values({
      teacherId: session.user.id,
      classId: classId || null,
      type,
      bookId: bookId || null,
      assignedTo,
      assignedStudentId: assignedStudentId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      requiredModes: requiredModes || null,
      curriculumFilterEnabled: curriculumFilterEnabled ?? false,
    })
    .returning();

  return NextResponse.json(assignment, { status: 201 });
}
