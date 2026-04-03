import { NextResponse } from 'next/server';
import { getDb, books, bookPages } from '@tiny-story-world/db';

/**
 * POST /api/seed — Seed sample books (dev only)
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const db = getDb();

  // ─── Book 1: Le chat et le chien (Emergent, FR) ─────────────────────
  const [book1] = await db.insert(books).values({
    language: 'fr',
    stage: 'emergent',
    title: 'Le chat et le chien',
    description: 'Un chat et un chien deviennent amis.',
    genre: 'fiction',
    themes: ['amiti\u00e9', 'animaux'],
    pageCount: 4,
    estReadingMinutes: 2,
    wordInventory: ['le', 'chat', 'et', 'chien', 'est', 'petit', 'grand', 'ami', 'joue', 'content'],
    uniqueWordCount: 10,
  }).returning();

  await db.insert(bookPages).values([
    {
      bookId: book1.id,
      pageNumber: 1,
      textContent: 'Le chat est petit.',
      wordAlignments: [
        { word: 'Le', start: 0, end: 0.3 },
        { word: 'chat', start: 0.3, end: 0.7 },
        { word: 'est', start: 0.7, end: 1.0 },
        { word: 'petit.', start: 1.0, end: 1.5 },
      ],
    },
    {
      bookId: book1.id,
      pageNumber: 2,
      textContent: 'Le chien est grand.',
      wordAlignments: [
        { word: 'Le', start: 0, end: 0.3 },
        { word: 'chien', start: 0.3, end: 0.7 },
        { word: 'est', start: 0.7, end: 1.0 },
        { word: 'grand.', start: 1.0, end: 1.5 },
      ],
    },
    {
      bookId: book1.id,
      pageNumber: 3,
      textContent: 'Le chat et le chien joue.',
      wordAlignments: [
        { word: 'Le', start: 0, end: 0.3 },
        { word: 'chat', start: 0.3, end: 0.6 },
        { word: 'et', start: 0.6, end: 0.8 },
        { word: 'le', start: 0.8, end: 1.0 },
        { word: 'chien', start: 1.0, end: 1.4 },
        { word: 'joue.', start: 1.4, end: 1.9 },
      ],
    },
    {
      bookId: book1.id,
      pageNumber: 4,
      textContent: 'Le chat est content. Le chien est content. Ils sont amis!',
      wordAlignments: [
        { word: 'Le', start: 0, end: 0.25 },
        { word: 'chat', start: 0.25, end: 0.55 },
        { word: 'est', start: 0.55, end: 0.8 },
        { word: 'content.', start: 0.8, end: 1.3 },
        { word: 'Le', start: 1.4, end: 1.6 },
        { word: 'chien', start: 1.6, end: 1.95 },
        { word: 'est', start: 1.95, end: 2.2 },
        { word: 'content.', start: 2.2, end: 2.7 },
        { word: 'Ils', start: 2.8, end: 3.0 },
        { word: 'sont', start: 3.0, end: 3.25 },
        { word: 'amis!', start: 3.25, end: 3.8 },
      ],
    },
  ]);

  // ─── Book 2: La pomme rouge (Beginner, FR) ──────────────────────────
  const [book2] = await db.insert(books).values({
    language: 'fr',
    stage: 'beginner',
    title: 'La pomme rouge',
    description: 'Une petite fille trouve une pomme rouge dans le jardin.',
    genre: 'fiction',
    themes: ['nature', 'nourriture'],
    pageCount: 5,
    estReadingMinutes: 3,
    wordInventory: ['la', 'pomme', 'rouge', 'fille', 'regarde', 'mange', 'bon', 'jardin', 'dans', 'une', 'arbre', 'trouve'],
    uniqueWordCount: 12,
  }).returning();

  await db.insert(bookPages).values([
    {
      bookId: book2.id,
      pageNumber: 1,
      textContent: 'La fille est dans le jardin.',
      wordAlignments: [
        { word: 'La', start: 0, end: 0.25 },
        { word: 'fille', start: 0.25, end: 0.6 },
        { word: 'est', start: 0.6, end: 0.85 },
        { word: 'dans', start: 0.85, end: 1.15 },
        { word: 'le', start: 1.15, end: 1.3 },
        { word: 'jardin.', start: 1.3, end: 1.8 },
      ],
    },
    {
      bookId: book2.id,
      pageNumber: 2,
      textContent: 'Elle regarde un arbre.',
      wordAlignments: [
        { word: 'Elle', start: 0, end: 0.3 },
        { word: 'regarde', start: 0.3, end: 0.7 },
        { word: 'un', start: 0.7, end: 0.9 },
        { word: 'arbre.', start: 0.9, end: 1.4 },
      ],
    },
    {
      bookId: book2.id,
      pageNumber: 3,
      textContent: 'Elle trouve une pomme rouge!',
      wordAlignments: [
        { word: 'Elle', start: 0, end: 0.3 },
        { word: 'trouve', start: 0.3, end: 0.65 },
        { word: 'une', start: 0.65, end: 0.85 },
        { word: 'pomme', start: 0.85, end: 1.2 },
        { word: 'rouge!', start: 1.2, end: 1.7 },
      ],
    },
    {
      bookId: book2.id,
      pageNumber: 4,
      textContent: 'La fille mange la pomme.',
      wordAlignments: [
        { word: 'La', start: 0, end: 0.25 },
        { word: 'fille', start: 0.25, end: 0.55 },
        { word: 'mange', start: 0.55, end: 0.9 },
        { word: 'la', start: 0.9, end: 1.05 },
        { word: 'pomme.', start: 1.05, end: 1.5 },
      ],
    },
    {
      bookId: book2.id,
      pageNumber: 5,
      textContent: 'La pomme est bon. Miam!',
      wordAlignments: [
        { word: 'La', start: 0, end: 0.25 },
        { word: 'pomme', start: 0.25, end: 0.6 },
        { word: 'est', start: 0.6, end: 0.85 },
        { word: 'bon.', start: 0.85, end: 1.25 },
        { word: 'Miam!', start: 1.35, end: 1.8 },
      ],
    },
  ]);

  // ─── Book 3: Le roi et le dragon (In-Transition, FR) ────────────────
  const [book3] = await db.insert(books).values({
    language: 'fr',
    stage: 'in_transition',
    title: 'Le roi et le dragon',
    description: 'Un roi courageux rencontre un dragon gentil.',
    genre: 'fiction',
    themes: ['aventure', 'courage', 'fantasy'],
    pageCount: 6,
    estReadingMinutes: 4,
    wordInventory: ['le', 'roi', 'dragon', 'est', 'brave', 'grand', 'gentil', 'ch\u00e2teau', 'vole', 'mange', 'ami', 'ensemble', 'joue', 'content', 'dit'],
    uniqueWordCount: 15,
  }).returning();

  await db.insert(bookPages).values([
    {
      bookId: book3.id,
      pageNumber: 1,
      textContent: 'Il \u00e9tait une fois un roi. Le roi est brave.',
      wordAlignments: [
        { word: 'Il', start: 0, end: 0.2 },
        { word: '\u00e9tait', start: 0.2, end: 0.5 },
        { word: 'une', start: 0.5, end: 0.7 },
        { word: 'fois', start: 0.7, end: 1.0 },
        { word: 'un', start: 1.0, end: 1.15 },
        { word: 'roi.', start: 1.15, end: 1.5 },
        { word: 'Le', start: 1.6, end: 1.75 },
        { word: 'roi', start: 1.75, end: 2.0 },
        { word: 'est', start: 2.0, end: 2.2 },
        { word: 'brave.', start: 2.2, end: 2.7 },
      ],
    },
    {
      bookId: book3.id,
      pageNumber: 2,
      textContent: 'Un jour, un grand dragon vole au-dessus du ch\u00e2teau.',
      wordAlignments: [
        { word: 'Un', start: 0, end: 0.2 },
        { word: 'jour,', start: 0.2, end: 0.5 },
        { word: 'un', start: 0.5, end: 0.65 },
        { word: 'grand', start: 0.65, end: 0.95 },
        { word: 'dragon', start: 0.95, end: 1.35 },
        { word: 'vole', start: 1.35, end: 1.65 },
        { word: 'au-dessus', start: 1.65, end: 2.1 },
        { word: 'du', start: 2.1, end: 2.25 },
        { word: 'ch\u00e2teau.', start: 2.25, end: 2.8 },
      ],
    },
    {
      bookId: book3.id,
      pageNumber: 3,
      textContent: 'Le roi dit: \u00abBonjour, dragon!\u00bb Le dragon est gentil.',
      wordAlignments: [
        { word: 'Le', start: 0, end: 0.2 },
        { word: 'roi', start: 0.2, end: 0.4 },
        { word: 'dit:', start: 0.4, end: 0.65 },
        { word: '\u00abBonjour,', start: 0.65, end: 1.1 },
        { word: 'dragon!\u00bb', start: 1.1, end: 1.6 },
        { word: 'Le', start: 1.7, end: 1.85 },
        { word: 'dragon', start: 1.85, end: 2.2 },
        { word: 'est', start: 2.2, end: 2.4 },
        { word: 'gentil.', start: 2.4, end: 2.9 },
      ],
    },
    {
      bookId: book3.id,
      pageNumber: 4,
      textContent: 'Le dragon mange des g\u00e2teaux. Il adore les g\u00e2teaux!',
      wordAlignments: [
        { word: 'Le', start: 0, end: 0.2 },
        { word: 'dragon', start: 0.2, end: 0.55 },
        { word: 'mange', start: 0.55, end: 0.85 },
        { word: 'des', start: 0.85, end: 1.0 },
        { word: 'g\u00e2teaux.', start: 1.0, end: 1.5 },
        { word: 'Il', start: 1.6, end: 1.75 },
        { word: 'adore', start: 1.75, end: 2.1 },
        { word: 'les', start: 2.1, end: 2.25 },
        { word: 'g\u00e2teaux!', start: 2.25, end: 2.8 },
      ],
    },
    {
      bookId: book3.id,
      pageNumber: 5,
      textContent: 'Le roi et le dragon joue ensemble.',
      wordAlignments: [
        { word: 'Le', start: 0, end: 0.2 },
        { word: 'roi', start: 0.2, end: 0.45 },
        { word: 'et', start: 0.45, end: 0.6 },
        { word: 'le', start: 0.6, end: 0.75 },
        { word: 'dragon', start: 0.75, end: 1.1 },
        { word: 'joue', start: 1.1, end: 1.4 },
        { word: 'ensemble.', start: 1.4, end: 2.0 },
      ],
    },
    {
      bookId: book3.id,
      pageNumber: 6,
      textContent: 'Le roi est content. Le dragon est content. Ils sont amis pour toujours!',
      wordAlignments: [
        { word: 'Le', start: 0, end: 0.2 },
        { word: 'roi', start: 0.2, end: 0.4 },
        { word: 'est', start: 0.4, end: 0.6 },
        { word: 'content.', start: 0.6, end: 1.05 },
        { word: 'Le', start: 1.15, end: 1.3 },
        { word: 'dragon', start: 1.3, end: 1.65 },
        { word: 'est', start: 1.65, end: 1.85 },
        { word: 'content.', start: 1.85, end: 2.3 },
        { word: 'Ils', start: 2.4, end: 2.55 },
        { word: 'sont', start: 2.55, end: 2.75 },
        { word: 'amis', start: 2.75, end: 3.05 },
        { word: 'pour', start: 3.05, end: 3.25 },
        { word: 'toujours!', start: 3.25, end: 3.9 },
      ],
    },
  ]);

  return NextResponse.json({
    message: 'Seeded 3 French books',
    books: [
      { id: book1.id, title: book1.title },
      { id: book2.id, title: book2.title },
      { id: book3.id, title: book3.title },
    ],
  });
}
