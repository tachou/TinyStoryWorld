import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, generatedStories, curriculumWordLists } from '@tiny-story-world/db';
import { eq, desc } from 'drizzle-orm';

/* ------------------------------------------------------------------ */
/*  Stage-aware prompt templates                                       */
/* ------------------------------------------------------------------ */

const STAGE_TEMPLATES: Record<string, { pages: string; vocab: string; style: string }> = {
  emergent: {
    pages: '4-6 pages, 1-2 simple sentences per page',
    vocab: '~40 unique words, CVC words and high-frequency sight words only',
    style: 'Repetitive patterns (e.g., "I see a ___. I see a ___."). Very short sentences (2-5 words).',
  },
  beginner: {
    pages: '6-8 pages, 2-3 sentences per page',
    vocab: '~70 unique words, simple nouns, verbs, adjectives',
    style: 'Simple subject-verb-object sentences (4-8 words). Some repetition for reinforcement.',
  },
  in_transition: {
    pages: '8-10 pages, 3-4 sentences per page',
    vocab: '~100 unique words with varied vocabulary',
    style: 'Compound sentences with "and", "but", "so". Varied sentence starters. Include dialogue.',
  },
  competent: {
    pages: '10-12 pages, 4-5 sentences per page',
    vocab: '~150 unique words with rich descriptive language',
    style: 'Complex sentences with subordinate clauses. Similes and metaphors. Character development.',
  },
  experienced: {
    pages: '12-16 pages, 5-6 sentences per page',
    vocab: '~200 unique words with sophisticated vocabulary',
    style: 'Advanced literary devices. Multiple plot threads. Foreshadowing and irony.',
  },
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  'zh-Hans': 'Simplified Chinese',
};

const THEMES = [
  'adventure', 'friendship', 'animals', 'space', 'underwater',
  'magic', 'school', 'sports', 'nature', 'family', 'food', 'seasons',
];

/* ------------------------------------------------------------------ */
/*  Curriculum coverage calculation                                    */
/* ------------------------------------------------------------------ */

function calculateCoverage(
  storyText: string,
  wordList: Array<{ word: string; pos?: string; phonetic?: string }>,
  language: string
): number {
  if (wordList.length === 0) return 0;

  const storyLower = storyText.toLowerCase();
  let matchedCount = 0;

  for (const entry of wordList) {
    const word = entry.word.toLowerCase();
    if (language === 'zh-Hans') {
      // Character-level matching for Chinese
      if (storyLower.includes(word)) matchedCount++;
    } else {
      // Word boundary matching for Latin scripts
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(storyLower)) matchedCount++;
    }
  }

  return Math.round((matchedCount / wordList.length) * 100) / 100;
}

/* ------------------------------------------------------------------ */
/*  Build prompts                                                      */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(
  language: string,
  readingStage: string,
  wordList?: Array<{ word: string }>
): string {
  const langName = LANGUAGE_NAMES[language] || 'English';
  const template = STAGE_TEMPLATES[readingStage] || STAGE_TEMPLATES.beginner;

  let wordListInstructions = '';
  if (wordList && wordList.length > 0) {
    const words = wordList.map((w) => w.word).join(', ');
    wordListInstructions = `
CURRICULUM WORD LIST:
The student is learning these words: ${words}
- Use as MANY of these words as possible throughout the story
- Integrate them naturally into the narrative
- Words should appear in meaningful contexts that reinforce understanding
- Aim for at least 70% coverage of the word list`;
  }

  return `You are a creative children's story writer. You write engaging, educational stories for young readers (ages 4-10).

LANGUAGE: Write the entire story in ${langName}.

READING LEVEL (${readingStage}):
- Pages: ${template.pages}
- Vocabulary: ${template.vocab}
- Style: ${template.style}
${wordListInstructions}

STORY FORMAT:
- Return a JSON object with "title" (string) and "pages" (array of { "pageNumber": number, "text": string })
- Each page should be a natural paragraph break
- The story must have a clear beginning, middle, and satisfying ending
- Keep content age-appropriate, positive, and educational
- Include vivid descriptions and sensory details appropriate to the reading level

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`;
}

/* ------------------------------------------------------------------ */
/*  Mock story generator                                               */
/* ------------------------------------------------------------------ */

