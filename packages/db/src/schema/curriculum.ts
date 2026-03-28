import { pgTable, text, timestamp, uuid, real, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { classes } from './classes';

export const curriculumWordLists = pgTable('curriculum_word_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  ownerType: text('owner_type').notNull().default('teacher'), // teacher | parent
  language: text('language').notNull(),
  scriptType: text('script_type').notNull().default('latin'), // latin | cjk | rtl | hangul
  name: text('name').notNull(),
  words: jsonb('words').notNull().$type<string[]>(),
  matchMode: text('match_mode').notNull().default('word'), // character | word | syllable | pinyin
  version: integer('version').notNull().default(1),
  isSharedClassList: boolean('is_shared_class_list').notNull().default(false),
  classId: uuid('class_id').references(() => classes.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const studentCurriculumConfigs = pgTable('student_curriculum_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  wordlistIds: jsonb('wordlist_ids').notNull().$type<string[]>(),
  language: text('language').notNull(),
  filterEnabled: boolean('filter_enabled').notNull().default(false),
  thresholdPct: real('threshold_pct').notNull().default(0.9),
  showStretchBooks: boolean('show_stretch_books').notNull().default(true),
});
