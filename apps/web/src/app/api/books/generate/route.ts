import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, curriculumWordLists } from '@tiny-story-world/db';
import { eq } from 'drizzle-orm';
import {
  callClaudeForBook,
  saveGeneratedBook,
  findDuplicateBatch,
  LEVEL_TARGETS,
  type ReadingLevel,
} from '@/lib/bookGeneration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateBody {
  wordlistId: string;
  level: ReadingLevel;
  count: number;
  emphasizedWords?: string[];
  hasPictures?: boolean;
  allowDuplicate?: boolean;
}

const VALID_LEVELS: ReadingLevel[] = [
  'emergent',
  'beginner',
  'in_transition',
  'competent',
  'experienced',
];

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function errorStream(status: number, message: string) {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(sseEvent({ type: 'error', message }))
      );
      controller.close();
    },
  });
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

/**
 * POST /api/books/generate — Batch-generate leveled readers from a word list.
 * Streams SSE progress events per book:
 *   { type: 'batch_start', count, wordlistName, level }
 *   { type: 'book_start', bookIndex }
 *   { type: 'book_done', bookIndex, bookId, title }
 *   { type: 'book_error', bookIndex, message }
 *   { type: 'batch_done', successCount, failureCount }
 *   { type: 'duplicate_warning', matches: [...] }  — only when allowDuplicate is false and matches found
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorStream(401, 'Unauthorized');
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return errorStream(403, 'Only teachers and admins can generate books');
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return errorStream(400, 'Invalid JSON body');
  }

  const { wordlistId, level, count, emphasizedWords = [], allowDuplicate } = body;

  if (!wordlistId || typeof wordlistId !== 'string') {
    return errorStream(400, 'wordlistId is required');
  }
  if (!level || !VALID_LEVELS.includes(level)) {
    return errorStream(400, `level must be one of ${VALID_LEVELS.join(', ')}`);
  }
  if (typeof count !== 'number' || count < 1 || count > 5 || !Number.isInteger(count)) {
    return errorStream(400, 'count must be an integer between 1 and 5');
  }
  if (!Array.isArray(emphasizedWords)) {
    return errorStream(400, 'emphasizedWords must be an array');
  }

  const db = getDb();

  const [wordList] = await db
    .select()
    .from(curriculumWordLists)
    .where(eq(curriculumWordLists.id, wordlistId))
    .limit(1);

  if (!wordList) {
    return errorStream(404, 'Word list not found');
  }

  // Ownership: owner, public list, or admin
  const owns = wordList.ownerId === session.user.id;
  const isPublic = (wordList as any).isPublic === true;
  if (role !== 'admin' && !owns && !isPublic) {
    return errorStream(403, 'You do not have access to this word list');
  }

  // Duplicate-batch soft check (skip if caller already acknowledged).
  const userId = session.user.id;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (evt: object) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(evt)));
        } catch {
          // Stream closed — ignore.
        }
      };

      try {
        if (!allowDuplicate) {
          const matches = await findDuplicateBatch({
            teacherId: userId,
            wordlistId,
            level,
            emphasizedWords,
          });
          if (matches.length > 0) {
            send({
              type: 'duplicate_warning',
              matches: matches.map((m) => ({
                id: m.id,
                title: m.title,
                createdAt: m.createdAt.toISOString(),
                isDraft: m.isDraft,
              })),
            });
            controller.close();
            return;
          }
        }

        send({
          type: 'batch_start',
          count,
          wordlistName: wordList.name,
          level,
          target: LEVEL_TARGETS[level],
        });

        const wordListArr = (wordList.words || []).map((w: any) => ({
          word: w.word,
          pos: w.pos,
        }));

        const avoidTitles: string[] = [];
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < count; i++) {
          send({ type: 'book_start', bookIndex: i });

          try {
            const generated = await callClaudeForBook({
              language: wordList.language,
              level,
              wordList: wordListArr,
              emphasizedWords,
              avoidTitles,
            });

            const saved = await saveGeneratedBook({
              generated,
              language: wordList.language,
              level,
              creatorId: userId,
              sourceWordlistId: wordlistId,
            });

            avoidTitles.push(generated.title);
            successCount++;

            send({
              type: 'book_done',
              bookIndex: i,
              bookId: saved.id,
              title: saved.title,
            });
          } catch (err) {
            failureCount++;
            const message =
              err instanceof Error ? err.message : 'Unknown generation error';
            console.error(`[generate] book ${i + 1}/${count} failed:`, err);
            send({
              type: 'book_error',
              bookIndex: i,
              message,
            });
          }
        }

        send({ type: 'batch_done', successCount, failureCount });
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Generation failed';
        send({ type: 'error', message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