function generateMockStory(
  theme: string,
  language: string,
  readingStage: string,
  wordList?: Array<{ word: string }>
) {
  const words = wordList?.map((w) => w.word).slice(0, 5) || [];
  const wordSnippet = words.length > 0 ? ` about ${words.join(', ')}` : '';

  if (language === 'fr') {
    return {
      title: `Une histoire de ${theme}`,
      pages: [
        { pageNumber: 1, text: `Il était une fois, dans un monde merveilleux${wordSnippet}. Le soleil brillait et les oiseaux chantaient.` },
        { pageNumber: 2, text: `Un jour, quelque chose de magique s'est passé. Tout le monde était surpris et content.` },
        { pageNumber: 3, text: `Les amis ont décidé de partir à l'aventure ensemble. Ils étaient courageux et intelligents.` },
        { pageNumber: 4, text: `En chemin, ils ont découvert des choses incroyables. Chaque découverte les rendait plus forts.` },
        { pageNumber: 5, text: `À la fin, ils sont rentrés chez eux avec des souvenirs magnifiques. Quelle belle journée!` },
      ],
    };
  }

  if (language === 'zh-Hans') {
    return {
      title: `一个关于${theme}的故事`,
      pages: [
        { pageNumber: 1, text: `从前，在一个美丽的世界里${wordSnippet}。太阳照耀着，鸟儿在歌唱。` },
        { pageNumber: 2, text: `有一天，发生了一件神奇的事。大家都很惊喜。` },
        { pageNumber: 3, text: `朋友们决定一起去冒险。他们很勇敢，也很聪明。` },
        { pageNumber: 4, text: `在路上，他们发现了许多不可思议的东西。每一次发现都让他们更加强大。` },
        { pageNumber: 5, text: `最后，他们带着美好的回忆回到了家。多么美好的一天！` },
      ],
    };
  }

  return {
    title: `A ${theme} Story`,
    pages: [
      { pageNumber: 1, text: `Once upon a time, in a wonderful world${wordSnippet}. The sun was shining and the birds were singing.` },
      { pageNumber: 2, text: `One day, something magical happened. Everyone was surprised and happy.` },
      { pageNumber: 3, text: `The friends decided to go on an adventure together. They were brave and clever.` },
      { pageNumber: 4, text: `Along the way, they discovered incredible things. Each discovery made them stronger.` },
      { pageNumber: 5, text: `In the end, they returned home with wonderful memories. What a beautiful day!` },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  POST /api/stories — Generate a new AI story                        */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    theme = 'adventure',
    language = 'en',
    readingStage = 'beginner',
    wordlistId,
  } = body;

  const db = getDb();

  // Fetch word list if provided
  let wordList: Array<{ word: string; pos?: string; phonetic?: string }> | undefined;
  if (wordlistId) {
    const [wl] = await db
      .select({ words: curriculumWordLists.words })
      .from(curriculumWordLists)
      .where(eq(curriculumWordLists.id, wordlistId))
      .limit(1);
    if (wl) wordList = wl.words;
  }

  let title: string;
  let pages: { pageNumber: number; text: string }[];
  let promptUsed = '';

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.length > 10) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const systemPrompt = buildSystemPrompt(language, readingStage, wordList);
      const userPrompt = `Write a ${theme} story.${
        wordList ? ` Try to use these vocabulary words: ${wordList.map((w) => w.word).join(', ')}.` : ''
      }`;

      promptUsed = `${systemPrompt}\n---\n${userPrompt}`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text in response');
      }

      let jsonStr = textBlock.text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);
      title = parsed.title;
      pages = parsed.pages;
    } catch (err) {
      console.error('Claude API error, falling back to mock:', err);
      const mock = generateMockStory(theme, language, readingStage, wordList);
      title = mock.title;
      pages = mock.pages;
    }
  } else {
    const mock = generateMockStory(theme, language, readingStage, wordList);
    title = mock.title;
    pages = mock.pages;
  }

  // Calculate curriculum coverage
  let coveragePct: number | null = null;
  if (wordList && wordList.length > 0) {
    const fullText = pages.map((p) => p.text).join(' ');
    coveragePct = calculateCoverage(fullText, wordList, language);
  }

  // Save to database
  const [story] = await db
    .insert(generatedStories)
    .values({
      studentId: session.user.id,
      wordlistId: wordlistId || null,
      language,
      readingStage,
      title,
      pagesJson: pages,
      coveragePct,
      theme,
      promptUsed: promptUsed || null,
    })
    .returning();

  return NextResponse.json(story, { status: 201 });
}

/* ------------------------------------------------------------------ */
/*  GET /api/stories — List generated stories for current user         */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const stories = await db
    .select({
      id: generatedStories.id,
      title: generatedStories.title,
      theme: generatedStories.theme,
      language: generatedStories.language,
      readingStage: generatedStories.readingStage,
      coveragePct: generatedStories.coveragePct,
      generatedAt: generatedStories.generatedAt,
    })
    .from(generatedStories)
    .where(eq(generatedStories.studentId, session.user.id))
    .orderBy(desc(generatedStories.generatedAt))
    .limit(20);

  return NextResponse.json(stories);
}
