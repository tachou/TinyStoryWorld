import { pgTable, text, timestamp, uuid, integer, real, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { readingStageEnum } from './classes';
import { curriculumWordLists } from './curriculum';

export const generatedStories = pgTable('generated_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id),
  wordlistId: uuid('wordlist_id').references(() => curriculumWordLists.id),
  language: text('language').notNull(),
  readingStage: readingStageEnum('reading_stage').notNull(),
  title: text('title').notNull(),
  pagesJson: jsonb('pages_json').notNull().$type<{ pageNumber: number; text: string; illustrationUrl?: string }[]>(),
  audioAlignmentJson: jsonb('audio_alignment_json'),
  coveragePct: real('coverage_pct'),
  theme: text('theme'),
  promptUsed: text('prompt_used'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewStatus: text('review_status').notNull().default('pending'), // pending | approved | rejected
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const generatedStorySessions = pgTable('generated_story_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').notNull().references(() => generatedStories.id),
  studentId: uuid('student_id').notNull().references(() => users.id),
  mode: text('mode').notNull().default('read'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  pagesRead: integer('pages_read'),
});

export const sillySentencesSessions = pgTable('silly_sentences_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  language: text('language').notNull(),
  readingStage: readingStageEnum('reading_stage').notNull(),
  curriculumFilterEnabled: boolean('curriculum_filter_enabled').notNull().default(false),
  wordlistId: uuid('wordlist_id').references(() => curriculumWordLists.id),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  roundsPlayed: integer('rounds_played').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  streakBest: integer('streak_best').notNull().default(0),
});

