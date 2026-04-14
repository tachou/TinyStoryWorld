import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, curriculumWordLists } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/word-lists/:id — Update mutable fields on a word list.
 * Currently only `isPublic` is supported. Teachers/admins only.
 * Body: { isPublic: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json(
      { error: 'Only teachers and admins can update word list visibility' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.isPublic !== 'boolean') {
    return NextResponse.json(
      { error: 'Body must be { isPublic: boolean }' },
      { status: 400 }
    );
  }

  const db = getDb();

  // Verify ownership (admins can update anything; teachers only their own)
  const [list] = await db
    .select()
    .from(curriculumWordLists)
    .where(eq(curriculumWordLists.id, id))
    .limit(1);

  if (!list) {
    return NextResponse.json({ error: 'Word list not found' }, { status: 404 });
  }

  if (role !== 'admin' && list.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: 'You do not own this word list' },
      { status: 403 }
    );
  }

  const [updated] = await db
    .update(curriculumWordLists)
    .set({ isPublic: body.isPublic, updatedAt: new Date() })
    .where(eq(curriculumWordLists.id, id))
    .returning();

  return NextResponse.json(updated);
}

/**
 * DELETE /api/word-lists/:id — Delete a word list
 * Only the owner (teacher/parent/admin) can delete their own list.
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
  const [list] = await db
    .select()
    .from(curriculumWordLists)
    .where(
      and(
        eq(curriculumWordLists.id, id),
        eq(curriculumWordLists.ownerId, session.user.id)
      )
    )
    .limit(1);

  if (!list) {
    return NextResponse.json({ error: 'Word list not found or not owned by you' }, { status: 404 });
  }

  await db.delete(curriculumWordLists).where(eq(curriculumWordLists.id, id));

  return NextResponse.json({ deleted: true });
}
