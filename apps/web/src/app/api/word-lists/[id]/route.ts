import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, curriculumWordLists } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';

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
