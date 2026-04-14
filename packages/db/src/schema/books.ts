import { pgTable, text, timestamp, uuid, integer, real, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { readingStageEnum } from './classes';
import { curriculumWordLists } from './curriculum';

export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  language: text('language').notNull(),
  scriptType: text('script_type').notNull().default('latin'),
  stage: readingStageEnum('stage').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  genre: text('genre'), // fiction | non-fiction
  themes: jsonb('themes').$type<string[]>(),
  pageCount: integer('page_count').notNull(),
  estReadingMinutes: integer('est_reading_minutes'),
  wordInventory: jsonb('word_inventory').$type<string[]>(),
  uniqueWordCount: integer('unique_word_count'),
  audioUrl: text('audio_url'),
  alignmentJson: jsonb('alignment_json'),
  coverImageUrl: text('cover_image_url'),
  isBenchmark: boolean('is_benchmark').notNull().default(false),
  hasPinyin: boolean('has_pinyin').notNull().default(false),
  hasZhuyin: boolean('has_zhuyin').notNull().default(false),
  hasRomaja: boolean('has_romaja').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Per-word timing for audio sync */
export interface WordAlignment {
  word: string;
  start: number; // seconds from page audio start
  end: number;
}

export const bookPages = pgTable('book_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookId: uuid('book_id').notNull().references(() => books.id),
  pageNumber: integer('page_number').notNull(),
  textContent: text('text_content').notNull(),
  translationEn: text('translation_en'),
  illustrationUrl: text('illustration_url'),
  vocabWords: jsonb('vocab_words').$type<string[]>(),
  /** Per-word timing alignment for karaoke highlighting */
  wordAlignments: jsonb('word_alignments').$type<WordAlignment[]>(),
  /** Page-level audio segment within book audio file */
  audioSegment: jsonb('audio_segment').$type<{ start: number; end: number }>(),
});

export const bookCurriculumScores = pgTable('book_curriculum_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookId: uuid('book_id').notNull().references(() => books.id),
  wordlistId: uuid('wordlist_id').notNull().references(() => curriculumWordLists.id),
  coveragePct: real('coverage_pct').notNull(),
  matchedCount: integer('matched_count').notNull(),
  totalCount: integer('total_count').notNull(),
  unmatchedWords: jsonb('unmatched_words').$type<string[]>(),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const readingSessions = pgTable('reading_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  bookId: uuid('book_id').notNull().references(() => books.id),
  mode: text('mode').notNull().default('read'), // listen | read | record | co-read
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  pagesRead: integer('pages_read'),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  bookId: uuid('book_id').notNull().references(() => books.id),
  score: real('score').notNull(),
  answersJson: jsonb('answers_json'),
  comprehensionType: text('comprehension_type'), // literal | inferential | applied
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
});

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  classId: uuid('class_id'),
  type: text('type').notNull().default('book'), // book | silly-sentences | ai-story | battle-story
  bookId: uuid('book_id').references(() => books.id),
  assignedTo: text('assigned_to').notNull().default('class'), // student | group | class
  assignedStudentId: uuid('assigned_student_id'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  requiredModes: jsonb('required_modes').$type<string[]>(),
  curriculumFilterEnabled: boolean('curriculum_filter_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
