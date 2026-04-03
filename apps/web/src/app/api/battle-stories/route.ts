import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, battleStories } from '@tiny-story-world/db';
import { eq, desc, sql } from 'drizzle-orm';
import { validateMatchupSafety } from '@/features/battle/lib/contentSafety';
import { FIGHTERS_FR, FIGHTERS_ZH, SETTINGS_FR, SETTINGS_ZH, TWISTS_FR, TWISTS_ZH } from '@/features/battle/data/fighters';

/* ------------------------------------------------------------------ */
/*  System prompts by reading stage                                    */
/* ------------------------------------------------------------------ */

const STAGE_GUIDELINES: Record<string, string> = {
  emergent: `
    - Use only 1-3 word sentences
    - Simple CVC words and high-frequency sight words
    - Repetitive sentence patterns (e.g., "The cat ran. The dog ran.")
    - Maximum 4 pages, 1-2 sentences per page
    - Vocabulary: ~50 unique words total
  `,
  beginner: `
    - Use 4-8 word sentences
    - Simple sentence structures (subject-verb-object)
    - Some repetition for reinforcement
    - Maximum 6 pages, 2-3 sentences per page
    - Vocabulary: ~80 unique words total
    - Include basic adjectives and simple adverbs
  `,
  in_transition: `
    - Use 6-12 word sentences with some compound sentences
    - Varied sentence starters
    - 6-8 pages, 3-4 sentences per page
    - Vocabulary: ~120 unique words total
    - Include dialogue and descriptive language
  `,
  competent: `
    - Use varied sentence lengths (8-15 words)
    - Complex sentences with conjunctions
    - 8-10 pages, 4-5 sentences per page
    - Vocabulary: ~180 unique words total
    - Rich descriptive language, similes, and humor
    - Character development and plot twists
  `,
  experienced: `
    - Sophisticated sentence structures
    - 10-12 pages, 5-6 sentences per page
    - Vocabulary: ~250 unique words total
    - Advanced literary devices, metaphors, humor
    - Multiple plot threads, foreshadowing
  `,
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  'zh-Hans': 'Simplified Chinese',
};

function buildSystemPrompt(language: string, readingStage: string, curriculumWords?: string[]): string {
  const langName = LANGUAGE_NAMES[language] || 'English';
  const guidelines = STAGE_GUIDELINES[readingStage] || STAGE_GUIDELINES.beginner;

  let vocabularySection = '';
  if (curriculumWords && curriculumWords.length > 0) {
    vocabularySection = `
VOCABULARY WORDS:
The student is learning these words: ${curriculumWords.join(', ')}
- Weave these words naturally into the story where they fit
- Do not force words that don't fit the narrative
`;
  }

  return `You are a creative children's story writer for ages 4-10. You write fun, exciting battle stories that are age-appropriate and educational.

LANGUAGE: Write the entire story in ${langName}.

READING LEVEL GUIDELINES (stage: ${readingStage}):
${guidelines}
${vocabularySection}
STORY FORMAT:
- Return a JSON object with "title" (string) and "pages" (array of { "pageNumber": number, "text": string })
- Each page's text should be a natural paragraph break in the story
- The story should have a clear beginning, middle, and end
- The battle should be exciting but always end positively (friendship, teamwork, humor)
- Never include violence that could scare children — keep it playful and silly
- Include sound effects and action words to make it engaging

CONTENT SAFETY (CRITICAL):
- Never include real violence, weapons, blood, or death
- No bullying, name-calling, or mean behavior rewarded
- No scary themes (demons, zombies, horror)
- No adult content or references
- Battles must be resolved through cleverness, humor, teamwork, or friendship
- The ending must always be positive and age-appropriate
- If the fighters or setting seem inappropriate, reinterpret them in a silly, harmless way

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`;
}

