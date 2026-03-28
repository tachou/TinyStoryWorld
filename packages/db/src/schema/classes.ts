import { pgTable, text, timestamp, uuid, integer, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const readingStageEnum = pgEnum('reading_stage', [
  'emergent',
  'beginner',
  'in_transition',
  'competent',
  'experienced',
]);

export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  orgId: uuid('org_id'),
  name: text('name').notNull(),
  academicYear: text('academic_year').notNull(),
  maxStudents: integer('max_students').notNull().default(35),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  classId: uuid('class_id').notNull().references(() => classes.id),
  readingStage: readingStageEnum('reading_stage').notNull().default('emergent'),
  currentLevel: integer('current_level').notNull().default(1),
  staminaBand: text('stamina_band').notNull().default('2-5 min'),
  avgSessionMinutes: integer('avg_session_minutes').notNull().default(0),
  totalBooksRead: integer('total_books_read').notNull().default(0),
  totalStars: integer('total_stars').notNull().default(0),
  homeLanguage: text('home_language').notNull().default('en'),
  aiTutorMode: text('ai_tutor_mode').notNull().default('moderate'), // minimal | moderate | active | disabled
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const parentLinks = pgTable('parent_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  parentId: uuid('parent_id').notNull().references(() => users.id),
  studentId: uuid('student_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
