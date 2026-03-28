import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'student',
  'teacher',
  'parent',
  'admin',
  'editor',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  orgId: uuid('org_id').references(() => organizations.id),
  preferredLocale: text('preferred_locale').notNull().default('en'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('school'), // school | district
  licenseTier: text('license_tier').notNull().default('classroom'),
  licenseExpiry: timestamp('license_expiry', { withTimezone: true }),
  ssoConfig: text('sso_config'), // JSON string for SAML config
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