function buildUserPrompt(matchup: {
  fighterA: string;
  numberA: number;
  fighterB: string;
  numberB: number;
  setting: string;
  twist: string;
}): string {
  return `Write a battle story about ${matchup.numberA} ${matchup.fighterA} vs ${matchup.numberB} ${matchup.fighterB} in ${matchup.setting}. The plot twist is: ${matchup.twist}.`;
}

/* ------------------------------------------------------------------ */
/*  Mock story generator (fallback when no API key)                    */
/* ------------------------------------------------------------------ */

function translateFighter(fighter: string, language: string): string {
  if (language === 'fr') return FIGHTERS_FR[fighter] || fighter;
  if (language === 'zh-Hans') return FIGHTERS_ZH[fighter] || fighter;
  return fighter;
}

function translateSetting(setting: string, language: string): string {
  if (language === 'fr') return SETTINGS_FR[setting] || setting;
  if (language === 'zh-Hans') return SETTINGS_ZH[setting] || setting;
  return setting;
}

function translateTwist(twist: string, language: string): string {
  if (language === 'fr') return TWISTS_FR[twist] || twist;
  if (language === 'zh-Hans') return TWISTS_ZH[twist] || twist;
  return twist;
}

function generateMockStory(
  matchup: {
    fighterA: string;
    numberA: number;
    fighterB: string;
    numberB: number;
    setting: string;
    twist: string;
  },
  language: string
) {
  const { numberA, numberB } = matchup;
  const fighterA = translateFighter(matchup.fighterA, language);
  const fighterB = translateFighter(matchup.fighterB, language);
  const setting = translateSetting(matchup.setting, language);
  const twist = translateTwist(matchup.twist, language);

  if (language === 'fr') {
    return {
      title: `${numberA} ${fighterA} contre ${numberB} ${fighterB}`,
      pages: [
        { pageNumber: 1, text: `Il était une fois, ${numberA} ${fighterA} et ${numberB} ${fighterB} se sont rencontrés dans ${setting}. L'air était électrique!` },
        { pageNumber: 2, text: `Les ${fighterA} ont chargé en premier! Ils étaient rapides et courageux. Les ${fighterB} se sont préparés.` },
        { pageNumber: 3, text: `Les ${fighterB} ont contre-attaqué avec un mouvement surprise! Tout le monde était impressionné par leur stratégie.` },
        { pageNumber: 4, text: `Puis quelque chose d'incroyable s'est passé: ${twist}!` },
        { pageNumber: 5, text: `À la fin, les ${fighterA} et les ${fighterB} sont devenus les meilleurs amis. Ils ont célébré ensemble dans ${setting}!` },
      ],
    };
  }

  if (language === 'zh-Hans') {
    return {
      title: `${numberA}个${fighterA}对战${numberB}个${fighterB}`,
      pages: [
        { pageNumber: 1, text: `从前，${numberA}个${fighterA}和${numberB}个${fighterB}在${setting}相遇了。空气中充满了紧张气氛！` },
        { pageNumber: 2, text: `${fighterA}先发起了进攻！它们又快又勇敢。${fighterB}做好了准备。` },
        { pageNumber: 3, text: `${fighterB}用一个出其不意的招式反击了！大家都被它们的策略惊呆了。` },
        { pageNumber: 4, text: `然后不可思议的事情发生了：${twist}！` },
        { pageNumber: 5, text: `最后，${fighterA}和${fighterB}成了最好的朋友。它们在${setting}一起庆祝！` },
      ],
    };
  }

  // Default: English
  return {
    title: `${numberA} ${fighterA} vs ${numberB} ${fighterB}`,
    pages: [
      { pageNumber: 1, text: `Once upon a time, ${numberA} ${fighterA} and ${numberB} ${fighterB} met in ${setting}. The air crackled with excitement!` },
      { pageNumber: 2, text: `The ${fighterA} charged first! They were fast and brave. The ${fighterB} braced themselves for the challenge.` },
      { pageNumber: 3, text: `The ${fighterB} fought back with a surprise move! Everyone was amazed by their clever strategy.` },
      { pageNumber: 4, text: `Then something incredible happened: ${twist}!` },
      { pageNumber: 5, text: `In the end, the ${fighterA} and the ${fighterB} became the best of friends. They celebrated together in ${setting}!` },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  POST /api/battle-stories — Generate a new battle story             */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { matchup, language = 'en', readingStage = 'beginner', parentStoryId, curriculumWords } = body;
  const vocabWords: string[] | undefined = Array.isArray(curriculumWords) && curriculumWords.length > 0
    ? curriculumWords
    : undefined;

  if (!matchup?.fighterA || !matchup?.fighterB) {
    return NextResponse.json({ error: 'matchup with fighterA and fighterB is required' }, { status: 400 });
  }

  // Content safety check
  const safetyError = validateMatchupSafety(matchup);
  if (safetyError) {
    return NextResponse.json({ error: safetyError }, { status: 400 });
  }

  let title: string;
  let pages: { pageNumber: number; text: string }[];

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.length > 10) {
    // Use Claude API for real story generation
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: buildSystemPrompt(language, readingStage, vocabWords),
        messages: [
          { role: 'user', content: buildUserPrompt(matchup) },
        ],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text in response');
      }

      // Parse the JSON response, stripping any markdown code fences
      let jsonStr = textBlock.text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);
      title = parsed.title;
      pages = parsed.pages;
    } catch (err) {
      console.error('Claude API error, falling back to mock:', err);
      const mock = generateMockStory(matchup, language);
      title = mock.title;
      pages = mock.pages;
    }
  } else {
    // No API key — use mock story
    const mock = generateMockStory(matchup, language);
    title = mock.title;
    pages = mock.pages;
  }

  const storyText = pages.map((p) => p.text).join('\n\n');

  // Calculate curriculum coverage if vocab words were provided
  let curriculumCoveragePct: number | null = null;
  let curriculumCoverage: { matched: string[]; unmatched: string[]; total: number } | undefined;
  if (vocabWords) {
    const storyLower = storyText.toLowerCase();
    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const word of vocabWords) {
      const wordLower = word.toLowerCase();
      let found = false;
      if (language === 'zh-Hans') {
        found = storyLower.includes(wordLower);
      } else {
        const regex = new RegExp(`\\b${wordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        found = regex.test(storyLower);
      }
      if (found) matched.push(word);
      else unmatched.push(word);
    }
    curriculumCoveragePct = vocabWords.length > 0
      ? Math.round((matched.length / vocabWords.length) * 100) / 100
      : null;
    curriculumCoverage = { matched, unmatched, total: vocabWords.length };
  }

  // Save to database
  const db = getDb();
  const [story] = await db
    .insert(battleStories)
    .values({
      studentId: session.user.id,
      language,
      readingStage,
      matchup,
      title,
      storyText,
      pagesJson: pages,
      parentStoryId: parentStoryId || null,
      curriculumCoveragePct,
    })
    .returning();

  // If this is a remix, increment the parent's remix count
  if (parentStoryId) {
    await db
      .update(battleStories)
      .set({
        remixCount: sql`${battleStories.remixCount} + 1`,
      })
      .where(eq(battleStories.id, parentStoryId));
  }

  return NextResponse.json({ ...story, curriculumCoverage }, { status: 201 });
}

/* ------------------------------------------------------------------ */
/*  GET /api/battle-stories — List battle stories for current student  */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const stories = await db
    .select({
      id: battleStories.id,
      title: battleStories.title,
      matchup: battleStories.matchup,
      language: battleStories.language,
      createdAt: battleStories.createdAt,
    })
    .from(battleStories)
    .where(eq(battleStories.studentId, session.user.id))
    .orderBy(desc(battleStories.createdAt))
    .limit(20);

  return NextResponse.json(stories);
}
