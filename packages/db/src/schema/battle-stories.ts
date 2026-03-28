import { pgTable, text, timestamp, uuid, integer, real, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { readingStageEnum } from './classes';
import { curriculumWordLists } from './curriculum';

export const battleVoteCategoryEnum = pgEnum('battle_vote_category', [
  'funniest',
  'smartest',
  'surprising',
  'best_plan',
]);

export const battleStories = pgTable('battle_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  language: text('language').notNull(),
  readingStage: readingStageEnum('reading_stage').notNull(),
  matchup: jsonb('matchup').notNull().$type<{
    fighterA: string;
    numberA: number;
    fighterB: string;
    numberB: number;
    setting: string;
    twist: string;
  }>(),
  title: text('title').notNull(),
  storyText: text('story_text').notNull(),
  pagesJson: jsonb('pages_json').$type<{ pageNumber: number; text: string }[]>(),
  audioAlignmentJson: jsonb('audio_alignment_json'),
  curriculumCoveragePct: real('curriculum_coverage_pct'),
  wordlistId: uuid('wordlist_id').references(() => curriculumWordLists.id),
  parentStoryId: uuid('parent_story_id'), // self-reference for remixes
  remixCount: integer('remix_count').notNull().default(0),
  voteCounts: jsonb('vote_counts').notNull().$type<{
    funniest: number;
    smartest: number;
    surprising: number;
    best_plan: number;
  }>().default({ funniest: 0, smartest: 0, surprising: 0, best_plan: 0 }),
  illustrationUrls: jsonb('illustration_urls').$type<string[]>(),
  isPublic: boolean('is_public').notNull().default(true),
  reviewStatus: text('review_status').notNull().default('approved'), // pending | approved | rejected
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const battleVotes = pgTable('battle_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  voterId: uuid('voter_id').notNull().references(() => users.id),
  storyId: uuid('story_id').notNull().references(() => battleStories.id),
  category: battleVoteCategoryEnum('category').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const battleChallenges = pgTable('battle_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  promptText: text('prompt_text').notNull(),
  constraintsJson: jsonb('constraints_json'),
  theme: text('theme'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const battleProgressions = pgTable('battle_progressions', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id).unique(),
  titleLevel: integer('title_level').notNull().default(1),
  badges: jsonb('badges').notNull().$type<string[]>().default([]),
  creationStreak: integer('creation_streak').notNull().default(0),
  remixStreak: integer('remix_streak').notNull().default(0),
  voteStreak: integer('vote_streak').notNull().default(0),
  totalStories: integer('total_stories').notNull().default(0),
  totalRemixes: integer('total_remixes').notNull().default(0),
  totalVotesReceived: integer('total_votes_received').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
