import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Schema exports
export * from './schema/users';
export * from './schema/classes';
export * from './schema/curriculum';
export * from './schema/books';
export * from './schema/battle-stories';
export * from './schema/generated-stories';

// Database connection (lazy init — only connects when imported in server context)
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const client = postgres(connectionString);
    _db = drizzle(client);
  }
  return _db;
}
