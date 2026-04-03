import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, generatedStories } from '@tiny-story-world/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/stories/[id] — Fetch a single generated story
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const [story] = await db
    .select()
    .from(generatedStories)
    .where(eq(generatedStories.id, id))
    .limit(1);

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  return NextResponse.json(story);
}
