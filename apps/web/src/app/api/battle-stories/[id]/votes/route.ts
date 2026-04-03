import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, battleVotes, battleStories } from '@tiny-story-world/db';
import { eq, and, sql } from 'drizzle-orm';

const VALID_CATEGORIES = ['funniest', 'smartest', 'surprising', 'best_plan'] as const;
type VoteCategory = (typeof VALID_CATEGORIES)[number];

/**
 * POST /api/battle-stories/[id]/votes — Cast or toggle a vote
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: storyId } = await params;
  const body = await req.json();
  const { category } = body as { category: string };

  if (!VALID_CATEGORIES.includes(category as VoteCategory)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    );
  }

  const db = getDb();

  // Verify story exists
  const [story] = await db
    .select({ id: battleStories.id, studentId: battleStories.studentId })
    .from(battleStories)
    .where(eq(battleStories.id, storyId))
    .limit(1);

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // Check if user already voted this category on this story
  const [existingVote] = await db
    .select({ id: battleVotes.id })
    .from(battleVotes)
    .where(
      and(
        eq(battleVotes.voterId, session.user.id),
        eq(battleVotes.storyId, storyId),
        eq(battleVotes.category, category as VoteCategory)
      )
    )
    .limit(1);

  if (existingVote) {
    // Remove vote (toggle off)
    await db.delete(battleVotes).where(eq(battleVotes.id, existingVote.id));

    // Decrement vote count on story
    await db
      .update(battleStories)
      .set({
        voteCounts: sql`jsonb_set(
          ${battleStories.voteCounts},
          ${`{${category}}`},
          (COALESCE((${battleStories.voteCounts}->>${category})::int, 1) - 1)::text::jsonb
        )`,
      })
      .where(eq(battleStories.id, storyId));

    return NextResponse.json({ action: 'removed', category });
  }

  // Cast new vote
  await db.insert(battleVotes).values({
    voterId: session.user.id,
    storyId,
    category: category as VoteCategory,
  });

  // Increment vote count on story
  await db
    .update(battleStories)
    .set({
      voteCounts: sql`jsonb_set(
        ${battleStories.voteCounts},
        ${`{${category}}`},
        (COALESCE((${battleStories.voteCounts}->>${category})::int, 0) + 1)::text::jsonb
      )`,
    })
    .where(eq(battleStories.id, storyId));

  return NextResponse.json({ action: 'added', category }, { status: 201 });
}

/**
 * GET /api/battle-stories/[id]/votes — Get vote counts + user's votes
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: storyId } = await params;
  const db = getDb();

  // Get story vote counts
  const [story] = await db
    .select({ voteCounts: battleStories.voteCounts })
    .from(battleStories)
    .where(eq(battleStories.id, storyId))
    .limit(1);

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // Get user's votes for this story
  const userVotes = await db
    .select({ category: battleVotes.category })
    .from(battleVotes)
    .where(
      and(
        eq(battleVotes.voterId, session.user.id),
        eq(battleVotes.storyId, storyId)
      )
    );

  return NextResponse.json({
    voteCounts: story.voteCounts,
    userVotes: userVotes.map((v) => v.category),
  });
}
