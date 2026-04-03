import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, books, bookPages, quizAttempts } from '@tiny-story-world/db';
import { eq, and, desc } from 'drizzle-orm';

interface QuizQuestion {
  id: number;
  type: 'literal' | 'inferential' | 'applied';
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * POST /api/quizzes — Generate a comprehension quiz for a book
 * Body: { bookId: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId, curriculumWords } = await req.json();
  if (!bookId) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }
  const vocabWords: string[] | undefined = Array.isArray(curriculumWords) && curriculumWords.length > 0
    ? curriculumWords
    : undefined;

  const db = getDb();

  // Get book + pages
  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const pages = await db
    .select({ pageNumber: bookPages.pageNumber, textContent: bookPages.textContent })
    .from(bookPages)
    .where(eq(bookPages.bookId, bookId))
    .orderBy(bookPages.pageNumber);

  const fullText = pages.map((p) => p.textContent).join('\n');

  let questions: QuizQuestion[];

  // Try Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey !== 'mock') {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey });

      let vocabInstructions = '';
      if (vocabWords) {
        vocabInstructions = `\n\nCURRICULUM VOCABULARY:
The student is learning these words: ${vocabWords.join(', ')}
- When these words appear in the text, create questions that test understanding of those specific words
- At least 1-2 questions should focus on curriculum vocabulary words found in the text`;
      }

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are a K-6 reading comprehension quiz generator. Generate exactly 5 multiple-choice questions for a children's book.

Rules:
- Each question must have exactly 4 answer options (A, B, C, D)
- Include a mix of question types: 2 literal (facts from text), 2 inferential (understanding meaning), 1 applied (connecting to real life)
- Use language appropriate for the book's reading level
- Questions should be in the same language as the book text
- Return ONLY valid JSON, no markdown fences${vocabInstructions}`,
        messages: [
          {
            role: 'user',
            content: `Generate a comprehension quiz for this ${book.language} book titled "${book.title}" (reading stage: ${book.stage}):\n\n${fullText}\n\nReturn JSON array: [{ "id": 1, "type": "literal"|"inferential"|"applied", "question": "...", "options": ["A...", "B...", "C...", "D..."], "correctIndex": 0-3 }]`,
          },
        ],
      });

      const text =
        message.content[0].type === 'text' ? message.content[0].text : '';
      questions = JSON.parse(text.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
    } catch (err) {
      console.error('Claude quiz generation failed, using mock:', err);
      questions = generateMockQuiz(book.title, book.language, fullText);
    }
  } else {
    questions = generateMockQuiz(book.title, book.language, fullText);
  }

  return NextResponse.json({
    bookId: book.id,
    bookTitle: book.title,
    language: book.language,
    stage: book.stage,
    questions,
  });
}

/**
 * PATCH /api/quizzes — Submit quiz answers
 * Body: { bookId: string, answers: { questionId: number, selectedIndex: number, correct: boolean }[], score: number, comprehensionType: string }
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId, answers, score, comprehensionType } = await req.json();

  const db = getDb();
  const [attempt] = await db
    .insert(quizAttempts)
    .values({
      studentId: session.user.id,
      bookId,
      score: score ?? 0,
      answersJson: answers,
      comprehensionType: comprehensionType ?? 'mixed',
    })
    .returning();

  return NextResponse.json(attempt, { status: 201 });
}

/**
 * GET /api/quizzes?bookId=xxx — Get quiz history for a book
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json({ error: 'bookId param required' }, { status: 400 });
  }

  const db = getDb();
  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.studentId, session.user.id),
        eq(quizAttempts.bookId, bookId)
      )
    )
    .orderBy(desc(quizAttempts.attemptedAt))
    .limit(10);

  return NextResponse.json(attempts);
}

function generateMockQuiz(
  title: string,
  language: string,
  text: string
): QuizQuestion[] {
  // Extract some words from the text to make contextual questions
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  const isFrench = language === 'fr';

  if (isFrench) {
    return [
      {
        id: 1,
        type: 'literal',
        question: `Quel est le titre de cette histoire ?`,
        options: [title, 'Le petit prince', 'La belle et la bete', 'Les trois mousquetaires'],
        correctIndex: 0,
      },
      {
        id: 2,
        type: 'literal',
        question: `Combien de pages a cette histoire ?`,
        options: ['2 pages', '4 pages', '10 pages', '1 page'],
        correctIndex: 1,
      },
      {
        id: 3,
        type: 'inferential',
        question: `Quelle est l'idee principale de l'histoire ?`,
        options: [
          'Une aventure amusante',
          'Un probleme a resoudre',
          'Une lecon importante',
          'Toutes ces reponses',
        ],
        correctIndex: 3,
      },
      {
        id: 4,
        type: 'inferential',
        question: `Comment se sentent les personnages a la fin ?`,
        options: ['Heureux', 'Tristes', 'Effrayes', 'En colere'],
        correctIndex: 0,
      },
      {
        id: 5,
        type: 'applied',
        question: `Si tu etais dans cette histoire, que ferais-tu ?`,
        options: [
          'La meme chose',
          'Quelque chose de different',
          'Demander de l\'aide',
          'Ca depend de la situation',
        ],
        correctIndex: 3,
      },
    ];
  }

  return [
    {
      id: 1,
      type: 'literal',
      question: `What is the title of this story?`,
      options: [title, 'The Big Adventure', 'My Best Friend', 'A Sunny Day'],
      correctIndex: 0,
    },
    {
      id: 2,
      type: 'literal',
      question: `How many pages does this story have?`,
      options: ['2 pages', '4 pages', '10 pages', '1 page'],
      correctIndex: 1,
    },
    {
      id: 3,
      type: 'inferential',
      question: `What is the main idea of the story?`,
      options: [
        'A fun adventure',
        'A problem to solve',
        'An important lesson',
        'All of the above',
      ],
      correctIndex: 3,
    },
    {
      id: 4,
      type: 'inferential',
      question: `How do the characters feel at the end?`,
      options: ['Happy', 'Sad', 'Scared', 'Angry'],
      correctIndex: 0,
    },
    {
      id: 5,
      type: 'applied',
      question: `If you were in this story, what would you do?`,
      options: [
        'The same thing',
        'Something different',
        'Ask for help',
        'It depends on the situation',
      ],
      correctIndex: 3,
    },
  ];
}
