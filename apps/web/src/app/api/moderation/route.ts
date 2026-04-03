import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, battleStories, generatedStories, users } from '@tiny-story-world/db';
import { eq, sql, and, or, desc, inArray } from 'drizzle-orm';

/**
 * GET /api/moderation — List content pending review (teacher/admin only)
 * Query params: type=battle|ai|all, status=pending|approved|rejected
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || 'pending';

  const db = getDb();
  const items: any[] = [];

  // Battle stories
  if (type === 'all' || type === 'battle') {
    const battles = await db
      .select({
        id: battleStories.id,
        studentId: battleStories.studentId,
        title: battleStories.title,
        language: battleStories.language,
        readingStage: battleStories.readingStage,
        reviewStatus: battleStories.reviewStatus,
        createdAt: battleStories.createdAt,
        storyText: battleStories.storyText,
        matchup: battleStories.matchup,
        authorName: users.displayName,
      })
      .from(battleStories)
      .leftJoin(users, eq(users.id, battleStories.studentId))
      .where(eq(battleStories.reviewStatus, status))
      .orderBy(desc(battleStories.createdAt))
      .limit(50);

    items.push(
      ...battles.map((b) => ({
        ...b,
        contentType: 'battle' as const,
        preview: b.storyText?.substring(0, 200) + (b.storyText && b.storyText.length > 200 ? '...' : ''),
      }))
    );
  }

  // AI stories
  if (type === 'all' || type === 'ai') {
    const aiStories = await db
      .select({
        id: generatedStories.id,
        studentId: generatedStories.studentId,
        title: generatedStories.title,
        language: generatedStories.language,
        readingStage: generatedStories.readingStage,
        reviewStatus: generatedStories.reviewStatus,
        createdAt: generatedStories.generatedAt,
        theme: generatedStories.theme,
        pagesJson: generatedStories.pagesJson,
        authorName: users.displayName,
      })
      .from(generatedStories)
      .leftJoin(users, eq(users.id, generatedStories.studentId))
      .where(eq(generatedStories.reviewStatus, status))
      .orderBy(desc(generatedStories.generatedAt))
      .limit(50);

    items.push(
      ...aiStories.map((s) => {
        const pages = s.pagesJson as { text: string }[];
        const fullText = pages?.map((p) => p.text).join(' ') || '';
        return {
          ...s,
          contentType: 'ai' as const,
          preview: fullText.substring(0, 200) + (fullText.length > 200 ? '...' : ''),
        };
      })
    );
  }

  // Sort combined items by date
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Stats
  const [battlePending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(battleStories)
    .where(eq(battleStories.reviewStatus, 'pending'));

  const [aiPending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(generatedStories)
    .where(eq(generatedStories.reviewStatus, 'pending'));

  return NextResponse.json({
    items,
    stats: {
      battlePending: battlePending.count,
      aiPending: aiPending.count,
      totalPending: battlePending.count + aiPending.count,
    },
  });
}

/**
 * PATCH /api/moderation — Approve or reject content
 * Body: { id: string, contentType: 'battle' | 'ai', action: 'approve' | 'reject' }
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, contentType, action } = await req.json();

  if (!id || !contentType || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const db = getDb();

  if (contentType === 'battle') {
    await db
      .update(battleStories)
      .set({ reviewStatus: newStatus })
      .where(eq(battleStories.id, id));
  } else if (contentType === 'ai') {
    await db
      .update(generatedStories)
      .set({ reviewStatus: newStatus, reviewedBy: session.user.id })
      .where(eq(generatedStories.id, id));
  } else {
    return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
  }

  return NextResponse.json({ id, contentType, newStatus });
}
