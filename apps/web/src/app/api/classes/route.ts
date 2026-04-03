import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, classes } from '@tiny-story-world/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/classes — List classes for the current teacher
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const result = await db
    .select()
    .from(classes)
    .where(eq(classes.teacherId, session.user.id));

  return NextResponse.json(result);
}

/**
 * POST /api/classes — Create a new class
 * Body: { name, academicYear, maxStudents? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Only teachers can create classes' }, { status: 403 });
  }

  const body = await req.json();
  const { name, academicYear, maxStudents } = body;

  if (!name || !academicYear) {
    return NextResponse.json({ error: 'name and academicYear are required' }, { status: 400 });
  }

  const db = getDb();
  const [newClass] = await db
    .insert(classes)
    .values({
      teacherId: session.user.id,
      name,
      academicYear,
      maxStudents: maxStudents || 35,
    })
    .returning();

  return NextResponse.json(newClass, { status: 201 });
}
